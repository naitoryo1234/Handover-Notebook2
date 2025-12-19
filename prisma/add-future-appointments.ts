import { PrismaClient } from '@prisma/client'
import { addDays, setHours, setMinutes, format } from 'date-fns'

const prisma = new PrismaClient()

// 時間設定ヘルパー
const setTime = (date: Date, hours: number, minutes: number) => setMinutes(setHours(date, hours), minutes);

// ランダム選択ヘルパー
function pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// 今日の日付を基準に
const today = new Date();
today.setHours(0, 0, 0, 0);

const timeSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const durations = [30, 45, 60, 90];
const memos = [
    '定期メンテナンス',
    '初回カウンセリング',
    '肩こり施術',
    '腰痛集中コース',
    '疲労回復コース',
    '',
    '',
    ''
];

const adminMemoSamples = [
    '',
    '',
    '',
    '前回、次回は強揉み希望とのこと',
    '回数券の案内をする',
    '遅れる可能性ありとの連絡あり',
    ''
];

async function main() {
    console.log('📅 Adding future appointments for the next 2 weeks...');

    // 既存の顧客とスタッフを取得
    const patients = await prisma.patient.findMany();
    const staffs = await prisma.staff.findMany();

    if (patients.length === 0 || staffs.length === 0) {
        console.error('❌ No patients or staff found. Please run the main seed first.');
        return;
    }

    console.log(`Found ${patients.length} patients and ${staffs.length} staff members.`);

    // 今日から14日間の予約を生成
    let createdCount = 0;

    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
        const targetDate = addDays(today, dayOffset);

        // 1日あたり3-8件の予約を生成
        const appointmentsPerDay = 3 + Math.floor(Math.random() * 6);

        // 使用する時間帯をシャッフル
        const availableSlots = [...timeSlots].sort(() => Math.random() - 0.5);

        for (let i = 0; i < appointmentsPerDay && i < availableSlots.length; i++) {
            const patient = pick(patients);
            const hour = availableSlots[i];
            const minute = pick([0, 30]);
            const duration = pick(durations);
            const memo = pick(memos);
            const adminMemo = pick(adminMemoSamples);

            // 50%の確率でスタッフ割り当て、それ以外は担当未定
            const staff = Math.random() > 0.3 ? pick(staffs) : null;

            await prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    staffId: staff?.id || null,
                    startAt: setTime(targetDate, hour, minute),
                    duration,
                    status: 'scheduled',
                    memo: memo || null,
                    adminMemo: adminMemo || null,
                    isMemoResolved: adminMemo ? Math.random() > 0.5 : true
                }
            });

            createdCount++;
        }

        console.log(`  ${format(targetDate, 'yyyy-MM-dd')}: ${appointmentsPerDay} appointments created`);
    }

    console.log(`✅ Successfully created ${createdCount} future appointments.`);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
