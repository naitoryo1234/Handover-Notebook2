# Handover Notebook コード監査レポート

**監査日**: 2025-12-19  
**監査者**: 外部顧問CTO  
**評価観点**: 商用SaaSとしての完成度

---

## 総合スコア: **64 / 100点**

> [!WARNING]
> **「動いているからOK」ではなく「他人がメンテナンスできるか」「課金ユーザーが安心して使えるか」**の基準での評価。
> 現在の状態は**プロトタイプ〜β版レベル**であり、商用リリースには追加整備が必要。

---

## 各項目評価

### 1. アーキテクチャと拡張性 (Architecture & Scalability)

| 評価 | **B** |
|:---|:---|

**Good:**
- **Service / Actions / Components の3層分離**が適切に行われている
  - `services/` (ビジネスロジック) → `actions/` (Server Actions) → `components/` (UI)
- **Prismaスキーマ設計**が拡張性を考慮:
  - `tags`, `attributes`, `externalRef`, `importMeta` のJSON型フィールドで汎用性確保
  - 論理削除 (`deletedAt`) や監査フィールド (`createdBy`, `updatedBy`) を実装済み
- **`lib/dateUtils.ts`** でJST対応を一元管理（SaaS向け設計）
- **Feature Flag** (`config/features.ts`) で機能ON/OFF制御の仕組みあり

**Bad:**
- `appointmentServiceV2.ts` (617行), `patientActions.ts` (694行) が巨大化傾向
- 「汎用コア + 業種別JSONカスタム」設計方針が**コード上で明示されていない**
  - 業種別設定ファイルやカスタム定義が存在しない
- `reservation-v2/` は新しい予約システムだが、旧 `reservation-notebook/` との関係が曖昧（削除予定か共存か不明）

---

### 2. UI/UXとレスポンシブ対応 (UI/UX & Mobile Adaptability)

| 評価 | **B+** |

**Good:**
- **Empty State** が適切に実装済み（`ReservationTable.tsx` L43-49）
- **Loading/Submitting状態** のUI表示あり（`Loader2` アイコン使用）
- **モバイル対応コンポーネント** 存在: `MobileVoiceInput.tsx`
- **デザインシステム** が整備:
  - `globals.css` でCSS変数・ダークモード対応
  - `glass-card`, `bg-mesh-gradient` などのユーティリティクラス
- **確認ダイアログ** (`ConfirmDialog`) によるUX配慮

**Bad:**
- **テーブル ↔ カード表示切り替え**は未実装（PC/モバイル共通でテーブル表示）
- `ReservationModal.tsx` (499行) がUI巨大化。入力フォームと確認画面を1コンポーネントに詰め込んでいる
- Tailwind CSSクラスがインラインで長くなる傾向（例: L270, L291）

---

### 3. コードの品質と保守性 (Code Quality)

| 評価 | **C+** |

**Good:**
- **日本語コメント**が適切に記載（目的・使い方が明確）
- **関数名・変数名**は意味が明確:
  - `checkStaffAvailability`, `getUnresolvedAdminMemos` など
- **TypeScript型定義**は概ね適切:
  - `Appointment`, `Patient`, `EditingAppointment` など独自型を定義
- **JSDoc**による関数ドキュメント（`dateUtils.ts`）

**Bad (Critical):**
- **`any`型の使用が12箇所**:
  - `appointmentActions.ts`: 8箇所の `catch (e: any)`
  - `groqActions.ts`: 1箇所
  - `patientService.ts`: `where: any`
- **例外処理パターンが不統一**:
  - 52箇所の `catch` ブロックで、エラー型が `any` / `unknown` / 未指定と混在
- **マジックナンバー**:
  - `duration: 60` (デフォルト時間), `.slice(0, 5)` (表示件数) などがハードコード
- **定数定義ファイル** (`constants.ts`) が存在しない

---

### 4. セキュリティと堅牢性 (Security & Stability)

| 評価 | **D** |

**Good:**
- **APIキーはサーバーサイドのみで使用** (`process.env.GROQ_API_KEY`, `GEMINI_API_KEY`)
  - フロントエンドへの流出リスクなし
