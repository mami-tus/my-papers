import { drizzle } from 'drizzle-orm/d1';

export const createDbClient = (env: D1Database) => {
  return drizzle(env, { casing: 'snake_case' });
};
