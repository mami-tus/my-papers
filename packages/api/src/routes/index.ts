import { Hono } from 'hono';
import fieldsApp from './fields';
import papersApp from './papers';
import { authMiddleware } from '../middleware/auth';

// メインルーターの作成
const apiRouter = new Hono()
  .use(authMiddleware)
  // 各ルートを追加
  .route('/fields', fieldsApp)
  .route('/papers', papersApp);

export default apiRouter;
