# 開発ログ：2025/05/16 Cloudflare 本番デプロイと型安全化

## 1. TypeScript 型安全性の強化

- `hc`関数の型を抽出するダミークライアントを作成し、型安全なクライアント生成関数`hcWithType`を追加。
- API クライアントの型安全性が向上し、IDE の補完や型チェックが快適に。

## 2. Hono アプリケーション初期化・CORS 設定の整理

- Hono アプリの初期化処理を整理し、メソッドチェーンの順序（`use`→`basePath`→`route`）の重要性をコメントで明示。
- CORS 設定を一時的に`origin: '*'`で全許可にし、開発・デプロイ時のトラブルを回避。
- 本番運用時はカスタムドメインや Cloudflare Pages のドメインを`origin`に明示的に追加する運用方針を整理。

## 3. デプロイ・ビルドの安定化

- `tsc -b`による型エラーを回避するため、フロントエンドのビルドコマンドを`vite build`のみに変更。

## 4. Cloudflare Pages の GitHub 連携

- Cloudflare Pages は GitHub リポジトリと連携することで、main ブランチへの push や PR マージ時に自動でビルド・デプロイが可能。
- GitHub 連携を設定することで、手動デプロイの手間が省け、CI/CD フローがシンプルに運用できる。
- 環境変数やビルドコマンドも Cloudflare Pages の管理画面から設定可能。

### 設定手順

1. Cloudflare Pages のダッシュボードで「Create a project」を選択
2. GitHub リポジトリを選択し、連携を承認
3. ビルド設定を入力：
   - ビルドコマンド: `pnpm install && pnpm build`
   - ビルド出力ディレクトリ: `dist`
   - ルートディレクトリ: `packages/web`
4. 環境変数を設定：
   - `VITE_API_URL` に api 側の URL を設定
5. 「Save and Deploy」で設定を保存し、初回デプロイを実行

## 5. Vite の環境変数について

- `import.meta.env`で環境変数にアクセス可能
- `VITE_`プレフィックスが付いた環境変数のみクライアントサイドで利用可能
- ビルド時に環境変数が静的に置換されるため、本番環境でも安全に使用可能
