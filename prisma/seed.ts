import { PrismaClient } from '@prisma/client'
import { setHours, setMinutes, subDays, addDays, format } from 'date-fns'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// マスタデータ定義
const patientDataList = [
    { name: '清水 恵', kana: 'シミズ メグミ', gender: 'Female' },
    { name: '田中 浩二', kana: 'タナカ コウジ', gender: 'Male' },
    { name: '渡辺 さくら', kana: 'ワタナベ サクラ', gender: 'Female' },
    { name: '山本 大輔', kana: 'ヤマモト ダイスケ', gender: 'Male' },
    { name: '小林 美咲', kana: 'コバヤシ ミサキ', gender: 'Female' },
    { name: '加藤 健一', kana: 'カトウ ケンイチ', gender: 'Male' },
    { name: '吉田 優子', kana: 'ヨシダ ユウコ', gender: 'Female' },
    { name: '佐々木 翔太', kana: 'ササキ ショウタ', gender: 'Male' },
    { name: '松本 玲奈', kana: 'マツモト レナ', gender: 'Female' },
    { name: '井上 拓也', kana: 'イノウエ タクヤ', gender: 'Male' },
    { name: '木村 香織', kana: 'キムラ カオリ', gender: 'Female' },
    { name: '林 修平', kana: 'ハヤシ シュウヘイ', gender: 'Male' },
    { name: '斎藤 麻衣', kana: 'サイトウ マイ', gender: 'Female' },
    { name: '山口 誠', kana: 'ヤマグチ マコト', gender: 'Male' },
    { name: '森 陽子', kana: 'モリ ヨウコ', gender: 'Female' },
    { name: '阿部 達也', kana: 'アベ タツヤ', gender: 'Male' },
    { name: '池田 奈々', kana: 'イケダ ナナ', gender: 'Female' },
    { name: '橋本 隆', kana: 'ハシモト タカシ', gender: 'Male' },
    { name: '山下 里美', kana: 'ヤマシタ サトミ', gender: 'Female' },
    { name: '中島 健吾', kana: 'ナカジマ ケンゴ', gender: 'Male' },
];

const OCCUPATIONS = ['システムエンジニア', '営業職', '保育士', '経理事務', '美容師', 'トラック運転手', '教師', '主婦', '経営者', 'Webデザイナー'];

const HOBBIES = ['テニス', 'ゴルフ', '登山', '映画鑑賞', '料理', 'ヨガ', 'サウナ', '読書', '釣り', 'ガーデニング'];

const MEDICAL_CONDITIONS = [
    { title: '肩こり（慢性）', detail: 'デスクワークによる眼精疲労からくる肩こり。僧帽筋上部の緊張強い。' },
    { title: '腰痛（ヘルニア既往）', detail: 'L4/L5ヘルニア既往あり。寒くなると痛みが増す。前屈制限あり。' },
    { title: '五十肩（回復期）', detail: '左肩関節周囲炎。夜間痛は消失。結帯動作での可動域制限が課題。' },
    { title: '自律神経失調気味', detail: '季節の変わり目に不調。不眠傾向あり。リラックス目的の施術希望。' },
    { title: 'ランナー膝', detail: '週末のランニング後に右膝外側に疼痛。腸脛靭帯の張り強い。' }
];

const SERVICE_PREFERENCES = [
    '強揉み希望。痛いくらいが丁度いいとのこと。',
    '揉み返しきやすいので、ソフトな指圧希望。',
    '鍼は苦手。お灸中心で。',
    '会話を楽しみたい。プライベートな話もOK。',
    '静かにリラックスしたい。施術中の会話は必要最低限で。'
];

// ヘルパー: ランダム選択
function pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// ヘルパー: 日付生成
const today = new Date('2026-01-15T09:00:00');
const setTime = (date: Date, hours: number, minutes: number) => setMinutes(setHours(date, hours), minutes);

