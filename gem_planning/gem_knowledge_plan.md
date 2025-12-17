# Gem Knowledge 構成案（アップロード推奨ファイルと理由）

このGemは「曖昧な要望 → 実装可能な発注書」変換が目的のため、Knowledgeには **(1) ルール/設計指針** と **(2) 技術スタック/構造** と **(3) 代表的な実装パターン** を入れると精度が上がります。

## スキャン結果（このプロジェクトの概要）
- フロント: Next.js（App Router）, React, TypeScript
- スタイル: Tailwind CSS（PostCSS）, shadcn/ui（`components.json`）
- データ: Prisma（`prisma/schema.prisma`）, DBは `DATABASE_URL` 参照
- 運用/設計: `docs/ai-host/`（ルール）, `docs/design/`（UI/設計原則）, `.agent/workflows/`（品質チェック）
- 付帯: Electron（`electron-builder.yml`, `main/`）

## Knowledgeに入れるべきファイル（推奨順）

### 必須（まず入れる）
- `docs/ai-host/guidelines/RESTRICTIONS.md`: 破壊的変更・依存追加・スコープ管理など、プロジェクトの強制ルールをGemが引用できるようにする
- `docs/ai-host/guidelines/CORE_PRINCIPLES.md`: UI/UX・プロダクト方針（User First / Robust & Safe 等）を指令に反映するため
- `docs/design/DESIGN_PRINCIPLES.md`: 設計判断の軸（監査性、明示性、汎用性など）を毎回ブレさせないため
- `docs/design/UI_DESIGN_GUIDELINES.md`: UIの一貫性（階層、色、余白、タイポ）を実装指示に落とし込むため
- `.agent/workflows/quality_check.md`: 「完了の定義」をGemが `## 手順` に入れ、品質の抜けを防ぐため
- `README.md`: セットアップ/起動/概要（ルート構成・注意点）をGemが参照するため
- `package.json`: 使用技術、主要スクリプト（build/lint/electron等）を `## 手順` に正確に書くため
- `tsconfig.json`: TypeScript設定（strict、path alias `@/*` など）を前提に指示するため
- `next.config.ts`: Next.jsの特殊設定（standalone出力、Server Actions設定など）を踏まえるため
- `prisma/schema.prisma`: DBモデル/リレーション/削除方針（onDelete等）を誤らずに指示するため

### 推奨（精度を上げる）
- `docs/ai-host/INIT_ROUTER.md`: 言語ルール、PowerShellでの検索方針など、運用上の前提を揃えるため
- `docs/ai-host/guidelines/PROTOCOLS.md`: 進め方・合意形成・記録方針（アイデア退避等）を指示に織り込むため
- `docs/ai-host/guidelines/MODE_DEFINITIONS.md`: 議論→実装→安全確認の切替基準をGemに持たせるため
- `docs/ai-host/guidelines/TEAM_STRUCTURE_AND_ROLES.md`: 役割分担（PO/Agent）を前提にした逆質問の粒度を揃えるため
- `docs/management/PLAN_CHANGELOG.md`: 仕様変更履歴・次回予定を参照し、既存方針と矛盾しない指示を出すため
- `docs/usecases/USECASES_MOBILE.md`: 主要ユースケースをGemが理解し、目的/成功条件を具体化するため
- `docs/usecases/MOBILE_UX_PLAN.md`: モバイル前提のUX要件を指示に反映するため
- `docs/usecases/MOBILE_UX_GAP_REVIEW.md`: 既知のUX課題を踏まえた改善指示にするため
- `components.json`: UIコンポーネント/エイリアス/スタイル方針（shadcn設定）を踏まえるため
- `eslint.config.mjs`: lint方針を踏まえ、コーディング規約違反を避けるため
- `postcss.config.mjs`: Tailwind/PostCSS前提を把握するため
- `electron-builder.yml`: デスクトップ配布（Electron）に影響する変更の注意喚起ができるようにするため

### 任意（特定タスクで有効）
- `src/app/layout.tsx`: 共通レイアウト/メタ/グローバル構成に触れる作業の指示精度を上げるため
- `src/app/globals.css`: デザイン変数・ベーススタイルの前提を理解するため
- `src/actions/*.ts`: Server Actionsの実装パターン（`revalidatePath`, `redirect` 等）をGemが参照できるようにするため
- `src/services/*.ts`: ドメインロジック層の分離方針を理解するため
- `src/lib/db.ts`: Prismaクライアントの扱い方（接続・ログ）を理解するため
- `prisma/seed.ts`: シード/デモデータ投入の流儀を把握するため

### 非推奨（アップロードしない）
- `.env`, `.env.local`, `**/*.key` 等: 機密情報の可能性が高い
- `prisma/local.db` や `*.db`: 実データを含み得るため（漏洩・誤学習リスク）
- `node_modules/**`, `.next/**`, `dist/**`: 生成物・巨大でノイズになる
- `package-lock.json`: 原則不要（バージョン固定が必要な議論時のみ）

## 追加提案（不足している場合）
- `docs/design/SYSTEM_DESIGN.md` や `docs/design/UI_DESIGN.md` のような「全体アーキテクチャ/画面遷移」資料が無い場合、作成してKnowledgeに入れると、Gemが `## 変更対象ファイル` と `## 手順` をより正確に書けます。

