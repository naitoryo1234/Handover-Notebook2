# AI-Host Init Kit 使用ガイド

このフォルダは、AIエージェント（Claude, ChatGPTなど）との協働開発をスムーズに開始するための「初期化ルーター」と「ガイドライン」の雛形セットです。
新しいプロジェクトを開始する際に、このキットを導入することで、AIエージェントに対して共通のルールや役割を即座に認識させることができます。

---

## 🚀 導入手順

### 1. フォルダのコピー
`ai-host-init-kit` フォルダの中身を、あなたのプロジェクトのドキュメント用ディレクトリ（例: `docs/ai-host/`）にコピーしてください。

```bash
# 例: プロジェクトルートにて
mkdir -p docs/ai-host
cp -r path/to/starters/ai-host-init-kit/* docs/ai-host/
```

### 2. ファイル名のリネーム
`.sample.md` となっているファイルや、`_TEMPLATE.md` となっているファイルを、プロジェクト用に合わせてリネームします。

- `INIT_ROUTER_TEMPLATE.md` → `INIT_ROUTER.md` (または `INIT_ROUTER_TEAM_NAME.md`)
- `guidelines/*.sample.md` → `guidelines/*.md` （`.sample` を削除）

### 3. プレースホルダの置換
各ファイル内の `<<...>>` で囲まれたプレースホルダを、実際のプロジェクト情報に書き換えてください。

**主なプレースホルダ:**
- `<<PROJECT_NAME>>`: プロジェクト名
- `<<TEAM_NAME>>`: AIエージェントが所属するチーム名（例: Team-UI, Team-Coreなど）
- `<<ROLE_DESCRIPTION>>`: AIエージェントの具体的な役割
- `<<GUIDE_DIR>>`: ガイドラインファイルの配置ディレクトリ（例: `docs/ai-host/guidelines`）

### 4. 内容のカスタマイズ
プロジェクト固有のルールや方針に合わせて、各マークダウンファイルの内容を編集してください。
特に `TEAM_STRUCTURE_AND_ROLES.md`（チーム構成）や `CORE_PRINCIPLES.md`（方針）はプロジェクトごとに大きく異なるため、慎重に記述してください。

---

## 🤖 AIエージェントへの指示方法

セッション開始時、AIエージェントに対して以下のプロンプト（指示）を投げてください。

> 「これから開発セッションを開始します。`docs/ai-host/INIT_ROUTER.md`（リネーム後のファイル名）を読み込み、初期化シーケンスを実行してください。」

これにより、AIエージェントはルーターに記載された手順に従ってガイドラインを読み込み、自身の役割とルールを確立します。
