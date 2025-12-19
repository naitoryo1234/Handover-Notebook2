'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { format, addDays, addWeeks } from 'date-fns';

/**
 * 音声コマンド解析結果の型
 */
export interface VoiceCommandResult {
    name?: string;           // 検索する名前（敬称除去済み）
    date?: string;           // ISO形式の日付 (yyyy-MM-dd) or null
    period?: 'daily' | 'all'; // 期間指定
    showUnassigned?: boolean; // 担当未定フィルター
    showUnresolved?: boolean; // 申し送りありフィルター
    action?: 'search' | 'filter' | 'navigate';
    rawText: string;         // 元のテキスト
    confidence: number;      // 解析の確信度 (0-1)
}

export interface ParseVoiceCommandResponse {
    success: boolean;
    data?: VoiceCommandResult;
    error?: string;
}

/**
 * 日付キーワードを実際の日付に変換
 */
function resolveDateKeyword(keyword: string): string | null {
    const today = new Date();
    const normalizedKeyword = keyword.toLowerCase().trim();

    // 英語キーワード
    switch (normalizedKeyword) {
        case 'today':
            return format(today, 'yyyy-MM-dd');
        case 'tomorrow':
            return format(addDays(today, 1), 'yyyy-MM-dd');
        case 'next_week':
            return format(addWeeks(today, 1), 'yyyy-MM-dd');
    }

    // 日本語キーワード
    if (normalizedKeyword.includes('今日')) {
        return format(today, 'yyyy-MM-dd');
    }
    if (normalizedKeyword.includes('明日')) {
        return format(addDays(today, 1), 'yyyy-MM-dd');
    }
    if (normalizedKeyword.includes('来週')) {
        return format(addWeeks(today, 1), 'yyyy-MM-dd');
    }
    if (normalizedKeyword.includes('明後日')) {
        return format(addDays(today, 2), 'yyyy-MM-dd');
    }

    // 「1月15日」などの日本語日付パース
    const jpDateMatch = normalizedKeyword.match(/(\d{1,2})月(\d{1,2})日/);
    if (jpDateMatch) {
        const month = parseInt(jpDateMatch[1], 10);
        const day = parseInt(jpDateMatch[2], 10);
        const year = today.getFullYear();
        // 過去の日付なら来年と解釈
        const targetDate = new Date(year, month - 1, day);
        if (targetDate < today) {
            return format(new Date(year + 1, month - 1, day), 'yyyy-MM-dd');
        }
        return format(targetDate, 'yyyy-MM-dd');
    }

    // ISO形式の日付はそのまま返す
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedKeyword)) {
        return normalizedKeyword;
    }

    return null;
}

/**
 * Gemini AIを使用して音声テキストを意図解析
 */
export async function parseVoiceCommand(rawText: string): Promise<ParseVoiceCommandResponse> {
    // 空文字チェック
    if (!rawText.trim()) {
        return { success: false, error: 'テキストが空です' };
    }

    // APIキーチェック
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // APIキーがない場合はフォールバック処理
        return fallbackParse(rawText);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-lite'
        });

        const prompt = `あなたは予約管理システムの音声コマンド解析アシスタントです。
ユーザーの発話から以下の情報を抽出してください。

【発話テキスト】
"${rawText}"

【抽出ルール】
1. name: 人名を抽出（敬称「さん」「様」「さま」「くん」「ちゃん」は除去）
2. date: 日付キーワード（today/tomorrow/next_week）または具体的な日付（1月15日など）
3. period: 「全部」「一覧」「全期間」があれば "all"、日付指定があれば "daily"
4. showUnassigned: 「担当未定」「未割り当て」「担当者なし」があれば true
5. showUnresolved: 「申し送り」「メモあり」「引き継ぎ」があれば true
6. confidence: 解析の確信度（0.0〜1.0）

【出力形式】
JSONのみを出力してください。説明文は不要です。
{
  "name": "名前または空文字",
  "date": "today/tomorrow/next_week/1月15日形式/空文字",
  "period": "daily/all/空文字",
  "showUnassigned": false,
  "showUnresolved": false,
  "confidence": 0.9
}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSONを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('JSON extraction failed:', text);
            return fallbackParse(rawText);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // 日付キーワードを実際の日付に変換
        let resolvedDate: string | undefined;
        if (parsed.date) {
            resolvedDate = resolveDateKeyword(parsed.date) || undefined;
        }

        const commandResult: VoiceCommandResult = {
            name: parsed.name || undefined,
            date: resolvedDate,
            period: parsed.period || undefined,
            showUnassigned: parsed.showUnassigned || false,
            showUnresolved: parsed.showUnresolved || false,
            action: parsed.name ? 'search' : (resolvedDate || parsed.period || parsed.showUnassigned || parsed.showUnresolved) ? 'filter' : undefined,
            rawText: rawText,
            confidence: parsed.confidence || 0.5
        };

        return {
            success: true,
            data: commandResult
        };
    } catch (error) {
        console.error('Voice command parse error:', error);
        // エラー時はフォールバック
        return fallbackParse(rawText);
    }
}

/**
 * APIが使えない場合のフォールバック処理（正規表現ベース）
 */
function fallbackParse(rawText: string): ParseVoiceCommandResponse {
    const text = rawText.trim();

    // 敬称を除去した名前を抽出（簡易版）
    let name: string | undefined;
    const nameMatch = text.match(/(.+?)(さん|様|さま|くん|ちゃん)/);
    if (nameMatch) {
        name = nameMatch[1].trim();
    } else if (text.length <= 10 && !text.includes('予約') && !text.includes('今日') && !text.includes('明日')) {
        // 短いテキストで予約関連ワードがなければ名前として扱う
        name = text;
    }

    // 日付キーワードを抽出
    let date: string | undefined;
    let period: 'daily' | 'all' | undefined;

    if (text.includes('今日')) {
        date = format(new Date(), 'yyyy-MM-dd');
        period = 'daily';
    } else if (text.includes('明日')) {
        date = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        period = 'daily';
    } else if (text.includes('来週')) {
        date = format(addWeeks(new Date(), 1), 'yyyy-MM-dd');
        period = 'daily';
    } else if (text.includes('全部') || text.includes('一覧') || text.includes('全期間')) {
        period = 'all';
    }

    // 日本語日付パース
    const jpDateMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
    if (jpDateMatch) {
        date = resolveDateKeyword(jpDateMatch[0]) || undefined;
        period = 'daily';
    }

    return {
        success: true,
        data: {
            name,
            date,
            period,
            action: name ? 'search' : (date || period) ? 'filter' : undefined,
            rawText: text,
            confidence: 0.6 // フォールバックは確信度低め
        }
    };
}
