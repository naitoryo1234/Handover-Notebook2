# Project Status

最終更新: 2025-12-19 23:37

---

## 🎯 Current Phase

**Phase 11: 音声入力機能の拡張と磨き込み ✅ 完了**

---

## ✅ Completed (今回のセッション)

- [x] **クイック記録機能（Customer Notebook）**
  - 顧客一覧ページに「クイック記録」ボタン追加
  - 音声入力 → AI顧客名抽出 → 顧客マッチング → 確認 → 保存
  - 確認画面で記録内容を編集可能
  - 複数候補時に直近来店日で区別可能なUI

- [x] **AI整形プロンプト強化**
  - 鍼灸院デモ向けに最適化
  - 抽出項目拡充: body_parts, next_visit, cautions
  - Few-shot例追加
  - 禁忌情報の強調

- [x] **PC版音声コマンド対応（Reservation V2）**
  - PC版検索バーにマイクボタン追加
  - モバイル版と同じparseVoiceCommand連携

- [x] **音声コマンドバグ修正**
  - 新しい音声入力時に既存フィルターをクリアするよう修正

- [x] **顧客選択UI改善**
  - 同姓の顧客区別のため直近来店日を表示
  - 予約/記録アイコンで来店種別を表示

---

## 🚧 In Progress (作業中)

なし

---

## 📋 Next Up (次回のセッション)

### トップページのモバイル対応
1. **ホーム画面のモバイル最適化**
   - 現状: 大きいカード2つのみ（デスクトップ向け）
   - 改善: モバイルフレンドリーなレイアウトに変更

### その他
2. **認証の再有効化** (保留中)
3. **Zodバリデーション導入**

### 参照ドキュメント
- `docs/design/PRODUCT_STRATEGY.md`
- `docs/management/IDEAS.md`

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

---

## 📝 Session Handover Notes

### コンテキスト
Customer Notebookに「クイック記録」機能を新規実装。顧客を選択せずに「今日来た山田さんは腰が痛いと言っていました」のように音声入力すると、AIが顧客名を抽出してマッチング、自動でメモを追加できる。

### 決定事項
- **クイック記録のフロー**: 音声入力 → AI整形（顧客名抽出）→ 顧客検索 → 確認（編集可能）→ 保存
- **AIプロンプトは一時的に鍼灸院向けに特化**: 汎用化はPhase 2以降でPRD作成後に着手
- **業態プリセットとの連携**: 今後の拡張として`docs/management/IDEAS.md`に記録済み

### 次回の着手点
1. **トップページのモバイル対応**
   - 現状の大きいカード2つをモバイルフレンドリーに変更

### 保留事項
- 業態プリセット（ラベルのカスタマイズ）の本格実装
- 認証機能の再有効化
- 音声入力PRD作成（プロンプトとフォームの連携設計）
