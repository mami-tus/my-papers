/*
  DO NOT RENAME THIS FILE FOR DRIZZLE-ORM TO WORK
*/
import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  // システムを拡張したりする段階で 、 必要に応じてULIDへの変更を検討する
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
});
