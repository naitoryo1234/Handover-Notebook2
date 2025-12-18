/**
 * 日付・時刻ユーティリティ
 * 
 * システム内で「今日」「現在時刻」を取得する際に使用するヘルパー。
 * DEMO モードでは環境変数で指定された固定日付を返す。
 * 
 * すべての日付計算は JST (Asia/Tokyo) を基準とする。
 * これにより、サーバー（UTC）とクライアント（JST）で一貫した日付処理が可能。
 * 
 * 使用方法:
 * - `getNow()`: 現在時刻の Date オブジェクト
 * - `getToday()`: 今日の 00:00:00 の Date オブジェクト
 * - `getTodayJST()`: JST基準の今日の開始・終了時刻
 * - `startOfDayJST(date)`: 指定日のJST基準での開始時刻
 * - `endOfDayJST(date)`: 指定日のJST基準での終了時刻
 * - `formatJST(date, format)`: JST基準でフォーマット
 * - `isDemoMode()`: DEMO モードかどうか
 * - `getDemoDateString()`: DEMO 日付の文字列 (表示用)
 */

import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

// タイムゾーン定義
export const JST_TIMEZONE = 'Asia/Tokyo';

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
 * JST基準で指定日の開始時刻（00:00:00 JST）を返す。
 * サーバー側（UTC）でも正しくJSTの日境界を計算できる。
 * 
 * @param date 対象の日付
 * @returns JSTの00:00:00に相当するUTC時刻のDateオブジェクト
 */
export function startOfDayJST(date: Date): Date {
    // まずJSTとして解釈した日付を取得
    const zonedDate = toZonedTime(date, JST_TIMEZONE);
    // その日の開始時刻を取得
    const startOfZonedDay = startOfDay(zonedDate);
    // UTCに戻す（実際にはJSTのオフセット分ずれたUTC時刻になる）
    // これでPrismaクエリでも正しく比較できる
    return new Date(startOfZonedDay.getTime() - 9 * 60 * 60 * 1000); // JST -> UTC
}

/**
 * JST基準で指定日の終了時刻（23:59:59.999 JST）を返す。
 * 
 * @param date 対象の日付
 * @returns JSTの23:59:59.999に相当するUTC時刻のDateオブジェクト
 */
export function endOfDayJST(date: Date): Date {
    const zonedDate = toZonedTime(date, JST_TIMEZONE);
    const endOfZonedDay = endOfDay(zonedDate);
    return new Date(endOfZonedDay.getTime() - 9 * 60 * 60 * 1000); // JST -> UTC
}

/**
 * JST基準の今日の開始・終了時刻を返す。
 * サーバー側でのクエリに使用。
 */
export function getTodayJST(): { start: Date; end: Date } {
    const now = getNow();
    return {
        start: startOfDayJST(now),
        end: endOfDayJST(now)
    };
}

/**
 * DateオブジェクトをJSTとしてフォーマットする。
 * 
 * @param date フォーマット対象の日付
 * @param formatStr date-fnsのフォーマット文字列
 * @returns フォーマットされた文字列
 */
export function formatJST(date: Date, formatStr: string): string {
    return formatInTimeZone(date, JST_TIMEZONE, formatStr);
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