- **Prismaによるパラメータ化クエリ** でSQLインジェクション対策済み
- **`NEXT_PUBLIC_`変数**は最小限（`DEMO_MODE`, `ATTACHMENTS_ENABLED`のみ）

**Bad (Critical):**
> [!CAUTION]
> **認証が無効化されている**
> `middleware.ts` L19-21:
> ```typescript
> // For now, allow all requests
> // Full auth protection will be re-enabled in a future update
> return NextResponse.next();
> ```
> **商用リリース前に絶対に修正必須**

- **フォーム入力バリデーション**:
  - Server Actionsで`FormData`を直接使用。Zodスキーマによるバリデーションが一部のみ
  - `scheduleAppointment`: 日付・時間の形式検証なし
- **例外発生時のエラーメッセージ**が詳細すぎる場合あり:
  - `error.message` をそのままクライアントに返却（デバッグ情報漏洩リスク）
- **CSRF対策**: Server Actionsで自動対応されるが、明示的なトークン管理なし

---

### 5. 最新機能の実装状況 (Modern Tech Implementation)

| 評価 | **B** |

**Good:**
- **Groq Whisper API** (`whisper-large-v3`) でコスト効率良い音声認識
  - 39行のシンプルな実装 (`groqActions.ts`)
- **Gemini API** によるテキスト整形機能
  - プロンプト設計が業務特化（フィラー除去、SOAP抽出）
- **Next.js 16 App Router + Server Actions** による最新アーキテクチャ
- **date-fns-tz** によるJST明示的ハンドリング

**Bad:**
- Gemini機能が**「保留中」の状態** のまま放置されている可能性
- 音声入力の**レート制限・コスト管理**が未実装
  - ユーザーが連続で音声入力した場合のAPI課金上限なし

---

## Good (現在のコードで誇れる点)

1. **日本時間(JST)対応が一元管理** - `dateUtils.ts`でサーバー/クライアント間の一貫性確保
2. **Service層の関心分離** - `appointmentServiceV2.ts`の18関数が単一責任で設計
3. **UIデザインの一貫性** - CSSカスタムプロパティとユーティリティクラスによるデザインシステム
4. **Empty State / Loading状態の適切な表示** - ユーザビリティへの配慮
5. **監査フィールド設計** - `createdBy`, `updatedBy`, `adminMemoResolvedBy`などの追跡フィールド

---

## Bad (Critical) - 商用リリース前に**絶対に**直すべき問題

> [!CAUTION]
> 以下の問題は**課金ユーザーに提供する前に必ず解決**が必要

| # | 問題 | 影響度 | 該当箇所 |
|:---|:---|:---|:---|
| 1 | **認証ミドルウェアが無効化** | 極大 | `middleware.ts` L19-21 |
| 2 | **`any`型でのerror handling** | 中 | `appointmentActions.ts` 8箇所 |
| 3 | **入力バリデーション不足** | 大 | Server Actions全般 |
| 4 | **エラーメッセージの過剰露出** | 中 | `groqActions.ts`, `geminiActions.ts` |

---

## Next Actions (点数を上げるための優先タスク)

### 1. 🔐 認証の再有効化 (優先度: **最高**)
```
middleware.ts を修正し、NextAuth.jsのauth()ラッパーを再実装。
/login 以外のルートで認証必須に。
```

### 2. 📝 Zodバリデーションの統一導入 (優先度: **高**)
```
各Server Actionに対してZodスキーマを定義。
FormDataのパース・検証を型安全に。
例: appointmentSchema, patientSchema
```

### 3. 🏗️ 巨大ファイルの分割リファクタリング (優先度: **中**)
```
- patientActions.ts → patientCRUD, patientSearch, timelineActions に分割
- ReservationModal.tsx → FormSection, ConfirmSection, hooks に分割
- constants.ts を作成してマジックナンバーを集約
```

---

## 参考: ファイル統計

| カテゴリ | ファイル数 | 総行数 (推計) |
|:---|:---|:---|
| Actions | 8 | ~1,400行 |
| Services | 6 | ~1,200行 |
| Components (reservation-v2) | 7 | ~1,400行 |
| Prisma Schema | 1 | 167行 |

---

*本レポートは2025-12-19時点のコードに基づいています。*
