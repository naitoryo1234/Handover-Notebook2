
import { PrismaClient } from '@prisma/client';
import { addDays, subDays, setHours, setMinutes, format, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

// 2025年12月20日を基準日とする
const BASE_DATE = new Date('2025-12-20T00:00:00+09:00');

async function main() {
    console.log('🌱 Starting maximally enhanced seed (Evening Heavy Ver)...');
    console.log('📅 Base Date:', BASE_DATE.toISOString());

    // 1. Clean up existing data
    await prisma.lineLinkRequest.deleteMany();
    await prisma.lineMessage.deleteMany();
    await prisma.lineChannel.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicalRecord.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.systemSetting.deleteMany();

    console.log('🧹 Cleaned up database');

    // 2. Create Staff
    const staffMembers = await Promise.all([
        prisma.staff.create({ data: { name: '院長', role: 'Director', active: true, loginId: 'admin' } }),
        prisma.staff.create({ data: { name: '鈴木 スタッフ', role: 'Staff', active: true, loginId: 'suzuki' } }),
        prisma.staff.create({ data: { name: '佐藤 スタッフ', role: 'Staff', active: true, loginId: 'sato' } })
    ]);
    const [admin, staff1, staff2] = staffMembers;
    const allStaff = staffMembers;

    // 3. Create Patients (VIP + Filler)
    const initialPatients = [
        // ... (VIPs same as before) ...
        { name: '鈴木 一郎', kana: 'スズキ イチロウ', gender: '男性', memo: '腰痛持ち。ゴルフ好き。', tags: ['VIP', '腰痛'], story: 'lumbago' },
        { name: '鈴木 花子', kana: 'スズキ ハナコ', gender: '女性', memo: '肩こり。アロマ希望。', tags: ['肩こり', 'アロマ'], story: 'stiff_shoulder' },
        { name: '山田 太郎', kana: 'ヤマダ タロウ', gender: '男性', memo: '遅刻癖あり。', tags: ['遅刻癖'], story: 'late_comer' },
        { name: '山田 優子', kana: 'ヤマダ ユウコ', gender: '女性', memo: '産後ケア。', tags: ['産後', '子供連れ'], story: 'postpartum' },
        { name: '池田 健太', kana: 'イケダ ケンタ', gender: '男性', memo: '五十肩治療中。', tags: ['五十肩'], story: 'frozen_shoulder' },
        { name: '池田 美咲', kana: 'イケダ ミサキ', gender: '女性', memo: 'テニス肘。学生。', tags: ['テニス', '学生'], story: 'sports' },
    ];

    // ダミーを30名に (有名人シリーズ)
    const dummyPatients = [
        { name: '伊藤 健二', kana: 'イトウ ケンジ' },
        { name: '渡辺 美里', kana: 'ワタナベ ミサト' },
        { name: '田中 角栄', kana: 'タナカ カクエイ' },
        { name: '高橋 大輔', kana: 'タカハシ ダイスケ' },
        { name: '小林 麻耶', kana: 'コバヤシ マヤ' },
        { name: '佐々木 希', kana: 'ササキ ノゾミ' },
        { name: '山本 耕史', kana: 'ヤマモト コウジ' },
        { name: '中村 獅童', kana: 'ナカムラ シドウ' },
        { name: '加藤 綾子', kana: 'カトウ アヤコ' },
        { name: '吉田 羊', kana: 'ヨシダ ヨウ' },
        { name: '山口 達也', kana: 'ヤマグチ タツヤ' },
        { name: '松本 潤', kana: 'マツモト ジュン' },
        { name: '井上 真央', kana: 'イノウエ マオ' },
        { name: '木村 カエラ', kana: 'キムラ カエラ' },
        { name: '林 遣都', kana: 'ハヤシ ケント' },
        { name: '斎藤 飛鳥', kana: 'サイトウ アスカ' },
        { name: '清水 富美加', kana: 'シミズ フミカ' },
        { name: '山崎 育三郎', kana: 'ヤマザキ イクサブロウ' },
        { name: '阿部 サダヲ', kana: 'アベ サダオ' },
        { name: '森 七菜', kana: 'モリ ナナ' },
        { name: '西島 秀俊', kana: 'ニシジマ ヒデトシ' },
        { name: '北川 景子', kana: 'キタガワ ケイコ' },
        { name: '星野 源', kana: 'ホシノ ゲン' },
        { name: '新垣 結衣', kana: 'アラガキ ユイ' },
        { name: '大泉 洋', kana: 'オオイズミ ヨウ' },
        { name: '広瀬 すず', kana: 'ヒロセ スズ' },
        { name: '菅田 将暉', kana: 'スダ マサキ' },
        { name: '小松 菜奈', kana: 'コマツ ナナ' },
        { name: '佐藤 健', kana: 'サトウ タケル' },
        { name: '上白石 萌音', kana: 'カミシライシ モネ' }
    ];

    let pIdCounter = 1000;
    const patients = [];

    // Create VIPs
    for (const p of initialPatients) {
        patients.push(await prisma.patient.create({
            data: {
                pId: pIdCounter++,
                name: p.name, kana: p.kana, gender: p.gender,
                memo: p.memo, tags: JSON.stringify(p.tags),
                birthDate: new Date('1990-01-01'),
            }
        }));
    }
    // Create Dummies
    for (const p of dummyPatients) {
        patients.push(await prisma.patient.create({
            data: {
                pId: pIdCounter++,
                name: p.name,
                kana: p.kana,
                gender: Math.random() > 0.5 ? '男性' : '女性',
                birthDate: new Date('1990-01-01'),
                tags: JSON.stringify([]),
            }
        }));
    }

    // 4. Generate Appointments
    const getDate = (dayOffset: number, h: number, m: number) => {
        const d = addDays(BASE_DATE, dayOffset);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const appointments = [];

    // --- VIP Stories ---
    // 山田 優子: 14:30 担当未定・赤ちゃん連れ
    appointments.push({
        pIndex: 3, offset: 0, h: 14, m: 30, duration: 60, staff: null, status: 'scheduled',
        memo: '骨盤矯正。ベビーカー。', adminMemo: '⚠️ 赤ちゃん連れ対応要。担当者調整中。', isMemoResolved: false
    });
    // 鈴木 一郎: 完了
    appointments.push({ pIndex: 0, offset: 0, h: 9, m: 30, duration: 60, staff: admin, status: 'completed', memo: '腰痛メンテ' });
    // 山田 太郎: 遅刻来店
    appointments.push({ pIndex: 2, offset: 0, h: 10, m: 0, duration: 45, staff: staff1, status: 'arrived', arrivedAt: getDate(0, 10, 15), memo: '遅刻' });
    // 池田 健太: 完了
    appointments.push({ pIndex: 4, offset: 0, h: 11, m: 0, duration: 60, staff: admin, status: 'completed', memo: '五十肩' });
    // 鈴木 花子: 明日予約
    appointments.push({ pIndex: 1, offset: 1, h: 14, m: 0, duration: 90, staff: staff2, status: 'scheduled', memo: 'アロマ90分' });

    // --- Evening Rush (Today 17:30 - 20:00) ---
    // デモ用の夕方の混雑
    const eveningSlots = [
        { h: 17, m: 30, staff: admin, duration: 60, memo: '仕事帰り。首肩集中。' },
        { h: 17, m: 30, staff: staff1, duration: 30, memo: '指名なし。クイック。' }, // 同時間帯
        { h: 17, m: 30, staff: staff2, duration: 45, memo: '前回良かったので指名。', adminMemo: '前回担当: 佐藤' },

        { h: 18, m: 0, staff: staff1, duration: 60, memo: '腰痛ひどい。' },
        { h: 18, m: 30, staff: staff2, duration: 30, memo: '足裏30分' },
        { h: 18, m: 45, staff: admin, duration: 60, memo: '全身調整', adminMemo: '⚠️ 新患。カルテ作成必要', isMemoResolved: false }, // 申し送り

        { h: 19, m: 0, staff: staff1, duration: 60, memo: 'アロマ60分' },
        { h: 19, m: 30, staff: staff2, duration: 45, memo: '鍼治療' },
    ];

    let pIdx = 6;
    for (const slot of eveningSlots) {
        appointments.push({
            pIndex: pIdx++, // ダミー顧客を順番に使う
            offset: 0,
            h: slot.h, m: slot.m,
            duration: slot.duration,
            staff: slot.staff,
            status: 'scheduled',
            memo: slot.memo,
            adminMemo: slot.adminMemo,
            isMemoResolved: slot.isMemoResolved || true
        });
    }

    // --- Filler Appointments (Volume & Variety) ---
    const days = [-7, -6, -5, -4, -3, -2, -1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const adminMemos = ['⚠️ クーポン利用', '回数券提案', '誕プレ', '前回注意', '同意書', '紹介カード', '担当変更?'];

    // ★ SAVE THE DEFINED APPOINTMENTS (VIP & Evening) FIRST ★
    for (const apt of appointments) {
        // pIndexからpatient ID解決
        const patientStub = patients.find(p => p.pId === 1000 + apt.pIndex) || patients[apt.pIndex];
        if (!patientStub) continue;

        const savedApt = await prisma.appointment.create({
            data: {
                patientId: patientStub.id,
                staffId: apt.staff ? apt.staff.id : null,
                startAt: getDate(apt.offset, apt.h, apt.m),
                duration: apt.duration,
                status: apt.status,
                memo: apt.memo,
                adminMemo: apt.adminMemo,
                isMemoResolved: apt.isMemoResolved !== undefined ? apt.isMemoResolved : true,
                arrivedAt: apt.arrivedAt,
            }
        });

        // 完了ステータスの場合はカルテも作成
        if (apt.status === 'completed') {
            await prisma.clinicalRecord.create({
                data: {
                    patientId: patientStub.id,
                    staffId: apt.staff ? apt.staff.id : admin.id,
                    visitDate: getDate(apt.offset, apt.h, apt.m),
                    subjective: apt.memo || '特になし',
                    assessment: '経過良好',
                }
            });
        }
    }

    // Then create fillers
    for (const offset of days) {
        const dailyCount = Math.floor(Math.random() * 5) + 6; // 6-10件/日
        for (let i = 0; i < dailyCount; i++) {
            const p = patients[Math.floor(Math.random() * patients.length)];
            const h = 10 + Math.floor(Math.random() * 8);
            const m = Math.random() > 0.5 ? 0 : 30;
            const durations = [30, 45, 60, 90];
            const duration = durations[Math.floor(Math.random() * durations.length)];

            // 夕方(17:30以降)の今日(0)は既に埋めたので避ける
            if (offset === 0 && h >= 17) continue;

            let status = 'scheduled';
            if (offset < 0) status = Math.random() > 0.1 ? 'completed' : 'cancelled';
            if (offset === 0 && h < 12) status = 'completed';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let staff: any = allStaff[Math.floor(Math.random() * allStaff.length)];
            if (status === 'scheduled' && Math.random() < 0.15) staff = null;

            let adminMemo = null;
            let isMemoResolved = true;
            if (Math.random() < 0.25) {
                adminMemo = adminMemos[Math.floor(Math.random() * adminMemos.length)];
                if (offset >= 0) isMemoResolved = Math.random() > 0.7; // 30%未解決
            }

            await prisma.appointment.create({
                data: {
                    patientId: p.id,
                    staffId: staff ? staff.id : null,
                    startAt: getDate(offset, h, m),
                    duration: duration,
                    status: status,
                    memo: offset < 0 ? '定期ケア' : 'Web予約',
                    adminMemo: adminMemo,
                    isMemoResolved: isMemoResolved,
                }
            });

            if (status === 'completed') {
                await prisma.clinicalRecord.create({
                    data: {
                        patientId: p.id,
                        staffId: staff ? staff.id : admin.id,
                        visitDate: getDate(offset, h, m),
                        subjective: '特になし',
                        assessment: '経過良好',
                    }
                });
            }
        }
    }
    console.log('✨ Maximized Seed finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
