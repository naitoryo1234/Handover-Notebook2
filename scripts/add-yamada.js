// Use the project's Prisma client
const { prisma } = require('../src/lib/db');
const p = prisma;

async function main() {
    // Get max pId
    const last = await p.patient.findFirst({ orderBy: { pId: 'desc' } });
    const nextPId = (last?.pId ?? 0) + 1;

    // Add Yamada Taro
    const taro = await p.patient.create({
        data: {
            pId: nextPId,
            name: '山田 太郎',
            kana: 'ヤマダ タロウ',
            phone: '090-1234-5678',
            memo: '腰痛持ち。週1回のメンテナンス',
            tags: '[]',
            attributes: '{}',
            externalRef: '{}',
            importMeta: '{}'
        }
    });
    console.log('Created:', taro.name);

    // Add Yamada Hanako
    const hanako = await p.patient.create({
        data: {
            pId: nextPId + 1,
            name: '山田 花子',
            kana: 'ヤマダ ハナコ',
            phone: '090-8765-4321',
            birthDate: new Date('1985-03-15'),
            memo: '肩こりがひどい。デスクワーク',
            tags: '[]',
            attributes: '{}',
            externalRef: '{}',
            importMeta: '{}'
        }
    });
    console.log('Created:', hanako.name);

    // Add a record for Hanako (to show different last visit)
    const staff = await p.staff.findFirst();
    if (staff) {
        await p.clinicalRecord.create({
            data: {
                patientId: hanako.id,
                staffId: staff.id,
                visitDate: new Date('2024-12-10'),
                subjective: '肩こりがひどく、デスクワークで悪化',
                metadata: JSON.stringify({ type: 'memo', flags: [] })
            }
        });
        console.log('Added record for Hanako');
    }

    // Add appointment for Taro  
    await p.appointment.create({
        data: {
            patientId: taro.id,
            staffId: staff?.id,
            startAt: new Date('2024-12-15T10:00:00'),
            endAt: new Date('2024-12-15T10:30:00'),
            status: 'completed',
            memo: '定期メンテナンス'
        }
    });
    console.log('Added appointment for Taro');

    console.log('Done!');
}

main().finally(() => p.$disconnect());
