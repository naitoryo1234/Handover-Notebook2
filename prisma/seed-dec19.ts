import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 12月19日（JST）のサンプル予約を追加するスクリプト
// ステータス、担当者、申し送り、時間帯など様々なパターンを網羅

async function main() {
    console.log('🌱 Adding sample appointments for December 19, 2025 (JST)...');

    // 既存のスタッフと患者を取得
    const staffs = await prisma.staff.findMany();
    const patients = await prisma.patient.findMany({ take: 15 });

    if (staffs.length === 0 || patients.length === 0) {
        console.error('❌ No staff or patients found. Run the main seed first.');
        return;
    }

    const director = staffs[0];
    const staffMember = staffs[1] || staffs[0];

    // 12月19日のJST時刻を作成するヘルパー
    // 例: createJSTTime(9, 0) → 2025-12-19T09:00:00+09:00 のUTC表現
    const createJSTTime = (hours: number, minutes: number): Date => {
        return new Date(`2025-12-19T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+09:00`);
    };

    // 既存の12/19予約を削除（テスト用にクリーン状態にする）
    const dec19Start = new Date('2025-12-18T15:00:00Z'); // JST 12/19 00:00
    const dec19End = new Date('2025-12-19T14:59:59Z');   // JST 12/19 23:59

    const deleted = await prisma.appointment.deleteMany({
        where: {
            startAt: { gte: dec19Start, lte: dec19End }
        }
    });
    console.log(`🗑️ Deleted ${deleted.count} existing appointments for Dec 19.`);

    // 様々なパターンの予約を追加
    const appointments = [
        // ===== 早朝 (00:00 - 09:00) =====
        // これらは境界テスト用 - 通常の営業時間外

        // ===== 午前 (09:00 - 12:00) =====
        {
            patientId: patients[0].id,
            staffId: director.id,
            startAt: createJSTTime(9, 0),
            duration: 60,
            status: 'scheduled',
            memo: '通常予約',
            adminMemo: null,
        },
        {
            patientId: patients[1].id,
            staffId: staffMember.id,
            startAt: createJSTTime(9, 30),
            duration: 30,
            status: 'scheduled',
            memo: '短時間施術',
            adminMemo: '【確認】保険証を持参してもらう',
            isMemoResolved: false,
        },
        {
            patientId: patients[2].id,
            staffId: director.id,
            startAt: createJSTTime(10, 0),
            duration: 90,
            status: 'arrived',  // チェックイン済み
            memo: '初回カウンセリング含む',
            adminMemo: '【重要】アレルギーあり（金属）要確認',
            isMemoResolved: false,
        },
        {
            patientId: patients[3].id,
            staffId: null,  // 担当未定
            startAt: createJSTTime(11, 0),
            duration: 60,
            status: 'scheduled',
            memo: null,
            adminMemo: '担当者を決めてください',
            isMemoResolved: false,
        },
        {
            patientId: patients[4].id,
            staffId: staffMember.id,
            startAt: createJSTTime(11, 30),
            duration: 60,
            status: 'completed',  // 完了済み
            memo: '定期メンテナンス',
            adminMemo: null,
        },

        // ===== 午後 (12:00 - 18:00) =====
        {
            patientId: patients[5].id,
            staffId: director.id,
            startAt: createJSTTime(13, 0),
            duration: 60,
            status: 'scheduled',
            memo: '昼休み明け',
            adminMemo: '【申し送り】前回キャンセル歴あり、確認電話済み',
            isMemoResolved: true,  // 解決済み
        },
        {
            patientId: patients[6].id,
            staffId: null,  // 担当未定
            startAt: createJSTTime(14, 0),
            duration: 45,
            status: 'scheduled',
            memo: 'お試しコース',
            adminMemo: null,
        },
        {
            patientId: patients[7].id,
            staffId: staffMember.id,
            startAt: createJSTTime(15, 0),
            duration: 60,
            status: 'cancelled',  // キャンセル済み
            memo: '体調不良のためキャンセル',
            adminMemo: null,
        },
        {
            patientId: patients[8].id,
            staffId: director.id,
            startAt: createJSTTime(15, 30),
            duration: 60,
            status: 'arrived',
            memo: '肩こり集中ケア',
            adminMemo: '【緊急】腰に痺れあり（本人申告）医師確認後に施術',
            isMemoResolved: false,
        },
        {
            patientId: patients[9].id,
            staffId: staffMember.id,
            startAt: createJSTTime(16, 30),
            duration: 90,
            status: 'scheduled',
            memo: 'フルコース',
            adminMemo: null,
        },

        // ===== 夕方〜夜 (18:00 - 21:00) =====
        {
            patientId: patients[10].id,
            staffId: director.id,
            startAt: createJSTTime(18, 0),
            duration: 60,
            status: 'scheduled',
            memo: '仕事帰り',
            adminMemo: '【メモ】次回から回数券購入検討中',
            isMemoResolved: false,
        },
        {
            patientId: patients[11].id,
            staffId: null,
            startAt: createJSTTime(19, 0),
            duration: 60,
            status: 'scheduled',
            memo: null,
            adminMemo: null,
        },
        {
            patientId: patients[12].id,
            staffId: staffMember.id,
            startAt: createJSTTime(20, 0),
            duration: 60,
            status: 'scheduled',
            memo: '最終枠',
            adminMemo: '【確認】駐車場の案内をする（初来店）',
            isMemoResolved: false,
        },
    ];

    // 予約を作成
    for (const apt of appointments) {
        await prisma.appointment.create({
            data: apt
        });
    }

    console.log(`✅ Created ${appointments.length} sample appointments for December 19, 2025.`);
    console.log('');
    console.log('📋 Summary:');
    console.log('  - Scheduled: 8');
    console.log('  - Arrived: 2');
    console.log('  - Completed: 1');
    console.log('  - Cancelled: 1');
    console.log('  - With AdminMemo: 7');
    console.log('  - Unassigned Staff: 3');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
