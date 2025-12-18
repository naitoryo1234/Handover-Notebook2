# 開発AI向け指示書：予約管理台帳UIの再現

あなたは熟練したフロントエンドエンジニアです。
以下の仕様に基づいて、クリニック向け予約管理システムのUI（予約台帳）を実装してください。
既存のデザインとUXを忠実に再現することが求められます。

## 1. デザインコンセプト & テクノロジースタック

*   **FW**: Next.js (App Router)
*   **Styling**: Tailwind CSS (Mobile First)
*   **Icons**: Lucide React
*   **Date Lib**: date-fns
*   **Design System**:
    *   Base Color: Slate (50-900) for text & backgrounds.
    *   Primary Color: Indigo (500-700) for actions & accents.
    *   Alert Colors: Red (Error/High Alert), Amber (Warning/Unassigned).
    *   Component Library Concept: shadcn/ui like (Dialog, Toast).

## 2. 画面構成 (Layout Structure)

画面は大きく以下のセクションに分かれます。

### A. ヘッダー / ツールバーエリア (`bg-slate-50 border-b`)
上部に固定的な操作パネルを配置します。

1.  **アラートバッジ群 (左寄せ)**
    *   **未割り当て (Unassigned)**: スタッフ未定の予約がある場合のみ表示。
        *   Style: Amber-100 bg / Amber-800 text / Border Amber-300 / Rounded-full.
        *   Action: クリックでその条件で絞り込み。
    *   **未解決メモ (Unresolved)**: 管理者メモ（申し送り）が未解決のものがある場合のみ表示。
        *   Style: Red-100 bg / Red-800 text / Border Red-300 / Rounded-full.
        *   Action: クリックでその条件で絞り込み。

2.  **メインアクション**
    *   **[新規予約] ボタン**: Primary Action (Indigo)。

3.  **検索・フィルター群 (右寄せまたは中央)**
    *   **患者検索**: インクリメンタルサーチ入力欄 (`User` icon付き)。
    *   **スタッフ選択**: ドロップダウン。
    *   **過去表示切替**:トグルボタン。「過去を表示」など。

4.  **日付ナビゲーション (下段)**
    *   `<` (前日) `日付表示` `>` (翌日) のセット。
    *   クイックジャンプ: [今日] [明日] [来週] [全期間] のボタン群。
    *   `date-fns` の `addDays` 等を使用して計算。

### B. 検索ステータスバー (条件適用時のみ表示)
ツールバーの下に、現在適用中のフィルター条件を表示する帯エリアです。

*   **Background**: `bg-indigo-50 border-b border-indigo-100`
*   **Content**: "🔍 絞り込み条件:" の後に、適用中の条件（日付、スタッフ名、検索ワード）をタグ形式で表示。
*   **Result Count**: "📊 件数: [N]件" を右側に表示。
*   **Ref**: ユーザーが現在の表示内容を誤認しないための重要なUXです。

### C. メインコンテンツエリア

レスポンシブ対応のため、PCとモバイルで表示を切り替えます。

#### 1. PCビュー (Desktop Table) - `md:block`
*   **Header**: Sticky header (`sticky top-0`).
*   **Columns**:
    1.  **Status**: アイコンのみ表示 (Scheduled, Completed, Cancelled)。
    2.  **日時**: 日付(Mono font) + 時間(Bold)。
    3.  **患者名**: 名前(Link) + カナ(Small text)。来院回数バッジなどを添える。
    4.  **スタッフ**: 担当スタッフ名バッジ。未定の場合は点滅する "未割り当て" アラートを表示。
    5.  **メモ**:
        *   `line-clamp-3` で3行制限。長文時はホバーで「全文表示」ボタン出現。
        *   **管理者メモ (Admin Memo)**: 赤枠の別ブロックとして強調表示。チェックアイコンで「解決/未解決」をトグル可能にする。
    6.  **操作**:
        *   [カルテ作成] (Button, Indigo)
        *   [編集] (Button, White)
        *   [削除] (Icon Button, Trash)

#### 2. モバイルビュー (Mobile Cards) - `md:hidden`
*   テーブルの代わりにカード (`div.rounded-lg.shadow-sm`) をリスト表示。
*   **左ボーダー**: ステータスに応じて色を変える (Indigo=Normal, Red=Unassigned, Slate=Cancelled)。
*   **Layout**:
    *   Header: [時間] --- [ステータスアイコン]
    *   Body: [患者名(大)] / [スタッフ名]
    *   Footer: [メモ(あれば)] / [アクションボタン群右寄せ]

## 3. スタイリング詳細ルール (Tailwind)

以下のクラスの組み合わせを多用してください。

*   **Clean White Container**: `bg-white rounded-lg shadow border border-slate-200`
*   **Subtle Hover**: `hover:bg-slate-50 transition-colors`
*   **Interactive Text**: `text-slate-600 hover:text-indigo-600`
*   **Alert Styles**:
    *   Warning: `bg-amber-100 text-amber-800`
    *   Danger: `bg-red-50 text-red-600`
    *   Disabled/Cancelled: `text-slate-400 opacity-60`

## 4. 必要なインタラクション

1.  **モーダル制御**:
    *   予約編集、詳細表示はすべてモーダル（Dialog）で行う。画面遷移させない。
    *   削除などの危険な操作は `ConfirmDialog` を必ず挟む。
2.  **楽観的UI (Optimistic UI)**:
    *   チェックインやメモの解決などは即座にUIへ反映し、裏でServer Actionを叩く。
3.  **トースト通知**:
    *   成功時: "予約を更新しました" (Success color)
    *   失敗時: エラーメッセージ (Error color)

## 5. 実装へのステップ

1.  **型定義**: `Appointment` 型（患者、スタッフを含む）を定義。
2.  **コンポーネント分割**:
    *   `AppointmentToolbar`: フィルタリングロジック。
    *   `AppointmentTable` (Desktop): テーブル表示。
    *   `AppointmentCard` (Mobile): カード表示。
    *   `StatusBadge`: ステータスアイコンの共通化。
3.  **ロジック実装**:
    *   フィルタリング（日付、スタッフ、文字列）はフロントエンドで行うか、DBクエリで行うか決定する（現状はフロントでのフィルタリングを含む）。

この指示書に従い、リッチで使いやすい予約台帳UIを構築してください。
