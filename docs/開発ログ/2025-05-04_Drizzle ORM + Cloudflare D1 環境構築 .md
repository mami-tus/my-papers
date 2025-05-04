# 2025-05-04 Drizzle ORM + Cloudflare D1 環境構築

## 主な流れと結果:

### 1. Cloudflare 設定:

- API ディレクトリ内で Cloudflare アカウント認証:

  ```bash
  pnpm wrangler login
  ```

- D1 データベースを作成、ID 等を取得:

  ```bash
  pnpm wrangler d1 create my-papers-db
  ```

- `packages/api/wrangler.jsonc` に D1 バインディング設定を追記:
  ```json
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-papers-db",
      "database_id": "${process.env.CLOUDFLARE_DATABASE_ID}"
    }
  ]
  ```

### 2. Drizzle Kit 設定 (`d1-http` ドライバ試行):

- **`packages/api/drizzle/drizzle.config.ts`** を作成:

  ```typescript
  import { defineConfig } from 'drizzle-kit';

  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
      databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
      token: process.env.CLOUDFLARE_D1_TOKEN || '',
    },
  });
  ```

### 3. スキーマ定義とマイグレーション生成:

- `packages/api/src/db/schema.ts` に `users` テーブル（`id`, `name` のみ）を定義:

  ```typescript
  import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core';

  export const users = sqliteTable('users', {
    // システムを拡張したりする段階で 、 必要に応じてULIDへの変更を検討する
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
  });
  ```

- マイグレーションファイル生成:
  ```bash
  pnpm run db:generate
  ```

### 4. マイグレーション適用:

- ローカル DB へのマイグレーション適用:

  ```bash
  pnpm run db:migrate:local
  # 内部で以下が実行される
  # wrangler d1 migrations apply my-papers-db --local
  ```

- デフォルトユーザー挿入と確認:

  ```bash
  # ユーザー追加
  npx wrangler d1 execute my-papers-db --local --command="INSERT INTO users (name) VALUES ('default_user')"

  # データ確認
  npx wrangler d1 execute my-papers-db --local --command="SELECT * FROM users"

  # 結果:
  # ┌────┬──────────────┐
  # │ id │ name         │
  # ├────┼──────────────┤
  # │ 1  │ default_user │
  # └────┴──────────────┘
  ```

### 5. Hono でのデータ取得:

- `packages/api/src/index.ts` を編集:

  ```typescript
  import { Hono } from 'hono';
  import { drizzle } from 'drizzle-orm/d1';
  import { users } from './db/schema';

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

  export default app;
  ```

- CloudflareWorkers 型定義の生成:

  ```bash
  # package.jsonに追加
  "cf-typegen": "wrangler types --env-interface CloudflareBindings"

  # 実行
  pnpm run cf-typegen
  ```

  この生成された `worker-configuration.d.ts` により、wrangler.jsonc で定義したバインディングの型情報が自動的に提供され、TypeScript のインテリセンス補完と型チェックが有効になる。バインディング名を変更した場合も型が自動更新されるため保守性が向上する。これがないと D1Database 型が認識されず、コンパイルエラーが発生する。

- API サーバー起動と動作確認:

  ```bash
  # ローカル開発サーバー起動
  pnpm run dev
  ```

  `/users` エンドポイントにアクセスして、データベースからユーザー情報（デフォルトユーザー）が JSON で取得できることを**確認・成功**。

## 最終的な構成要素:

- **パッケージマネージャー:** pnpm (Corepack 管理)
- **Node.js:** 最新安定版 (Homebrew 経由)
- **バックエンド:** Hono (on Cloudflare Workers)
- **データベース:** Cloudflare D1
- **ORM/マイグレーション:** Drizzle ORM + Drizzle Kit (`d1-http` ドライバを使用)
- **フロントエンド:** React + Vite + Tailwind CSS (セットアップ済み)
- **開発ツール:** Wrangler, Biome

## 結論:

Drizzle ORM (`d1-http` ドライバ) と Drizzle Kit を使うことで、Kysely + `better-sqlite3` で発生したネイティブアドオン問題を回避し、Cloudflare D1 データベースに対するスキーマ定義、マイグレーション、および Hono からのデータ取得に成功した。
