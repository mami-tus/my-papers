import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  // ⚠️ 警告: この出力先を変更すると、package.jsonのマイグレーションスクリプトが機能しなくなります
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  casing: 'snake_case',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
});
