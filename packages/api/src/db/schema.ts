import { sql } from 'drizzle-orm';
import {
  blob,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`)
    .$onUpdateFn(() => sql`(current_timestamp)`),
};

export const users = sqliteTable('users', {
  // システムを拡張したりする段階で 、 必要に応じてULIDへの変更を検討する
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ...timestamps,
});

export const papers = sqliteTable(
  'papers',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer()
      .notNull()
      .references(() => users.id),
    field: text().notNull(),
    doi: text().notNull(),
    title: text().notNull(),
    year: integer().notNull(),
    authors: blob({ mode: 'json' }).$type<string[]>(),
    ...timestamps,
  },
  (table) => [
    unique('unique_user_field_doi').on(table.userId, table.field, table.doi),
  ]
);
