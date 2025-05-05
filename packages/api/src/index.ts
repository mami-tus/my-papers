import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { papers, users } from './db/schema';
import { fetchPaperMetadata } from './lib/crossref';
import { sql } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/users', async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select().from(users).all();

  return c.json(allUsers, 200);
});

// 論文情報を取得するエンドポイント
app.get('/paper/:doi', async (c) => {
  const doi = c.req.param('doi');

  try {
    const metadata = await fetchPaperMetadata(doi);
    if (!metadata) {
      return c.json({ error: '論文が見つかりませんでした' }, 404);
    }
    return c.json(metadata);
  } catch (error) {
    return c.json(
      {
        error: `論文の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

// 論文を保存するエンドポイント
app.post('/papers', async (c) => {
  const { doi, field } = await c.req.json();

  // 必須パラメータの検証
  if (!doi || !field) {
    return c.json({ error: 'DOIとfieldは必須です' }, 400);
  }

  // ユーザーID取得（認証実装に応じて変更）
  const userId = 1; // 仮のユーザーID

  try {
    // DBインスタンスの取得
    const db = drizzle(c.env.DB);

    // 既存の論文を確認
    const existingPaper = await db
      .select()
      .from(papers)
      .where(
        sql`${papers.userId} = ${userId} AND ${papers.doi} = ${doi} AND ${papers.field} = ${field}`
      )
      .get();

    if (existingPaper) {
      return c.json(
        { error: 'この論文は既に登録されています', paper: existingPaper },
        409
      );
    }

    // CrossRefからメタデータ取得
    const metadata = await fetchPaperMetadata(doi);
    if (!metadata) {
      return c.json({ error: '論文が見つかりませんでした' }, 404);
    }

    // 著者名の配列を作成
    const authorNames = metadata.authors.map((author) => author.name);

    // DBに保存
    const newPaper = await db
      .insert(papers)
      .values({
        userId,
        doi,
        field,
        title: metadata.title,
        year: metadata.year || new Date().getFullYear(), // 年が取得できない場合は現在の年を使用
        authors: authorNames,
      })
      .returning()
      .get();

    return c.json(newPaper, 201);
  } catch (error) {
    console.error('論文保存エラー:', error);
    return c.json(
      {
        error: `論文の保存に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      500
    );
  }
});

export default app;
