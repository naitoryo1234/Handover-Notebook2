# INIT_ROUTER.md

<!--
AI AGENT INSTRUCTION:
This file is a "Router" to load necessary context.
You MUST read all documents marked as **(必須)** or **(Mandatory)** immediately upon opening this file.
Other documents (e.g. implementation guides) are for "Reference on Demand" - read them only when relevant to your current task.
Do NOT skip reading the Mandatory files. Creating a robust context is your first priority.
-->

**Team HARU（Fullstack Development: UI/Backend/DB）** のエージェント用・初期化ルーターです。
以下の手順に従って情報をロードし、自身のモードと役割を確立してください。

---

## 🌏 グローバルルール（必ず遵守してください）

### 📝 言語・ログ出力ルール

- コード以外の自然言語（作業ログ、進捗コメント、説明、提案、コミットメッセージなど）は、**すべて日本語**で記述してください。
- **重要**: AIが生成・更新するMarkdownファイル（`task.md`, `implementation_plan.md` 等）の内容も、**必ず日本語** で記述してください。
  - ツール等の仕様でデフォルトが英語になりがちな場合も、**意識的に日本語で出力（または翻訳して上書き）** してください。
- ツール側が自動で付与するセクション名（例: `Progress Updates`）はそのままで構いませんが、本文は日本語で統一してください。

### 💻 ターミナル利用ルール（Windows / PowerShell）

- PowerShell 環境では、`grep` コマンドは使用しないでください。  
  （Windows 素の環境では利用できず、エラーになります）
- 文字列検索・参照確認には、以下のいずれかを利用してください：
  - `rg`（ripgrep）が利用可能な場合は **優先して使用** する
  - エディタ内の検索機能（VS Code / Cursor の検索）
  - 必要に応じて Node/TypeScript スクリプトによる検索
- ターミナルコマンドが環境依存になりそうな場合は、  
  **実行前に環境前提をコメントで明示** してください。

### 🔍 問題解決アプローチ（UI/CSS/ロジック問題の修正時）

**試行錯誤的なアプローチは禁止です。** 問題が発生した場合、以下の手順を厳守してください：

1. **全体調査を先に行う**: 問題に関連しそうなファイルを**すべて**確認する
   - レイアウトファイル（`layout.tsx`）
   - グローバルCSS（`globals.css`）
   - 該当コンポーネントと親コンポーネント
   - ページファイル（`page.tsx`）
2. **原因を特定してから修正**: 「これが原因かもしれない」と一つ見つけて修正→確認→また別の修正...というアプローチは非効率
3. **スタッキングコンテキストやCSSの継承を考慮**: 特にUI問題では、親要素の `backdrop-filter`、`z-index`、`position` などが子要素に影響することがある
4. **根本原因を報告**: 修正時には原因と解決策を明確に説明する

### 🛑 終了プロセスおよび初期化後のルール

#### 1. 勝手な終了の禁止 (No Self-Termination)
- **自発的終了の禁止**: タスクリストの項目がすべて完了しても、**絶対に** `/session_handover` コマンドや `session_handover.md` の読み込みを自発的に行わないでください。
- **指示待ち**: 「タスク完了報告」のみを行い、ユーザーからの「終了してください」や「ハンドオーバーを作成して」という明確な指示があるまで待機してください。

#### 2. 初期化完了後の必須アクション (Mandatory Action)

このファイルを読み終えたら、**直ちに以下のプロトコルを実行してください。**

1.  **思考停止**: 新たな実装計画やコードの読み込みを**一切行わないでください**。
2.  **強制待機**: この場で **`notify_user` ツール** を使用し、以下のメッセージをユーザーに送信して**ターンを終了**してください。
    *   `「初期化が完了しました。次回のタスク（PLAN_CHANGELOG.md参照）について指示をください。」`
3.  **アクション禁止**: ユーザーからの「〇〇を実装して」等の具体的な指示があるまで、**いかなるツール（ファイル読み込み、コマンド実行含む）の使用も禁止**します。
    *   勝手に `implementation_plan.md` を作成したり、コードを修正したりすることは**重大なルール違反**です。

---

## 🚀 初期化シーケンス

以下の順序でリンク先のドキュメントを読み込み、理解してください。

### 1. 基本ルールのロード（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **チーム定義** | [`guidelines/TEAM_STRUCTURE_AND_ROLES.md`](guidelines/TEAM_STRUCTURE_AND_ROLES.md) | Team HARUのフルスタックな役割と責任範囲 |
| **行動指針** | [`guidelines/CORE_PRINCIPLES.md`](guidelines/CORE_PRINCIPLES.md) | "User First" & "System Robustness" |
| **禁止事項** | [`guidelines/RESTRICTIONS.md`](guidelines/RESTRICTIONS.md) | データ消失防止・スキーマ管理の鉄則 |

### 2. モード・プロトコルの確立（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **モード切替** | [`guidelines/MODE_DEFINITIONS.md`](guidelines/MODE_DEFINITIONS.md) | 設計/実装/安全チェック等のモード判定ルール |
| **運用プロトコル** | [`guidelines/PROTOCOLS.md`](guidelines/PROTOCOLS.md) | アイデア保存・提案プロセス等の運用ルール |

### 3. プロジェクト知識のロード（必須）

| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **システム設計** | `../design/SYSTEM_DESIGN.md` | (プロジェクトに合わせて作成) 全体アーキテクチャ・DBスキーマ・API設計 |
| **UIコンセプト** | `../design/UI_DESIGN.md` | (プロジェクトに合わせて作成) 画面構成、遷移フロー、UIトーン |

---

## 🛠️ 運用ガイド（必要に応じて参照）

現在の状況に合わせて、以下のガイドを参照してください。
※ リンク先のファイルはプロジェクトに合わせて作成・修正してください。

- **実装・コーディング** → (未作成)
- **議論・設計相談** → (未作成)
- **Git・安全管理** → (未作成)

---

## 🔄 運用変更について

このファイルは「リンク集（ルーター）」に過ぎません。
運用ルールを変更したい場合は、リンク先のファイルを修正するか、このファイル自体の参照先を変更してください。

*Template Version: 1.0 (2025-12-16)*
