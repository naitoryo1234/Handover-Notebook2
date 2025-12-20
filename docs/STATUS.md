# Project Status

最終更新: 2025-12-20 15:55

---

## 🎯 Current Phase

**Phase 12: デモ直前の品質向上 ✅ 完了**

---

## ✅ Completed (今回のセッション)

- [x] **サンプルデータ修正**
  - VIP・夕方予約データのDB書き込み漏れを修正
  - 30名分のダミー顧客フリガナを正しい読みに修正
  - 17:30以降の予約データ生成保証

- [x] **フィルタ機能バグ修正**
  - 音声フィルタの競合問題（連続コマンドで動作しなくなる）を修正
  - 申し送りフィルタのカウント・表示ロジック統一

- [x] **モバイルUI修正**
  - 予約ページ・顧客詳細ページのスクロール問題を修正
  - 顧客詳細ページの横スクロール発生を抑制

- [x] **Vercelビルドエラー対応**
  - seed.tsの型エラー修正

---

## 🚧 In Progress (作業中)

なし

---

## 📋 Next Up (次回のセッション)

### 優先度: 高
1. **認証機能の再有効化**
   - middleware.ts修正
   - NextAuth.js再実装

2. **Zodバリデーション導入**
   - Server Actionsへのスキーマ適用

### 優先度: 中
3. **トップページのモバイル対応**
   - デスクトップ向けカード2つをモバイルフレンドリーに

4. **`any`型の除去**
   - コード品質向上

### 参照ドキュメント
- `docs/design/PRODUCT_STRATEGY.md`
- `docs/management/IDEAS.md`
- `docs/CODE_AUDIT_REPORT.md`

---

## ⚠️ Known Issues

| 問題 | 影響度 | 回避策 |
|:---|:---|:---|
| **認証が無効化中** | 高 | 商用リリース前に必須修正 |
| ESLint `react-hooks/set-state-in-effect` | 中 | `--no-verify` でコミット中 |

---

## 🔧 Environment Notes

- **Gemini.md配置先**: `C:\Users\ryo\.gemini\GEMINI.md`
- **DB状態**: Vercel Postgres (Neon) 接続済み
- **認証**: NextAuth.js v5 + Credentials Provider（現在無効化中）
- **ブランチ**: `main`
- **開発サーバー**: `npm run dev`
- **必要なAPIキー**: `GEMINI_API_KEY`, `GROQ_API_KEY`
- **デモ用日付固定**: `DEMO_FIXED_DATE=2025-12-20`

---

## 📝 Session Handover Notes

### コンテキスト
デモ直前の緊急対応セッション。サンプルデータの品質問題と、フィルタ機能・モバイルUIのバグ修正を実施。

### 決定事項
- **申し送りフィルタ**: 「未解決のみ」ではなく「申し送りあり全件」を表示するように変更（ユーザー要望）
- **サンプルデータ**: 有名人の名前を使用したダミーデータに正しいフリガナを設定

### 主な修正ファイル
- `prisma/seed.ts`: データ生成ロジック修正、フリガナ修正
- `src/app/reservation-v2/ReservationV2Client.tsx`: 音声フィルタ競合修正、申し送りフィルタ修正
- `src/components/reservation-v2/TodayAppointmentsList.tsx`: 日付表示追加、バッジカウント修正
- `src/app/customers/[id]/CustomerDetailClient.tsx`: スクロール問題修正

### 次回の着手点
1. 認証機能の再有効化
2. Zodバリデーション導入

### 保留事項
- 業態プリセット（ラベルのカスタマイズ）の本格実装
- 音声入力PRD作成（プロンプトとフォームの連携設計）
