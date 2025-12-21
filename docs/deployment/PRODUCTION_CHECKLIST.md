# 本番公開前チェックリスト

> **対象**: Handover Notebook  
> **最終更新**: 2025-12-21

このドキュメントは、Vercelへの本番デプロイ前に確認すべき項目をまとめたものです。

---

## 📋 チェックリスト

### 1. 環境変数の設定（Vercelダッシュボード）

Vercelの **Settings → Environment Variables** で以下を設定してください。

| 変数名 | 説明 | 設定例 |
|:---|:---|:---|
| `DATABASE_URL` | 本番用PostgreSQL接続URL | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | 認証用の秘密鍵 | 32文字以上のランダム文字列 |
| `NEXT_PUBLIC_AUTH_ENABLED` | 認証を有効化 | `true` |
| `GROQ_API_KEY` | 音声入力API | Groqダッシュボードから取得 |
| `GEMINI_API_KEY` | AI整形API | Google AI Studioから取得 |

> [!IMPORTANT]
> `AUTH_SECRET` の生成方法:
> ```bash
> openssl rand -base64 32
> ```
> または、パスワードマネージャーで32文字以上のランダム文字列を生成してください。

---

### 2. データベースの準備

**現在の状態**: 開発用SQLite  
**本番に必要**: PostgreSQL（Neon/Supabase/PlanetScale等）

#### 手順
1. Neon または Supabase でプロジェクトを作成
2. 接続URLを取得して `DATABASE_URL` に設定
3. ローカルで以下を実行:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

### 3. ログイン情報の変更

**現在のデモ用ログイン情報**:
| ログインID | パスワード |
|:---|:---|
| admin | 1111 |
| suzuki | 1111 |
| tanaka | 1111 |

> [!CAUTION]
> **本番公開前に必ず変更してください！**

#### 変更方法
1. `prisma/seed.ts` を開く
2. パスワードを安全なものに変更（8文字以上推奨）
3. 本番DBに対して `npx prisma db seed` を実行

---

### 4. デプロイ実行

```bash
# Vercel CLIでデプロイ
vercel --prod

# または GitHubにプッシュして自動デプロイ
git push origin main
```

---

### 5. デプロイ後の確認

- [ ] ログインページにアクセスできるか
- [ ] ログインが正常に動作するか
- [ ] 顧客データの登録・編集ができるか
- [ ] 予約の作成・編集ができるか
- [ ] 音声入力が動作するか（HTTPS環境必須）

---

## 🔧 トラブルシューティング

### ログインできない場合
1. `AUTH_SECRET` が正しく設定されているか確認
2. `NEXT_PUBLIC_AUTH_ENABLED=true` になっているか確認
3. データベースにスタッフデータが存在するか確認

### データベース接続エラー
1. `DATABASE_URL` の形式が正しいか確認
2. Neon/Supabaseの接続許可設定を確認

### 音声入力が動作しない
- 音声入力はHTTPS環境でのみ動作します
- Vercelデプロイ後は自動的にHTTPSになるため問題ありません

---

## 📞 サポート

技術的な問題が発生した場合は、開発者に連絡してください。

---

*このドキュメントは docs/deployment/PRODUCTION_CHECKLIST.md に保存されています。*
