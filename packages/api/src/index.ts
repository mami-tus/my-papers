import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { papers, users, fields } from './db/schema';
import { fetchPaperMetadata } from './lib/crossref';
import { sql } from 'drizzle-orm';
import apiRouter from './routes';
import { createDbClient } from './db/drizzle';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// 検証用
app.get('/users', async (c) => {
  const db = createDbClient(c.env.DB);
  const allUsers = await db.select().from(users).all();
  console.log(allUsers);
  return c.json(allUsers, 200);
});

// APIルートをマウント
app.route('/api', apiRouter);

export default app;
