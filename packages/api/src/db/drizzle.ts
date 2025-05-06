import { drizzle } from 'drizzle-orm/d1';

export const createDbClient = (env: D1Database) => {
  // TypeScriptのcamelCaseをデータベース内のsnake_caseに自動的にマッピング
  return drizzle(env, { casing: 'snake_case' });
};
