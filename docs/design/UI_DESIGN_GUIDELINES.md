# UI Design Guidelines (UIデザインガイドライン)

## 🎨 デザインコンセプト

### 1. Soft & Trustworthy (柔らかく、信頼できる)
- **印象**: 業務ツール特有の「冷たさ・堅苦しさ」を排除し、毎日触れたくなる「柔らかさ」と、プロフェッショナルな「信頼感」を両立する。
- **適用**:
  - 角丸は強すぎず弱すぎない（Radius: 0.625rem / ~10px）
  - 境界線は薄く繊細に（Slate-200 / #E2E8F0）
  - 影は「浮いている」ではなく「そこに在る」程度の自然なドロップシャドウ

### 2. Person as Hero (人が主役)
- **哲学**: システム上のデータ管理画面ではなく、「その人を思い出すための道具」として設計する。
- **適用**:
  - **名前こそが最強のID**: ID番号ではなく、名前を最大サイズで表示する。
  - **Pinned Noteの特権化**: 「この人についての要点」は、他のすべての情報よりも優先して目に入ってくるように視覚的重み付けを行う。

---

## ⚖️ 情報の視覚的重み付け (Visual Hierarchy)

情報を均等に並べるのではなく、重要度に応じて明確な強弱をつける。

| レベル | 役割 | デザイン表現 | フォント例 |
|:---|:---|:---|:---|
| **Level 1 (Hero)** | **主役**<br>顧客名 | **最大・最黒**<br>背景に温かみのある色を敷く | 32px / Bold / #1a1a1a |
| **Level 2 (Primary)** | **要点**<br>Pinned Note | **強調**<br>カード化 + アクセントバー + 十分なパディング | 18px / Normal / #333 |
| **Level 3 (Action)** | **操作**<br>ボタン・リンク | **明示的色**<br>青などのアクションカラーを使用 | 14px / Medium / #3B82F6 |
| **Level 4 (Info)** | **属性**<br>電話・誕生日 | **控えめ**<br>バッジやピル形式、アイコン付き | 14px / Normal / #666 |
| **Level 5 (Log)** | **履歴**<br>タイムライン | **背景化**<br>リスト形式、淡い色、ノイズにならない | 13-14px / Normal / #888 |

---

## 🎨 カラーシステム (Color System)

OKLCH色空間をベースとした Tailwind CSS v4 設定を使用。

### Base Colors
- **Background**: `#FAFAFA` (Soft Off-White) - 真っ白すぎない目に優しい白
- **Surface**: `#FFFFFF` (Pure White) - カードやコンテンツエリア

### Text Colors
- **Primary**: `#1F2937` (Dark Charcoal) - `text-slate-800`
- **Secondary**: `#6B7280` (Medium Gray) - `text-slate-500`
- **Muted**: `#9CA3AF` (Light Gray) - `text-slate-400`

### Accent Colors (Meaningful)
- **Human Warmth (Pinned Note)**:
  - Background: `#FFF9F5` (Warm Cream)
  - Bar Accent: `#E8A87C` (Soft Coral/Amber) - 温かみと重要性
- **Action (Buttons)**:
  - Primary: `#4F46E5` (Indigo) or `#3B82F6` (Blue) - 「操作できる」ことを示す
- **Status**:
  - Success: Emerald Green
  - Warning: Amber
  - Error: Rose

---

## 📐 レイアウト原則

1.  **脱・箱割り**: 情報を安易に枠線（Border）で囲わない。余白（Whitespace）でグルーピングを表現する。
2.  **シングルカラム優先**: 重要な情報の閲覧においては、視線の横移動を減らし、上から下への自然なスクロールを促す。
3.  **リズム**: コンテンツ間に十分な余白（24px ~ 32px）を取り、窮屈さを感じさせない。

---

## 🖋️ タイポグラフィ

- **Font Family**:
  - 日本語: Google Fonts (Noto Sans JP, etc.) ではなく、システムフォント（Hiragino Sans, Yu Gothic）を優先しつつ、必要に応じて特徴的なフォントをWeb Fontとして導入検討（v2以降）。
- **Line Height**:
  - 本文: `leading-relaxed` (1.625) - 読みやすさ優先
  - 見出し: `leading-tight` (1.25) - まとまり感優先

---

*Version 1.0 (2025-12-16)*
