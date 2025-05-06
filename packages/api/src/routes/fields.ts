import { Hono } from 'hono';
import { fields, papers } from '../db/schema';
import { zValidator } from '@hono/zod-validator';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDbClient } from '../db/drizzle';
import type { Variables } from '../middleware/auth';

// DBスキーマとZodスキーマの連携
const insertFieldSchema = createInsertSchema(fields, {
  id: z.coerce.number().int().positive('有効なIDを指定してください'),
  name: z
    .string()
    .min(1, '分野名は必須です')
    .max(100, '分野名は100文字以内で入力してください'),
});

const createFieldSchema = insertFieldSchema.pick({ name: true });
// ID 指定 (GET, PUT, DELETE のパラメータ) 用のスキーマ
const fieldIdSchema = insertFieldSchema.pick({ id: true });

const fieldsApp = new Hono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

// POST /api/fields - 新しい分野を登録
fieldsApp.post('/', zValidator('json', createFieldSchema), async (c) => {
  try {
    // バリデーション済みのリクエストボディを取得
    const { name } = c.req.valid('json');

    const userId = c.get('userId');

    // DBインスタンスの取得
    const db = createDbClient(c.env.DB);

    // 同じ名前の分野が既に存在するか確認
    const existingField = await db
      .select()
      .from(fields)
      .where(and(eq(fields.userId, userId), eq(fields.name, name)))
      .get();

    if (existingField !== undefined) {
      return c.json(
        { error: 'この分野名は既に登録されています', field: existingField },
        409
      );
    }

    // 新しい分野をDBに挿入
    // トランザクションにする
    const newField = await db
      .insert(fields)
      .values({
        userId,
        name,
      })
      .returning()
      .all();

    return c.json(newField, 201);
  } catch (error) {
    console.error('分野登録エラー:', error);
    return c.json(
      {
        error: `分野の登録に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

// GET /api/fields/:id/papers - 特定分野の論文一覧を取得
// 現状問題ないがより具体的なパスを先に定義する
fieldsApp.get('/:id/papers', zValidator('param', fieldIdSchema), async (c) => {
  try {
    const { id: fieldId } = c.req.valid('param');

    // 認証ミドルウェアからユーザーID取得
    const userId = c.get('userId');

    // DBインスタンスの取得
    const db = createDbClient(c.env.DB);

    // まず分野が存在するか確認
    const fieldExists = await db
      .select()
      .from(fields)
      .where(and(eq(fields.id, fieldId), eq(fields.userId, userId)))
      .get();

    if (!fieldExists) {
      return c.json({ error: '指定された分野が見つかりません' }, 404);
    }

    // 特定分野の論文一覧を取得
    const fieldPapers = await db
      .select()
      .from(papers)
      .where(and(eq(papers.userId, userId), eq(papers.fieldId, fieldId)))
      .all();

    return c.json(fieldPapers, 200);
  } catch (error) {
    console.error('分野別論文一覧取得エラー:', error);
    return c.json(
      {
        error: `分野別論文一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

// GET /api/fields - ユーザーの分野一覧を取得
fieldsApp.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    // DBインスタンスの取得
    const db = createDbClient(c.env.DB);

    // ユーザーの分野一覧を取得
    const userFields = await db
      .select()
      .from(fields)
      .where(eq(fields.userId, userId))
      .all();

    return c.json(userFields, 200);
  } catch (error) {
    console.error('分野一覧取得エラー:', error);
    return c.json(
      {
        error: `分野一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

export default fieldsApp;
