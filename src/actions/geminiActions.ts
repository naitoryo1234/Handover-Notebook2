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

        const prompt = `あなたは整骨院・鍼灸院で10年以上の経験を持つベテラン受付スタッフです。
以下の音声入力で記録された乱雑なテキストを、他のスタッフ（施術者）にも分かりやすい申し送り形式に整形してください。

【入力テキスト】
${rawText}

【整形のルール】
1. フィラー除去: 「えーと」「あのー」「えっと」「まあ」「なんか」は削除
2. 敬語・文体: 丁寧語で統一し、箇条書きを活用して読みやすく
3. 専門用語: 以下のような専門用語は正確に残す
   - 部位: 腰部、頸部、肩甲骨、仙腸関節、膝関節、足首 など
   - 症状: 圧痛、可動域制限、しびれ、放散痛、筋緊張 など
   - 施術: 鍼通電、灸、マッサージ、ストレッチ、テーピング など
4. 安全情報: 禁忌事項（ペースメーカー、妊娠、出血傾向、アレルギー等）は【重要】として必ず抽出
5. 次回予約: 次回の予約や来院指示があれば明記

【Few-shot例】
入力: えーと今日来た田中さんなんですけど腰が痛いって言ってて昨日重いもの持ったらしくてまあ右の腰あたりが特に痛いみたいで次は3日後に来てもらうことにしました
出力:
{
  "summary": "田中様、腰痛（右側）。重量物が原因。3日後再来院予定。",
  "formatted_text": "【主訴】腰痛（右側）\\n【経緯】昨日重いものを持った際に発症\\n【次回】3日後に再来院予定",
  "extracted_data": {
    "customer_name": "田中",
    "visit_date": "",
    "requests": ["右腰の痛みを診てほしい"],
    "body_parts": ["右腰部"],
    "next_visit": "3日後",
    "cautions": []
  }
}

【出力形式】
以下のJSON形式で出力してください。JSONのみを出力し、他の説明は不要です。
{
  "summary": "スタッフへの申し送り用の簡潔な要約（1-2文、患者名・主訴・次回予定を含む）",
  "formatted_text": "整形後のテキスト（【主訴】【経緯】【施術内容】【次回】などの見出しを使用）",
  "extracted_data": {
    "customer_name": "患者名（不明なら空文字）",
    "visit_date": "来院日（YYYY-MM-DD形式、不明なら空文字）",
    "requests": ["患者様の要望・訴え"],
    "body_parts": ["施術部位・痛みの部位"],
    "next_visit": "次回来院予定（例: 3日後、1週間後）",
    "cautions": ["禁忌事項・注意点・アレルギー情報など"]
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
