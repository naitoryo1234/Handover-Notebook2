# Project Settings: Handover Notebook

<!--
AI AGENT INSTRUCTION:
This file contains PROJECT-SPECIFIC rules and context.
Read this file at the start of each session to understand the project.
-->

---

## 📋 Project Overview

| 項目 | 内容 |
|:---|:---|
| **プロジェクト名** | Handover Notebook |
| **目的** | 業務引き継ぎ・顧客管理・予約管理のためのシンプルなWebアプリケーション |
| **コンセプト** | 「汎用的なプロトタイプ（ベースキット）」- 特定業種に特化しすぎず、配布可能な汎用版を維持 |

---

## 🛠️ Tech Stack

| レイヤー | 技術 |
|:---|:---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| **Backend** | Server Actions, API Routes, Zod (Validation) |
| **Database** | Prisma ORM, PostgreSQL (Neon/Vercel) |
| **Authentication** | NextAuth.js v5, Credentials Provider, BCrypt |
| **Voice Input** | Groq Whisper API (`whisper-large-v3`) |
| **AI Integration** | Gemini API (テキスト整形、保留中) |
| **Deployment** | Vercel |

---

## 📁 Directory Structure

```
/
├── src/
│   ├── app/                    # Pages (App Router)
│   │   ├── customer-notebook/  # 顧客管理ノート
│   │   ├── reservation-notebook/ # 予約管理ノート
│   │   ├── customers/          # 顧客詳細・登録
│   │   └── login/              # 認証ページ
│   ├── components/             # UIコンポーネント
│   │   └── ui/                 # 共通UIパーツ (Button, Card, Modal等)
│   ├── actions/                # Server Actions
│   ├── services/               # ビジネスロジック
│   └── lib/                    # ユーティリティ
├── prisma/
│   ├── schema.prisma           # DBスキーマ
│   └── seed.ts                 # デモデータ
└── docs/
    ├── Gemini.md               # グローバルAI設定
    ├── project-settings.md     # プロジェクト固有設定（このファイル）
    ├── STATUS.md               # 進捗状況・引き継ぎ
    ├── design/                 # 設計ドキュメント
    └── management/             # 運用・変更履歴
```

---

## 👥 Team Definition

| チーム名 | 役割 |
|:---|:---|
| **Team HARU** (AI) | Fullstack Development: UI/Backend/DB |
| **User** (Human) | Product Owner: 意思決定・仕様策定・ドメイン知識提供 |

---

## 🎭 Mode Definitions

### 💭 議論モード (Discussion Mode)
- **トリガー**: 「どう思う？」「構成を考えて」「デザインの相談」
- **振る舞い**: すぐにコードを書かず、選択肢やメリット・デメリットを提示

### ⚙️ 実装モード (Implementation Mode)
- **トリガー**: 「この機能を実装して」「コンポーネントを作って」
- **振る舞い**: 具体的な修正コードと適用手順を提示、実装後は動作確認手順を示す

### 🛡️ 安全チェックモード (Safety Check Mode)
- **トリガー**: 「ファイルを削除して」「DBを作り直して」「大幅にリファクタリングして」
- **振る舞い**: 危険な操作が含まれる場合、一旦手を止めてリスクを評価

---

## 🚫 Project-Specific Restrictions

### 破壊的変更の禁止
- 既存のデータベースを削除・初期化するコマンドは、ユーザーの明示的な許可がない限り実行禁止

### デザイン一貫性の維持
- 既存のデザインシステムを独断で変更しない
- 新しいUIコンポーネントは既存のパターンを継承

### Git操作
- 自動コミット禁止（ユーザー確認後にコミット）
- コミットメッセージは英語 Conventional Commits形式

### パッケージ追加
- 新しいnpmパッケージは必要性と代替案を提示し、ユーザー承認を得ること

---

## 🎨 Design Principles

### コア原則 (Core Values)
1.  **User First**: ユーザーの「思考の邪魔をしない」ことを最優先。クリック数、待ち時間、視線移動を極限まで減らす。
2.  **Keep It Simple & Soft**: 機能はMVPに絞り、複雑さを排除。デザインは「業務ツール」ではなく「信頼できるパートナー」のような柔らかさ。
3.  **Robust & Safe**: データの安全性とバックアップを重視。予期せぬエラーで業務を止めない堅牢な設計。

### デザイン・実装スタンス
- **Proactive**: 「こうすればもっと使いやすくなる」というUI提案は積極的に行う
- **Aesthetic**: Vanilla CSSによる独自の世界表現にこだわり、既存のUIライブラリに頼り切らない
- **Context-Aware**: ユーザーの文脈を常に意識した画面設計

### 具体的な設計指針
1. **記録の透明性**: 「誰が」「いつ」を常に明示
2. **汎用性の考慮**: 特定業種に最適化しすぎない
3. **明示性 over 推測**: ユーザーが推測しなくても分かるUI

### UI Design Concept
- **Soft & Trustworthy**: 柔らかさと信頼感の両立
- **Person as Hero**: データではなく「人」が主役

---

## 🧪 Base Kit Strategy（プロジェクトの前提）

このプロジェクトは**「汎用的なプロトタイプ（ベースキット）」**です。

1. **素体であること**: 特定のユースケースに特化しすぎず、多くの環境で使える機能を実装。清潔で拡張しやすい土台を保つ。
2. **基本機能への集中**: ワークフローを体験できる最小構成（MVP）を優先。「あったらいいな」機能は「将来の拡張候補」として記録。
3. **拡張性**: 機能のON/OFFや将来的なカスタマイズを受け入れやすい疎結合な設計。

---

## 📋 Operational Protocols

### アイデア・提案の保存プロセス
- AIアシスタントは、より良いアプローチや代替案がある場合は積極的に提案する
- **「今回は採用しないが、将来的に有用」** なアイデアは `docs/management/IDEAS.md` に保存:
  - 提案内容
  - 採用しなかった理由
  - 議論のコンテキスト

---

## 📚 Reference Documents

| 用途 | ファイル |
|:---|:---|
| **UIガイドライン** | `docs/design/UI_DESIGN_GUIDELINES.md` |
| **設計原則** | `docs/design/DESIGN_PRINCIPLES.md` |
| **変更履歴** | `docs/management/PLAN_CHANGELOG.md` |

---

*Project Settings Version: 1.1 (2025-12-18)*
