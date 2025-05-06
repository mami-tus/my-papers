import { Hono } from 'hono';
import { papers, fields } from '../db/schema';
import { zValidator } from '@hono/zod-validator';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDbClient } from '../db/drizzle';
import type { Variables } from '../middleware/auth';
import { fetchPaperMetadata } from '../lib/crossref';

// DBスキーマとZodスキーマの連携
const insertPaperSchema = createInsertSchema(papers, {
  doi: z.string().min(1, 'DOIを入力してください'),
});

// 論文登録用のスキーマ（フィールドIDを追加）
const createPaperSchema = insertPaperSchema.pick({ doi: true, fieldId: true });

const papersApp = new Hono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

// POST /api/papers - 新しい論文を登録
papersApp.post('/', zValidator('json', createPaperSchema), async (c) => {
  try {
    // バリデーション済みのリクエストボディを取得
    const { doi, fieldId } = c.req.valid('json');

    // 認証ミドルウェアからユーザーID取得
    const userId = c.get('userId');

    // DBインスタンスの取得
    const db = createDbClient(c.env.DB);

    // 指定された分野が存在するか確認
    const existingField = await db
      .select()
      .from(fields)
      .where(and(eq(fields.id, fieldId), eq(fields.userId, userId)))
      .get();

    if (existingField === undefined) {
      return c.json({ error: '指定された分野が見つかりません' }, 404);
    }

    // 分野内で重複した論文があるか確認
    const existingPaper = await db
      .select()
      .from(papers)
      .where(
        and(
          eq(papers.userId, userId),
          eq(papers.fieldId, fieldId),
          eq(papers.doi, doi)
        )
      )
      .get();

    if (existingPaper !== undefined) {
      return c.json(
        {
          error: 'この論文は分野内で既に登録されています',
          paper: existingPaper,
        },
        409
      );
    }

    // DOIから論文情報を取得
    const metadata = await fetchPaperMetadata(doi);
    if (metadata === null) {
      return c.json({ error: 'DOIから論文情報を取得できませんでした' }, 404);
    }

    // 新しい論文をDBに挿入
    const newPaper = await db
      .insert(papers)
      .values({
        ...metadata,
        userId,
        fieldId,
      })
      .returning()
      .get();

    return c.json(newPaper, 201);
  } catch (error) {
    console.error('論文登録エラー:', error);
    return c.json(
      {
        error: `論文の登録に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

export default papersApp;
