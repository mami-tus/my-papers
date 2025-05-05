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
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  ...timestamps,
});

export const fields = sqliteTable(
  'fields',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer()
      .notNull()
      .references(() => users.id),
    name: text().notNull(),
    ...timestamps,
  },
  (table) => [unique().on(table.userId, table.name)]
);

export const papers = sqliteTable(
  'papers',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer()
      .notNull()
      .references(() => users.id),
    fieldId: integer()
      .notNull()
      .references(() => fields.id),
    doi: text().notNull(),
    title: text().notNull(),
    year: integer().notNull(),
    authors: blob({ mode: 'json' }).$type<string[]>(),
    ...timestamps,
  },
  (table) => [unique().on(table.userId, table.fieldId, table.doi)]
);
