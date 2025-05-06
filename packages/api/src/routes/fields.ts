import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { fields } from '../db/schema';
import { zValidator } from '@hono/zod-validator';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { Bindings } from '../index';
import { eq, and } from 'drizzle-orm';
import { createDbClient } from '../db/drizzle';

// DBスキーマとZodスキーマの連携
const insertFieldSchema = createInsertSchema(fields, {
  name: z
    .string()
    .min(1, '分野名は必須です')
    .max(100, '分野名は100文字以内で入力してください'),
});
const createFieldSchema = insertFieldSchema.pick({ name: true });

const fieldsApp = new Hono<{ Bindings: Bindings }>();

// POST /api/fields - 新しい分野を登録
fieldsApp.post('/', zValidator('json', createFieldSchema), async (c) => {
  try {
    // バリデーション済みのリクエストボディを取得
    const { name } = c.req.valid('json');

    // TODO: ユーザー登録
    const userId = 1; // 手動登録したデフォルトユーザーのID

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

// GET /api/fields - ユーザーの分野一覧を取得
fieldsApp.get('/', async (c) => {
  try {
    // ユーザーID取得（認証実装後に変更）
    const userId = 1; // 仮のユーザーID

    // DBインスタンスの取得
    const db = drizzle(c.env.DB);

    // ユーザーの分野一覧を取得
    const userFields = await db
      .select()
      .from(fields)
      .where(eq(fields.userId, userId))
      .all();

    return c.json(userFields);
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
