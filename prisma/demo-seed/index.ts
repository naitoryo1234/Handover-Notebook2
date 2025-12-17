/**
 * デモ用シードスクリプト
 * 
 * 使用方法:
 *   npm run seed:demo
 * 
 * このスクリプトは、デモ用の架空データをデータベースに投入します。
 * 本番環境では絶対に実行しないでください。
 */

import { PrismaClient } from '@prisma/client';
import { demoPatients } from './patients';
import { demoStaff } from './staff';
import { generateDemoAppointments } from './appointments';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Demo Seed: Starting...');

    // 1. 既存データをクリア（デモ環境のみ！）
    console.log('  Clearing existing data...');
    await prisma.appointment.deleteMany();
    await prisma.clinicalRecord.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.staff.deleteMany();

    // 2. スタッフを作成
    console.log('  Creating demo staff...');
    const createdStaff = await Promise.all(
        demoStaff.map(staff =>
            prisma.staff.create({ data: staff })
        )
    );
    const staffIds = createdStaff.map(s => s.id);
    console.log(`    Created ${staffIds.length} staff members.`);

    // 3. 患者を作成
    console.log('  Creating demo patients...');
    const createdPatients = await Promise.all(
        demoPatients.map(patient =>
            prisma.patient.create({ data: patient })
        )
    );
    const patientIds = createdPatients.map(p => p.id);
    console.log(`    Created ${patientIds.length} patients.`);

    // 4. 予約を作成
    console.log('  Creating demo appointments...');
    const appointmentsData = generateDemoAppointments(patientIds, staffIds);
    await Promise.all(
        appointmentsData.map(apt =>
            prisma.appointment.create({ data: apt })
        )
    );
    console.log(`    Created ${appointmentsData.length} appointments.`);

    // 5. サンプルカルテを作成（最初の患者に1件）
    console.log('  Creating sample clinical record...');
    await prisma.clinicalRecord.create({
        data: {
            patientId: patientIds[0],
            staffId: staffIds[0],
            visitDate: new Date('2025-01-10T10:00:00'),
            subjective: '腰部の痛み（2週間前から）。座り仕事が続くと痛みが増す。朝起きた時が一番つらい。',
            objective: '腰部筋緊張 ++、前屈制限あり',
            assessment: '慢性腰痛（筋筋膜性）',
            plan: '週1回の施術継続。ストレッチ指導済み。',
        }
    });
    console.log('    Created 1 clinical record.');

    console.log('✅ Demo Seed: Completed!');
    console.log('');
    console.log('📌 Demo Date: ' + (process.env.DEMO_FIXED_DATE || '2025-01-15'));
    console.log('   This is the "today" for demo purposes.');
}

main()
    .catch((e) => {
        console.error('❌ Demo Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
