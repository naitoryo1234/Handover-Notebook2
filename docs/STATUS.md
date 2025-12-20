# Project Status

最終更新: 2025-12-20 16:21

---

## 🎯 Current Phase

**Phase 12: デモ直前の品質向上 ✅ 完了**

---

## ✅ Completed (今回のセッション)

- [x] **iOS Safari ビューポート修正**
  - `layout.tsx`: `h-full` → `min-h-dvh`
  - `ReservationV2Client.tsx`: `h-screen` → `h-dvh`
  - iPhone Safariでスクロール時に最後のカードが隠れる問題を解消

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
短時間のバグ修正セッション。iPhone SafariでモバイルUIをテストした際に発見されたビューポート問題を修正。

### 決定事項
- **dvhユニットの採用**: iOS Safariの動的ビューポートに対応するため、`100vh` を `100dvh` に置き換え
- 修正は `fix/ios-viewport` ブランチで実装後、mainにマージ

### 主な修正ファイル
- `src/app/layout.tsx`: `h-full` → `min-h-dvh`
- `src/app/reservation-v2/ReservationV2Client.tsx`: `h-screen` → `h-dvh`

### 次回の着手点
1. 認証機能の再有効化
2. Zodバリデーション導入

### 保留事項
- 業態プリセット（ラベルのカスタマイズ）の本格実装
- 音声入力PRD作成（プロンプトとフォームの連携設計）
