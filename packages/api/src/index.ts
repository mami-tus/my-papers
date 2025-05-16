import { Hono } from 'hono';
import routes from './routes';
import { cors } from 'hono/cors';

/**
 * Honoアプリケーションの初期化
 *
 * ⚠️ 重要: メソッドチェーンの順序が処理の適用順序を決定します
 * 1. use() - ミドルウェアを追加（CORSなど）
 * 2. basePath() - APIのベースパスを設定
 * 3. route() - ルートハンドラを設定
 *
 * この順序を変更すると、CORSヘッダーが適切に設定されないなどの問題が発生します。
 */

const app = new Hono()
  .use(
    '/*',
    cors({
      origin: '*',
    }),
  )
  .basePath('/api')
  .route('', routes);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

export default app;
