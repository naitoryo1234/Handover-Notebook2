'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildFullPrompt, getCurrentPreset, PresetType } from '@/lib/presets';

// Response type for AI formatting (v2 - 改訂版スキーマ)
export interface FormattedTextResult {
    summary: string;
    formatted_text: string;
    extracted_data: {
        customer_name?: string;
        requests?: string[];
        body_parts?: string[];
        meridian_points?: string[];
        treatment?: string[];
        next_visit?: string;
        cautions?: string[];
    };
    // 不確実性フィールド
    needs_review: boolean;
    uncertain_terms: string[];
    missing_info: string[];
    // PII保護フィールド
    pii_detected: boolean;
    pii_masked: string[];
}

export interface FormatTextResponse {
    success: boolean;
    data?: FormattedTextResult;
    error?: string;
}

/**
 * Format and summarize raw voice input text using Gemini AI
 * 
 * @param rawText - 音声入力から得られた生テキスト
 * @param preset - 使用するプリセット（省略時は現在設定されているプリセット）
 */
export async function formatVoiceText(
    rawText: string,
    preset?: PresetType
): Promise<FormatTextResponse> {
    // Validate input
    if (!rawText.trim()) {
        return { success: false, error: 'テキストが空です' };
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'APIキーが設定されていません。.env.localにGEMINI_API_KEYを設定してください。' };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // シンプルなモデル取得（JSONモードなし）
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest'
        });

        // プリセットからプロンプトを構築
        const activePreset = preset ?? getCurrentPreset();
        const prompt = buildFullPrompt(rawText, activePreset);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSONを抽出してパース（マークダウンのコードブロックを除去）
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'AIからの応答をパースできませんでした' };
        }

        const parsed = JSON.parse(jsonMatch[0]) as FormattedTextResult;

        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error instanceof Error) {
            const errorMsg = error.message;
            console.error('Error message:', errorMsg);

            if (errorMsg.includes('API_KEY') || errorMsg.includes('API key')) {
                return { success: false, error: 'APIキーが無効です。Google AI Studioで正しいキーを取得してください。' };
            }
            if (errorMsg.includes('SAFETY')) {
                return { success: false, error: 'コンテンツが安全性ポリシーに違反しています。' };
            }
            // エラーメッセージをサニタイズ - 内部情報を露出させない
            return { success: false, error: 'AI処理中にエラーが発生しました。しばらくしてから再度お試しください。' };
        }

        return { success: false, error: 'AI処理中に不明なエラーが発生しました' };
    }
}

