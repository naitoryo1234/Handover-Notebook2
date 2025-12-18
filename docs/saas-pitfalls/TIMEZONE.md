# タイムゾーン問題

**発生日**: 2025-12-19  
**カテゴリ**: インフラ / 日時処理  
**深刻度**: 高（データ表示の不整合）

---

## 問題の概要

サーバー（Vercel）がUTCで動作し、クライアント（ブラウザ）がJST(UTC+9)で動作するため、「今日」の日付境界がずれる。

### 具体例

```
現在時刻: 2025-12-19 00:30 JST
       = 2025-12-18 15:30 UTC

サーバー側で startOfDay(new Date()) を実行すると:
  → 2025-12-18 00:00 UTC（= 2025-12-18 09:00 JST）

期待値:
  → 2025-12-19 00:00 JST（= 2025-12-18 15:00 UTC）
```

### 症状

- 12月19日を表示しているのに、12月18日の予約も含まれる
- サイドバーとテーブルで表示件数が一致しない
- 深夜0時〜9時（JST）で問題が顕著

---

## 解決策

### 1. `date-fns-tz`パッケージの導入

```bash
npm install date-fns-tz
```

### 2. JST明示的な日付計算関数を作成

```typescript
// lib/dateUtils.ts
import { formatInTimeZone } from 'date-fns-tz';

export const JST_TIMEZONE = 'Asia/Tokyo';

export function startOfDayJST(date: Date): Date {
    const jstDateStr = formatInTimeZone(date, JST_TIMEZONE, 'yyyy-MM-dd');
    return new Date(`${jstDateStr}T00:00:00+09:00`);
}

export function endOfDayJST(date: Date): Date {
    const jstDateStr = formatInTimeZone(date, JST_TIMEZONE, 'yyyy-MM-dd');
    return new Date(`${jstDateStr}T23:59:59.999+09:00`);
}
```

### 3. サーバー側クエリで使用

```typescript
// services/appointmentServiceV2.ts
import { startOfDayJST, endOfDayJST } from '@/lib/dateUtils';

const start = startOfDayJST(date);
const end = endOfDayJST(date);

const appointments = await prisma.appointment.findMany({
    where: {
        startAt: { gte: start, lte: end },
    },
});
```

---

## チェック方法

1. **深夜テスト**: 0:00〜9:00 JSTにテストを実行
2. **UTC環境でのテスト**: 環境変数`TZ=UTC`でローカル実行
3. **日付境界のデータ**: 23:00〜01:00の予約を作成してテスト

---

## 関連ファイル

- `src/lib/dateUtils.ts` - JST対応ユーティリティ
- `src/services/appointmentServiceV2.ts` - 予約取得ロジック
- `src/app/reservation-v2/ReservationV2Client.tsx` - クライアント側フィルタリング

---

## 今後の類似プロジェクトへの適用

- **新規プロジェクト開始時**: 最初からJST明示的な日付ユーティリティを作成
- **Vercel/Neon使用時**: サーバーがUTCであることを前提に設計
- **テストデータ**: 日付境界をまたぐデータを必ず含める
