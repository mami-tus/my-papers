import { Hono } from 'hono';
import fields from './fields';
import papers from './papers';
import { authMiddleware } from '../middleware/auth';

// メインルーターの作成
const routes = new Hono()
  .use(authMiddleware)
  // 各ルートを追加
  .route('/fields', fields)
  .route('/papers', papers);

export default routes;
