# 開発ログ

このドキュメントでは、プロジェクトの実装過程や意思決定の記録を時系列で残していきます。

# 2025-05-13 Tailwind CSS v4 対応と shadcn UI 導入

## 実装内容

- Tailwind CSS v4 での変数参照エラーの解決
- CSS インポート文の簡略化（`@import "tailwindcss";`）
- shadcn UI のインストールと設定
- CreateFieldModal コンポーネントの shadcn UI 化
- Form, Dialog, Button などの基本コンポーネントの導入
- React Hook Form と zod によるフォームバリデーションの実装
- Radix UI との連携

## 追加した依存関係

```json
"dependencies": {
  "@hookform/resolvers": "^5.0.1",
  "@radix-ui/react-dialog": "^1.1.13",
  "@radix-ui/react-label": "^2.1.6",
  "@radix-ui/react-slot": "^1.2.2",
  "react-hook-form": "^7.56.3",
  "zod": "^3.24.4"
}
```

## コード例

### Tailwind CSS v4 の簡略化されたインポート

```css
/* 以前のバージョン */
@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'tailwindcss/preflight';

/* Tailwind CSS v4 */
@import 'tailwindcss';
```

### shadcn UI の Dialog を使ったモーダル実装

```tsx
// 従来のモーダル
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-card text-card-foreground rounded-lg p-6 w-full max-w-md shadow-lg border border-border">
    {/* モーダルコンテンツ */}
  </div>
</div>

// shadcn UIのDialog
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Add New Field</DialogTitle>
    </DialogHeader>
    {/* ダイアログコンテンツ */}
  </DialogContent>
</Dialog>
```

### zod と React Hook Form による型安全なフォーム

```tsx
// スキーマ定義
const formSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
});

// フォーム設定
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
  },
});

// フォーム送信処理
function onSubmit(values: z.infer<typeof formSchema>) {
  mutate(
    { name: values.name },
    {
      onSuccess: () => {
        onClose();
        form.reset();
      },
      onError: (err) => {
        form.setError('name', {
          message:
            err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      },
    }
  );
}
```

## 問題点と解決策

- **Tailwind CSS v4 での CSS 変数参照**

  - `@import "tailwindcss";` で全機能を一括インポートできるようになった
  - スタイル定義が簡潔になり、メンテナンス性が向上

- **コンポーネントの一貫性**

  - 以前は各コンポーネントでスタイルを個別に定義していた
  - shadcn UI の導入により、デザインシステムが統一され一貫性のある UI に

- **フォームの状態管理とバリデーション**
  - 従来は useState を使った手動の状態管理とバリデーション
  - React Hook Form と zod の導入により、型安全かつ宣言的なフォーム実装が可能に

## 学んだこと・メモ

- **Tailwind CSS v4 の変更点**

  - `@import "tailwindcss";` だけで全機能を一括インポート可能
  - 以前は分割して記述（base, components, utilities, preflight）が必要だった

- **shadcn UI の利点**

  - モダンでアクセシブルな UI コンポーネント
  - 一貫したデザインシステム
  - 容易なダークモード対応
  - Radix UI をベースにした堅牢な実装

- **React Hook Form と zod によるフォーム実装**
  - スキーマベースのバリデーション
  - 型安全な実装（TypeScript との相性が良い）
  - 状態管理の簡略化
  - エラーハンドリングの改善

## 今後の作業

1. 他の UI コンポーネントも shadcn UI に移行
2. ダークモードの実装
3. テーマカスタマイズの検討
4. より複雑なフォームバリデーションパターンの実装
