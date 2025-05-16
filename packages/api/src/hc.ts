import { hc } from 'hono/client';
import type app from '.';

/**
 * TypeScriptのコンパイル時最適化のためのコード
 *
 * 以下の実装には3つの重要な目的があります：
 * 1. コンパイル時に一度だけ複雑な型計算を行う
 * 2. エディタ(tsserver)の負担を減らしてIDEの応答性を向上させる
 * 3. 型安全なクライアントを提供する
 */

// ダミークライアントを作成して型情報を抽出（実際には使用されない）
// 空文字を渡すことで、実際のURLなしでも型情報だけを取得できる
const client = hc<typeof app>('');
export type Client = typeof client;

// 型安全なクライアント生成関数
// hc関数と同じパラメータを受け取りつつ、返り値の型がClient型であることを保証する
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args);
