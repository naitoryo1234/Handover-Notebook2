'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Response type for AI formatting
export interface FormattedTextResult {
    summary: string;
    formatted_text: string;
    extracted_data: {
        customer_name?: string;
        visit_date?: string;
        requests?: string[];
    };
}

export interface FormatTextResponse {
    success: boolean;
    data?: FormattedTextResult;
    error?: string;
}

/**
 * Format and summarize raw voice input text using Gemini AI
 */
export async function formatVoiceText(rawText: string): Promise<FormatTextResponse> {
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

        const prompt = `あなたは整骨院・鍼灸院の受付スタッフです。
以下の音声入力で記録された乱雑なテキストを、他のスタッフにも分かりやすい形式に整形してください。

【入力テキスト】
${rawText}

【注意点】
- 「えーと」「あのー」「えっと」などのフィラーは削除する
- 敬語や文章構造を整える
- 医療・施術に関する重要な情報は漏らさない
- 患者様の訴えや要望は特に注意して抽出する

【出力形式】
以下のJSON形式で出力してください。JSONのみを出力し、他の説明は不要です。
{
  "summary": "スタッフへの申し送り用の簡潔な要約（1-2文）",
  "formatted_text": "整形後のテキスト",
  "extracted_data": {
    "customer_name": "顧客名（不明なら空文字）",
    "visit_date": "来店日（YYYY-MM-DD形式、不明なら空文字）",
    "requests": ["要望1", "要望2"]
  }
}`;

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
            // デバッグ用：常に生のエラーメッセージを表示
            const errorMsg = error.message;
            console.error('Error message:', errorMsg);

            // ユーザーフレンドリーなメッセージを返しつつ、詳細も含める
            if (errorMsg.includes('API_KEY') || errorMsg.includes('API key')) {
                return { success: false, error: 'APIキーが無効です。Google AI Studioで正しいキーを取得してください。' };
            }
            if (errorMsg.includes('SAFETY')) {
                return { success: false, error: 'コンテンツが安全性ポリシーに違反しています。' };
            }
            // 詳細なエラーメッセージを返す
            return { success: false, error: `エラー: ${errorMsg}` };
        }

        return { success: false, error: 'AI処理中に不明なエラーが発生しました' };
    }
}
