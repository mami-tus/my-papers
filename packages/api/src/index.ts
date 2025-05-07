import { Hono } from 'hono';
import apiRouter from './routes';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// APIルートをマウント
app.route('/api', apiRouter);

// アプリケーション全体の型をエクスポート
export type AppType = typeof app;

export default app;
