import { Hono } from 'hono';
import fieldsApp from './fields';
import type { Bindings } from '../index';
// import papersApp from './papers'; // 論文APIが実装されたら有効化

// メインルーターの作成
const apiRouter = new Hono<{ Bindings: Bindings }>();

// 各ルートを追加
apiRouter.route('/fields', fieldsApp);
// apiRouter.route('/papers', papersApp); // 論文APIが実装されたら有効化

export default apiRouter;
