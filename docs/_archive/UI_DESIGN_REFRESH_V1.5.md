# UI Design Refresh: B2B SaaS Style (v1.5.0)

このドキュメントは、v1.5.0におけるUI刷新（B2B SaaSスタイルへの移行）の設計仕様書です。
LinearやVercelのような「現代的で信頼感のある」デザインへの統一を目指します。

---

## 1. デザインコンセプト (Design Concept)

*   **Theme**: Modern B2B SaaS (Clean, Deep, Professional)
*   **Key Attributes**:
    *   **Trustworthy**: `Indigo-600` を基調とした落ち着いた信頼感。
    *   **Accessible**: ノイズを減らし、コンテンツに集中できる「階層構造（Layered）」。
    *   **Interactive**: ユーザーのアクションに対してリッチで滑らかな反応（Micro-interactions）を返す。

---

## 2. カラーパレット戦略 (Color Palette Strategy)

Tailwind CSSのユーティリティクラスを直接利用しつつ、セマンティックな意味を持たせます。

### 2.1 ベースレイヤー
*   **App Background**: `bg-slate-50` (or `bg-gray-50`)
    *   真っ白な画面ではなく、わずかにグレーがかった背景で画面全体の「土台」を作る。
*   **Content Surface (Card/Panel)**: `bg-white`
    *   コンテンツエリアを白にすることで、背景とのコントラスト（階層）を生み出す。

### 2.2 テキスト階層
*   **Primary (Headings)**: `text-slate-900` (Dense Black)
*   **Secondary (Body)**: `text-slate-600` (Readable Gray)
*   **Tertiary (Meta/Hint)**: `text-slate-400` (Subtle)

### 2.3 アクセント & アクション
*   **Brand Primary**: `indigo-600`
    *   Actions (Buttons, Links): `bg-indigo-600`, `text-indigo-600`
    *   Interaction States: `hover:bg-indigo-700`, `focus:ring-indigo-500`

### 2.4 ボーダー & ディバイダー
*   **Subtle Border**: `border-slate-200`
    *   極力薄く、コンテンツの邪魔をしない区切り線。

---

## 3. コンポーネント設計 (Component Design Revisions)

既存の `src/components/ui` 配下のコンポーネントを以下のように刷新します。

### 3.1 Button Component (`src/components/ui/button.tsx`)

フラットなボタンから、立体的でクリック感のあるデザインへ変更します。

*   **Primary Variant**:
    *   Base: `bg-indigo-600 text-white rounded-lg`
    *   Effect: `shadow-sm hover:bg-indigo-700 transition-all duration-200`
    *   Focus: `focus-visible:ring-indigo-600`
*   **Secondary/Outline Variant**:
    *   Base: `bg-white text-slate-700 border border-slate-200`
    *   Effect: `shadow-sm hover:bg-slate-50 hover:text-slate-900`

### 3.2 Card Component (`src/components/ui/card.tsx`)

ただの枠線ではなく「浮き上がり」を感じさせるモダンなカードにします。

*   **Style**: `bg-white border border-slate-200 shadow-sm rounded-xl`
*   **Key Difference**: `rounded-lg` (8px) → `rounded-xl` (12px) で少し親しみやすさを追加。

### 3.3 Inputs & Forms (`src/components/ui/input.tsx`, `textarea.tsx`)

入力時の体験（UX）をリッチにします。

*   **Default**: `border-gray-300 shadow-sm rounded-md`
*   **Focus State**: `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`
    *   ブラウザデフォルトのOutlineを消し、ブランドカラーのリングを表示。

---

## 4. インタラクションガイドライン (Interaction Guidelines)

すべてのインタラクティブ要素に適用するグローバルルールです。

### 4.1 Transition (滑らかさ)
状態変化（Hover, Focus, Active）は必ずトランジションさせます。
*   `transition-all duration-200 ease-in-out`

### 4.2 Clickable Areas
クリック可能なリストアイテムやカードには、明確なアフォーダンス（手がかり）を与えます。
*   Hover時の背景色変化: `hover:bg-slate-50`
*   カーソル: `cursor-pointer`

---

## 5. 実装プラン (Implementation Plan)

1.  **Global Styles (`src/app/globals.css`)**:
    *   `body` に `bg-slate-50` を適用。
2.  **Base Components Refactoring**:
    *   `button.tsx`: カラーとVariant定義の更新。
    *   `card.tsx`: Border, Radius, Shadowの更新。
    *   `input.tsx` / `textarea.tsx`: Focus ringスタイルの更新。
3.  **Page Level Adjustments**:
    *   主要ページ (`Dashboard`, `CustomerDetail`) のコンテナ背景色とパディングの微調整。
