CREATE TABLE users (
  -- システムを拡張したりする段階で 、 必要に応じてULIDへの変更を検討する
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 複数ユーザー登録を実装する場合は 、 この UNIQUE 制約は削除
  -- メールアドレスなど 、 実際に一意であるべき情報に UNIQUE 制約を設ける
  name TEXT NOT NULL UNIQUE DEFAULT 'default_user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- デフォルトユーザー追加
INSERT INTO
  users (name)
VALUES
  ('default_user');
