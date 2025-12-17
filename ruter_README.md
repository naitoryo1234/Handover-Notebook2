# 🚀 Project Template

AIエージェント（Team HARU）との協働開発用プロジェクトテンプレートです。

## 📋 使い方

1. このフォルダをコピーして新しいプロジェクト名にリネーム
2. `docs/ai-host/INIT_ROUTER_TEMPLATE.md` の `{{PROJECT_NAME}}` を実際のプロジェクト名に置換
3. 必要に応じて各ガイドラインをプロジェクトに合わせて調整

## 📂 構成

```
_project-template/
├── .agent/
│   └── workflows/           # AIワークフロー定義
│       ├── session_handover.md
│       └── quality_check.md
├── docs/
│   ├── ai-host/             # AIエージェント運用ルール
│   │   ├── INIT_ROUTER_TEMPLATE.md
│   │   └── guidelines/
│   └── design/              # 設計原則
│       └── DESIGN_PRINCIPLES.md
└── README.md                # このファイル
```

## 🔧 カスタマイズポイント

- **INIT_ROUTER_TEMPLATE.md**: チーム名、プロジェクト説明
- **TEAM_STRUCTURE_AND_ROLES.md**: 技術スタック
- **RESTRICTIONS.md**: プロジェクト固有の制約

---

*Created from: handover-notebook (2025-12-16)*
