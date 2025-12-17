# INIT_ROUTER_TEMPLATE.md

**<<TEAM_NAME>>（<<ROLE_DESCRIPTION>>）** のエージェント用・初期化ルーターです。
セッション開始時に以下の手順に従って情報をロードし、自身のモードと役割を確立してください。

---

## 🚀 初期化シーケンス

以下の順序でリンク先のドキュメントを読み込み、理解してください。

### 1. 基本ルールのロード（必須）
| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **チーム定義** | [`<<GUIDE_DIR>>/TEAM_STRUCTURE_AND_ROLES.md`](guidelines/TEAM_STRUCTURE_AND_ROLES.md) | <<TEAM_NAME>>の役割境界と他チームとの連携 |
| **行動指針** | [`<<GUIDE_DIR>>/CORE_PRINCIPLES.md`](guidelines/CORE_PRINCIPLES.md) | プロジェクトの核となる行動原則・優先順位 |
| **禁止事項** | [`<<GUIDE_DIR>>/RESTRICTIONS.md`](guidelines/RESTRICTIONS.md) | 破壊的操作や禁止されている振る舞い |
| **音声補正** | [`<<GUIDE_DIR>>/VOICE_INPUT_GUIDE.md`](guidelines/VOICE_INPUT_GUIDE.md) | （任意）音声入力特有の補正ルール |

### 2. モードの確立（必須）
| 項目 | 参照ファイル | 概要 |
| :--- | :--- | :--- |
| **モード切替** | [`<<GUIDE_DIR>>/MODE_DEFINITIONS.md`](guidelines/MODE_DEFINITIONS.md) | 議論/実装/安全チェック等のモード判定ルール |

---

## 🛠️ 運用ガイド（必要に応じて参照）

現在の状況に合わせて、以下のガイドを参照してください。
※ リンク先のファイルはプロジェクトに合わせて作成・修正してください。

- **実装・コーディング** → [`docs/ai-host/EXECUTION_GUIDE.md`](EXECUTION_GUIDE.md)
- **議論・設計相談** → [`docs/ai-host/AI_DISCUSSION_GUIDE.md`](AI_DISCUSSION_GUIDE.md)
- **Git・安全管理** → [`docs/ai-host/guidelines/SAFETY_AND_GIT_POLICY.md`](guidelines/SAFETY_AND_GIT_POLICY.md)
- **プロジェクト構造** → [`docs/ai-host/guidelines/PROJECT_STRUCTURE.md`](guidelines/PROJECT_STRUCTURE.md)

---

## 🔄 運用変更について

このファイルは「リンク集（ルーター）」に過ぎません。
運用ルールを変更したい場合は、リンク先のファイルを修正するか、このファイル自体の参照先を変更してください。

*最終更新: <<DATE>>*
