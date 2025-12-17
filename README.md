# Business Notebook

顧客管理と予約管理のためのシンプルな業務ツール。

## 🚀 クイックスタート

```bash
# 依存関係インストール
npm install

# データベース初期化
npx prisma migrate dev --name init

# デモデータ投入
npx prisma db seed

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

---

## 📋 機能概要

### トップページ（`/`）
- 顧客一覧（共通マスタ）
- Notebook選択カード
  - Customer Notebook
  - Reservation Notebook

### Customer Notebook（`/customer-notebook`）
- 顧客検索
- Pinned Note（申し送り・メモ）の表示・編集

### Reservation Notebook（`/reservation-notebook`）
- 今日の予約一覧
- 予約の追加・編集・キャンセル

### 顧客登録（`/customers/new`）
- 新規顧客登録（名前・カナ・電話・生年月日・メモ）

---

## 🎬 3分デモ

### Customer Notebook デモ（1.5分）
1. トップページで顧客一覧を確認
2. 「Customer Notebook」カードをクリック
3. 「山田 太郎」を選択
4. Pinned Note を確認（編集ボタンで編集可能）
5. 保存して完了

### Reservation Notebook デモ（1.5分）
1. トップページに戻る
2. 「Reservation Notebook」カードをクリック
3. 今日の予約3件を確認
4. 「新規予約を追加」ボタンで予約追加
5. 既存予約の編集・キャンセルを確認

---

## 📐 設計思想

- **単体完結 + 連携可能**: 各Notebookは単体で機能、同一DBで連携
- **共通顧客マスタ**: 顧客登録は1箇所に集約
- **シンプルUI**: 1カラム、max-width 960px、余白多め

---

## 🛠 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Prisma + SQLite
- Tailwind CSS

---

## 📁 プロジェクト構成

```
src/app/
├── page.tsx              # トップ（顧客一覧 + Notebook選択）
├── layout.tsx            # 共通レイアウト
├── customers/new/        # 顧客登録
├── customer-notebook/    # Customer Notebook
└── reservation-notebook/ # Reservation Notebook
```

---

## ⚠️ デモモード

デモ用に固定日付（2026-01-15）を使用しています。
`.env.local` の `DEMO_DATE` で変更可能。