async function main() {
    console.log('🌱 Start seeding with COMPLETE demo data...');

    // Clean up
    await prisma.appointment.deleteMany({})
    await prisma.clinicalRecord.deleteMany({})
    await prisma.patient.deleteMany({})
    await prisma.staff.deleteMany({})

    // Staff (with authentication)
    const passwordHash = await bcrypt.hash('1111', 10);
    const director = await prisma.staff.create({
        data: { id: 'staff-001', name: '高橋 院長', role: 'Director', active: true, loginId: 'admin', passwordHash }
    });
    const staffMember = await prisma.staff.create({
        data: { id: 'staff-002', name: '佐々木 スタッフ', role: 'Staff', active: true, loginId: 'staff', passwordHash }
    });

    const staffs = [director, staffMember];

    // Generate 20 Patients
    for (let i = 0; i < patientDataList.length; i++) {
        const pData = patientDataList[i];

        // Profile Generation
        const occupation = pick(OCCUPATIONS);
        const hobby = pick(HOBBIES);
        const condition = pick(MEDICAL_CONDITIONS);
        const preference = pick(SERVICE_PREFERENCES);
        const birthYear = 1960 + Math.floor(Math.random() * 40); // 1960-2000
        const birthDate = new Date(`${birthYear}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`);

        // Pinned Note Generation
        const pinnedNote = `【基本情報】
・職業：${occupation}
・趣味：${hobby}
・生年月日：${format(birthDate, 'yyyy/MM/dd')} (${2026 - birthYear}歳)

【主訴・身体状況】
・${condition.title}
⇒ ${condition.detail}

【施術・接遇の注意点】
・${preference}
・連絡手段：電話（${i % 2 === 0 ? '平日夕方以降' : '土日のみ'}繋がりやすい）

【次回の提案メモ】
・${hobby}の話を聞くこと。最近大会があったか確認。
・${i % 3 === 0 ? '回数券の案内をするタイミング。' : '自宅でのストレッチ継続確認。'}`;

        const patient = await prisma.patient.create({
            data: {
                pId: 1000 + i + 1,
                name: pData.name,
                kana: pData.kana,
                birthDate,
                phone: `090-${1000 + i}-${1000 + i}`,
                memo: pinnedNote,
                gender: pData.gender
            }
        });

        console.log(`Creating history for ${pData.name}...`);

        // History Generation (Timeline)
        const visitCount = 10 + Math.floor(Math.random() * 15); // 10~25 records

        for (let j = 0; j < visitCount; j++) {
            const weeksAgo = (visitCount - j) * 2; // 2週間に1回ペース
            const visitDate = subDays(today, weeksAgo * 7 + Math.floor(Math.random() * 3));
            const staff = pick(staffs);

            // Clinical Record
            let subjective = '';
            let assessment = '';

            if (j === 0) {
                subjective = `【初回】${condition.title}を訴え来院。\n仕事で${occupation}をしており負担が大きいとのこと。\n趣味の${hobby}も最近できていない。`;
                assessment = '初回評価により可動域制限確認。施術方針説明。';
            } else {
                const improvement = j / visitCount; // 進行度
                if (improvement < 0.3) {
                    subjective = `痛みまだ強い(VAS 7/10)。仕事後の疲労感あり。`;
                    assessment = '筋緊張緩和中心。';
                } else if (improvement < 0.7) {
                    subjective = `徐々に改善(VAS 4/10)。${hobby}を少し再開してみたとのこと。`;
                    assessment = '可動域訓練強度アップ。';
                } else {
                    subjective = `調子良い(VAS 1/10)。メンテナンス希望。`;
                    assessment = '全身調整。';
                }
            }

            // Verify: Long content test (Lines)
            if (j === 2) {
                subjective = '【行数テスト用データ】\n1行目\n2行目\n3行目\n4行目\nここから先は「もっと見る」で表示されるはずです。\n確認用テキスト。';
                assessment = '表示確認用';
            }

            await prisma.clinicalRecord.create({
                data: {
                    patientId: patient.id,
                    staffId: staff.id,
                    visitDate,
                    subjective,
                    assessment,
                    metadata: JSON.stringify({ type: 'record' })
                }
            });

            // Completed Appointment linked to this time
            await prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    staffId: staff.id,
                    startAt: setTime(visitDate, 10 + Math.floor(Math.random() * 8), 0),
                    duration: 60,
                    status: 'completed',
                    memo: `施術 #${j + 1}`
                }
            });

            // Occasional Memo (Phone, Email, etc.)
            if (Math.random() < 0.2) {
                const memoDate = addDays(visitDate, 3);
                await prisma.clinicalRecord.create({
                    data: {
                        patientId: patient.id,
                        staffId: staff.id,
                        visitDate: memoDate,
                        subjective: Math.random() > 0.5
                            ? '電話あり：予約変更の相談。'
                            : 'メール：次回の施術後に領収書発行希望。',
                        metadata: JSON.stringify({ type: 'memo' })
                    }
                });
            }
        }

        // Future Appointment (Randomly for half of patients)
        if (Math.random() > 0.3) {
            await prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    staffId: staffs[0].id,
                    startAt: setTime(addDays(today, 3 + Math.floor(Math.random() * 10)), 10, 0),
                    duration: 60,
                    status: 'scheduled',
                    memo: '次回予約'
                }
            });
        }
    }

    console.log('✅ Seeding completed with COMPLETE rich data set.');
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
