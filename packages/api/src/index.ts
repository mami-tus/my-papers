import { Hono } from 'hono';
import apiRouter from './routes';
import { cors } from 'hono/cors';

const app = new Hono();

// CORSミドルウェアを追加
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // フロントエンドのURL
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// APIルートをマウント
const routes = app.route('/api', apiRouter);

// アプリケーション全体の型をエクスポート
export type AppType = typeof routes;

export default app;
