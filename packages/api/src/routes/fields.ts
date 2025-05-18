import { Hono } from 'hono';
import { fields, papers } from '../db/schema';
import { zValidator } from '@hono/zod-validator';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDbClient } from '../db/drizzle';
import type { Variables } from '../middleware/auth';
import {
  createRelatedPapersPrompt,
  generateTextWithGemini,
} from '../lib/gemini';
import { fetchPaperMetadata } from '../lib/crossref';

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
}>()

  // POST /api/fields - 新しい分野を登録
  .post('/', zValidator('json', createFieldSchema), async (c) => {
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
          409,
        );
      }

      // 新しい分野をDBに挿入
      // TODO: トランザクションにする
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
        500,
      );
    }
  })

  // POST /api/fields/:id/papers/suggest - 特定分野の関連論文の提案
  .post(
    '/:id/papers/suggest',
    zValidator('param', fieldIdSchema),
    async (c) => {
      try {
        const { id: fieldId } = c.req.valid('param');
        const userId = c.get('userId');

        // DBインスタンスの取得
        const db = createDbClient(c.env.DB);

        // まず分野が存在するか確認
        const field = await db
          .select()
          .from(fields)
          .where(eq(fields.id, fieldId))
          .get();

        if (!field) {
          return c.json(
            { success: false, error: '指定された分野が見つかりません' },
            404,
          );
        }

        // 特定分野の論文一覧を取得
        const fieldPapers = await db
          .select()
          .from(papers)
          .where(and(eq(papers.userId, userId), eq(papers.fieldId, fieldId)))
          .all();

        if (fieldPapers.length === 0) {
          return c.json(
            {
              success: false,
              error: 'この分野にはまだ論文が登録されていません',
            },
            400,
          );
        }

        // Gemini APIへのプロンプト用に論文データを整形
        const paperData = fieldPapers.map((paper) => ({
          title: paper.title,
          authors: Array.isArray(paper.authors)
            ? paper.authors.join(', ')
            : undefined,
          year: paper.year || undefined,
        }));

        // プロンプトを生成
        const prompt = createRelatedPapersPrompt({
          papers: paperData,
          field: field.name,
        });

        // Gemini APIでの生成
        const response = await generateTextWithGemini({
          env: c.env,
          prompt,
          options: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        });

        // AIレスポンスからDOIを抽出
        const extractedDois = extractDoisFromGeminiResponse(response);

        // 抽出したDOIからメタデータを取得
        const suggestedPapers = await Promise.all(
          extractedDois.map(async (doi) => {
            try {
              const metadata = await fetchPaperMetadata(doi);
              if (metadata !== null) {
                return {
                  doi,
                  title: metadata.title,
                  authors: metadata.authors || [],
                  year: metadata.year,
                  month: metadata.month,
                  day: metadata.day,
                };
              }
              return null;
            } catch (error) {
              console.error(`DOI ${doi} のメタデータ取得に失敗:`, error);
              return { doi, title: '情報取得エラー', authors: [] };
            }
          }),
        ).then((papers) => papers.filter((paper) => paper !== null));

        return c.json({
          success: true,
          fieldName: field.name,
          paperCount: fieldPapers.length,
          suggestions: response,
          suggestedPapers,
        });
      } catch (error) {
        console.error('論文提案エラー:', error);
        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          500,
        );
      }
    },
  )

  // GET /api/fields/:id/papers - 特定分野の論文一覧を取得
  // 現状問題ないがより具体的なパスを先に定義する
  .get('/:id/papers', zValidator('param', fieldIdSchema), async (c) => {
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
        500,
      );
    }
  })

  // GET /api/fields - ユーザーの分野一覧を取得
  .get('/', async (c) => {
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
        500,
      );
    }
  });

// Geminiのレスポンスからすべてのドイを抽出
const extractDoisFromGeminiResponse = (text: string): string[] => {
  const dois: string[] = [];
  const lines = text.split('\n');

  // 「DOI: 」で始まる行からDOIを抽出
  for (const line of lines) {
    if (line.trim().startsWith('DOI:')) {
      const doiPart = line.trim().substring(4).trim();
      // 基本的なDOI形式の検証 (10.xxxx/xxxx)
      if (doiPart.match(/^10\.\d{4,}\/[^\s,;:\\"'<>()[\]{}]+$/)) {
        dois.push(doiPart);
      }
    }
  }

  // 重複を除去
  return [...new Set(dois)];
};

export default fieldsApp;
