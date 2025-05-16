import { createMiddleware } from 'hono/factory';
// import { verify } from 'hono/jwt';

export type Variables = {
  userId: number;
};

// 認証ミドルウェア
export const authMiddleware = createMiddleware<{
  Variables: Variables;
}>(async (c, next) => {
  try {
    // // Authorizationヘッダーからトークン取得
    // const token = c.req.header('Authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return c.json({ error: '認証が必要です' }, 401);
    // }

    // // JWTの検証
    // const payload = await verify(token, c.env.JWT_SECRET);

    // // ユーザーIDをコンテキストに設定
    // // c.set('userId', payload.sub);

    // 一旦デフォルトユーザーのIDを設定
    c.set('userId', 1);

    await next();
  } catch (error) {
    console.error(error);
    return c.json({ error: '無効な認証トークンです' }, 401);
  }
});
