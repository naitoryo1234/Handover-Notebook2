/**
 * デモ用シードデータ - 予約
 * 
 * DEMO_FIXED_DATE (デフォルト: 2025-01-15) を「今日」として予約を生成します。
 */

// デモ日付（環境変数から取得、なければデフォルト）
const DEMO_DATE_STR = process.env.DEMO_FIXED_DATE || '2025-01-15';

// 時間を設定するヘルパー
function createDateTime(dateStr: string, hours: number, minutes: number = 0): Date {
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// 日付オフセットを計算するヘルパー（デモ日付基準）
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * 予約データを生成する関数
 * @param patientIds - Patientの作成後に得られるID配列
 * @param staffIds - Staffの作成後に得られるID配列
 */
export function generateDemoAppointments(patientIds: string[], staffIds: string[]) {
    const today = DEMO_DATE_STR;
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);
    const nextWeek = addDays(today, 7);

    return [
        // ===== 今日の予約（朝〜夜まで充実） =====
        {
            patientId: patientIds[0], // デモ太郎
            staffId: staffIds[0],     // 山田院長
            startAt: createDateTime(today, 9, 0),
            duration: 60,
            memo: '定期メンテナンス',
            status: 'completed',
        },
        {
            patientId: patientIds[1], // サンプル花子
            staffId: staffIds[1],     // 鈴木
            startAt: createDateTime(today, 10, 0),
            duration: 45,
            memo: '肩こり集中ケア',
            adminMemo: '保険証再確認お願いします',
            isMemoResolved: false,
            status: 'completed',
        },
        {
            patientId: patientIds[2], // テスト次郎
            staffId: staffIds[2],     // 田中
            startAt: createDateTime(today, 11, 0),
            duration: 60,
            memo: 'スポーツ後ケア',
            status: 'arrived',
        },
        {
            patientId: patientIds[3], // 架空三子
            staffId: staffIds[0],
            startAt: createDateTime(today, 13, 0),
            duration: 45,
            memo: 'マタニティケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[4], // 見本四郎
            staffId: null,            // 担当未割当（アラート確認用）
            startAt: createDateTime(today, 14, 0),
            duration: 60,
            memo: '全身調整',
            adminMemo: '血圧高めのため注意',
            isMemoResolved: false,
            status: 'scheduled',
        },
        {
            patientId: patientIds[0], // デモ太郎（複数予約）
            staffId: staffIds[1],
            startAt: createDateTime(today, 15, 30),
            duration: 45,
            memo: 'フォローアップ',
            status: 'scheduled',
        },
        {
            patientId: patientIds[1], // サンプル花子
            staffId: staffIds[2],
            startAt: createDateTime(today, 16, 30),
            duration: 60,
            memo: '眼精疲労ケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[2], // テスト次郎
            staffId: null,            // 担当未割当
            startAt: createDateTime(today, 17, 30),
            duration: 45,
            memo: '夕方の施術',
            status: 'scheduled',
        },
        // ===== 今日の夕方〜夜の予約 =====
        {
            patientId: patientIds[5], // 例示五郎（夜間希望）
            staffId: staffIds[0],
            startAt: createDateTime(today, 18, 0),
            duration: 60,
            memo: '首の痛み - 仕事終わり',
            status: 'scheduled',
        },
        {
            patientId: patientIds[6], // 試作六美（学生）
            staffId: staffIds[1],
            startAt: createDateTime(today, 18, 30),
            duration: 45,
            memo: 'リハビリ継続',
            status: 'scheduled',
        },
        {
            patientId: patientIds[7], // 仮名七雄
            staffId: staffIds[2],
            startAt: createDateTime(today, 19, 0),
            duration: 45,
            memo: 'ゴルフ肘ケア',
            adminMemo: '次回で一区切りの予定',
            isMemoResolved: false,
            status: 'scheduled',
        },
        {
            patientId: patientIds[8], // 標本八重（産後）
            staffId: staffIds[0],
            startAt: createDateTime(today, 19, 30),
            duration: 60,
            memo: '骨盤矯正',
            status: 'scheduled',
        },
        {
            patientId: patientIds[9], // 模型九太（高齢者）
            staffId: staffIds[1],
            startAt: createDateTime(today, 20, 0),
            duration: 45,
            memo: '健康維持コース',
            status: 'scheduled',
        },
        // ===== 明日の予約 =====
        {
            patientId: patientIds[4], // 見本四郎
            staffId: staffIds[0],
            startAt: createDateTime(tomorrow, 10, 0),
            duration: 60,
            memo: '全身調整',
            status: 'scheduled',
        },
        {
            patientId: patientIds[3],
            staffId: staffIds[1],
            startAt: createDateTime(tomorrow, 11, 30),
            duration: 45,
            memo: 'マタニティケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[0],
            staffId: staffIds[2],
            startAt: createDateTime(tomorrow, 14, 0),
            duration: 60,
            memo: '腰痛ケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[1],
            staffId: staffIds[0],
            startAt: createDateTime(tomorrow, 16, 0),
            duration: 45,
            memo: 'フォローアップ',
            status: 'scheduled',
        },
        {
            patientId: patientIds[5], // 例示五郎
            staffId: staffIds[1],
            startAt: createDateTime(tomorrow, 18, 30),
            duration: 60,
            memo: '首ケア継続',
            status: 'scheduled',
        },
        {
            patientId: patientIds[6], // 試作六美
            staffId: null,            // 担当未割当
            startAt: createDateTime(tomorrow, 19, 0),
            duration: 45,
            memo: 'リハビリ',
            adminMemo: '担当者を割り当ててください',
            isMemoResolved: false,
            status: 'scheduled',
        },
        // ===== 明後日の予約 =====
        {
            patientId: patientIds[2],
            staffId: staffIds[1],
            startAt: createDateTime(dayAfter, 9, 30),
            duration: 60,
            memo: 'スポーツケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[4],
            staffId: staffIds[2],
            startAt: createDateTime(dayAfter, 13, 0),
            duration: 45,
            memo: '定期チェック',
            status: 'scheduled',
        },
        {
            patientId: patientIds[7], // 仮名七雄
            staffId: staffIds[0],
            startAt: createDateTime(dayAfter, 15, 0),
            duration: 60,
            memo: 'ゴルフ肘 最終チェック',
            status: 'scheduled',
        },
        {
            patientId: patientIds[8], // 標本八重
            staffId: staffIds[1],
            startAt: createDateTime(dayAfter, 17, 0),
            duration: 45,
            memo: '骨盤矯正フォロー',
            status: 'scheduled',
        },
        // ===== 来週の予約 =====
        {
            patientId: patientIds[0],
            staffId: staffIds[0],
            startAt: createDateTime(nextWeek, 10, 0),
            duration: 60,
            memo: '定期チェック',
            status: 'scheduled',
        },
        {
            patientId: patientIds[1],
            staffId: staffIds[1],
            startAt: createDateTime(nextWeek, 14, 0),
            duration: 45,
            memo: '肩こりケア',
            status: 'scheduled',
        },
        {
            patientId: patientIds[9], // 模型九太
            staffId: staffIds[2],
            startAt: createDateTime(nextWeek, 11, 0),
            duration: 60,
            memo: '月2回の定期ケア',
            status: 'scheduled',
        },
    ];
}
