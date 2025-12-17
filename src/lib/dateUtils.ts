/**
 * 日付・時刻ユーティリティ
 * 
 * システム内で「今日」「現在時刻」を取得する際に使用するヘルパー。
 * DEMO モードでは環境変数で指定された固定日付を返す。
 * 
 * 使用方法:
 * - `getNow()`: 現在時刻の Date オブジェクト
 * - `getToday()`: 今日の 00:00:00 の Date オブジェクト
 * - `isDemoMode()`: DEMO モードかどうか
 * - `getDemoDateString()`: DEMO 日付の文字列 (表示用)
 */

// 環境変数からDEMOモード設定を読み取り
// NEXT_PUBLIC_ プレフィックスでクライアント側でも参照可能
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_DATE_STR = process.env.DEMO_FIXED_DATE || '2026-01-15';

/**
 * 現在の Date オブジェクトを返す。
 * DEMO モード時は固定日付の同時刻を返す。
 * 
 * @example
 * const now = getNow(); // DEMO: 2025-01-15 の現在時刻
 */
export function getNow(): Date {
    if (DEMO_MODE) {
        const realNow = new Date();
        const demoDate = new Date(DEMO_DATE_STR);
        // デモ日付の年月日に、現在の時分秒を適用
        demoDate.setHours(
            realNow.getHours(),
            realNow.getMinutes(),
            realNow.getSeconds(),
            realNow.getMilliseconds()
        );
        return demoDate;
    }
    return new Date();
}

/**
 * 「今日」の Date オブジェクト（00:00:00）を返す。
 * 
 * @example
 * const today = getToday(); // DEMO: 2025-01-15 00:00:00
 */
export function getToday(): Date {
    const now = getNow();
    now.setHours(0, 0, 0, 0);
    return now;
}

/**
 * DEMO モードかどうかを返す。
 */
export function isDemoMode(): boolean {
    return DEMO_MODE;
}

/**
 * デモ固定日付の文字列を返す（表示用）。
 * 通常モードでは null を返す。
 */
export function getDemoDateString(): string | null {
    return DEMO_MODE ? DEMO_DATE_STR : null;
}
