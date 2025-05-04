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
