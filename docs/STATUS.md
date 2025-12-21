# Project Status

最終更新: 2025-12-21 12:15

---

## 🎯 Current Phase

**Phase 14: 認証機能の再有効化 ✅ 完了**

---

## ✅ Completed (今回のセッション)

- [x] **認証機能の再有効化**
  - `middleware.ts` を修正し NextAuth.js 認証チェックを復活
  - 環境変数 `NEXT_PUBLIC_AUTH_ENABLED` で認証オン/オフ切り替え可能
  - `seed.ts` にスタッフのパスワードハッシュを追加
  - 動作確認: `/` アクセス → `/login` リダイレクト → ログイン成功

---

## 🚧 In Progress (作業中)

なし

---

## 📋 Next Up (次回のセッション)

### 優先度: 高
1. **Zodバリデーション導入**
   - Server Actionsへのスキーマ適用

### 優先度: 中
2. **トップページのモバイル対応**
   - デスクトップ向けカード2つをモバイルフレンドリーに

3. **`any`型の除去**
   - コード品質向上

4. **VoiceLogテーブルの削除検討**
   - スキーマに残存中、不要なら削除

### 参照ドキュメント
- `docs/design/PRODUCT_STRATEGY.md`
- `docs/management/IDEAS.md`
- `docs/CODE_AUDIT_REPORT.md`

---

## ⚠️ Known Issues

| 問題 | 影響度 | 回避策 |
|:---|:---|:---|
| ESLint `react-hooks/set-state-in-effect` | 中 | `--no-verify` でコミット中 |
| VoiceLogテーブル未使用 | 低 | 将来的にマイグレーションで削除可 |

---

## 🔧 Environment Notes

- **Gemini.md配置先**: `C:\Users\ryo\.gemini\GEMINI.md`
- **DB状態**: Vercel Postgres (Neon) 接続済み
- **認証**: NextAuth.js v5 + Credentials Provider ✅ 有効化済み
- **認証切り替え**: `.env.local` で `NEXT_PUBLIC_AUTH_ENABLED=false` で開発時オフ可能
- **ブランチ**: `main`
- **開発サーバー**: `npm run dev`
- **必要なAPIキー**: `GEMINI_API_KEY`, `GROQ_API_KEY`
- **デモ用日付固定**: `DEMO_FIXED_DATE=2025-12-20`

### デモ用ログイン情報
| ログインID | パスワード | 役職 |
|:---|:---|:---|
| admin | 1111 | 院長 |
| suzuki | 2222 | スタッフ |
| tanaka | 3333 | スタッフ |

---

## 📝 Session Handover Notes

### コンテキスト
認証機能の再有効化セッション。ミドルウェアを修正し、環境変数で認証をオフにできる開発者フレンドリーな仕組みを導入。

### 決定事項
- **`getToken` 方式採用**: NextAuth.js v5 の `auth` ラッパーは Next.js 16 との互換性問題があったため、`next-auth/jwt` の `getToken` で直接トークンを取得する方式に変更
- **環境変数による切り替え**: `NEXT_PUBLIC_AUTH_ENABLED=false` で認証スキップ（開発用）
- **seed.ts 改修**: bcrypt によるパスワードハッシュ生成を追加

### 保留事項
- VoiceLogテーブルはスキーマに残存（マイグレーション影響を考慮し今回は削除せず）

---

*v3.2.0 - Phase 14 Complete*
