'use server';

import Groq from 'groq-sdk';

/**
 * Transcribes audio using Groq's Whisper API (whisper-large-v3).
 * @param formData FormData containing the 'audio' file
 * @returns Object containing success status and transcribed text or error
 */
export async function transcribeAudio(formData: FormData) {
    const file = formData.get('audio') as File;

    if (!file) {
        return { success: false, error: '音声ファイルが見つかりません' };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'GROQ_API_KEY が設定されていません' };
    }

    try {
        const groq = new Groq({ apiKey });

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3',
            response_format: 'json',
            language: 'ja', // Force Japanese
        });

        return { success: true, text: transcription.text };

    } catch (error: unknown) {
        console.error('Groq Transcription Error:', error);
        // エラーメッセージをサニタイズ - 内部情報を露出させない
        return { success: false, error: '音声の文字起こし中にエラーが発生しました。しばらくしてから再度お試しください。' };
    }
}
