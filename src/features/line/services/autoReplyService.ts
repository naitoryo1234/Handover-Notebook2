/**
 * LINE Auto Reply Service
 * 
 * ルールベースの自動返信ロジック
 * 将来的にはDBから設定を読み込み可能に
 */

interface AutoReplyRule {
    keywords: string[];
    response: string;
    priority: number;
}

// デフォルトの自動返信ルール（ハードコード）
// 将来的にはLineAutoReplyテーブルから読み込む
const DEFAULT_RULES: AutoReplyRule[] = [
    {
        keywords: ['予約', '予約したい', '予約希望'],
        response: '📅 ご予約のご連絡ありがとうございます。スタッフより折り返しご連絡いたします。',
        priority: 10,
    },
    {
        keywords: ['キャンセル', 'キャンセルしたい'],
        response: '⚠️ キャンセルのご連絡ありがとうございます。スタッフより確認のご連絡をいたします。',
        priority: 10,
    },
    {
        keywords: ['営業時間', '開いてる', '何時まで', '何時から'],
        response: '🕐 営業時間についてはスタッフまでお問い合わせください。',
        priority: 5,
    },
    {
        keywords: ['場所', '住所', 'どこ', 'アクセス'],
        response: '📍 場所・アクセスについてはスタッフまでお問い合わせください。',
        priority: 5,
    },
];

// デフォルトの返信メッセージ
const DEFAULT_RESPONSE = '📩 メッセージを受け付けました。スタッフより折り返しご連絡いたします。';

/**
 * メッセージ内容に基づいて自動返信を生成
 */
export function generateAutoReply(message: string): string {
    const lowerMessage = message.toLowerCase();

    // 優先度順にソートしてマッチングを試みる
    const sortedRules = [...DEFAULT_RULES].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
        for (const keyword of rule.keywords) {
            if (lowerMessage.includes(keyword.toLowerCase())) {
                return rule.response;
            }
        }
    }

    return DEFAULT_RESPONSE;
}

/**
 * スタンプやメディアに対する応答
 */
export function generateMediaResponse(messageType: string): string {
    switch (messageType) {
        case 'sticker':
            return '😊 スタンプありがとうございます！';
        case 'image':
            return '📷 画像を受け取りました。スタッフより確認いたします。';
        case 'video':
            return '🎥 動画を受け取りました。スタッフより確認いたします。';
        case 'audio':
            return '🎵 音声を受け取りました。スタッフより確認いたします。';
        case 'location':
            return '📍 位置情報を受け取りました。';
        default:
            return DEFAULT_RESPONSE;
    }
}
