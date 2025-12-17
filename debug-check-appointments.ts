import { prisma } from './src/lib/db';
import * as fs from 'fs';

async function main() {
    const logBuffer: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logBuffer.push(msg);
    };

    log('Searching for customer: 山下 里美');

    // 名前で検索（部分一致）
    const patients = await prisma.patient.findMany({
        where: {
            OR: [
                { name: { contains: '山下' } },
                { name: { contains: '里美' } }
            ]
        }
    });

    log(`Found ${patients.length} customers.`);

    if (patients.length === 0) {
        log('No matching customer found.');
    } else {
        for (const p of patients) {
            log(`\n-- - Inspecting Customer: ${p.name} (ID: ${p.id}) --- `);

            const apps = await prisma.appointment.findMany({
                where: { patientId: p.id },
                orderBy: { startAt: 'desc' }
            });

            if (apps.length === 0) {
                log('  No appointments found.');
            } else {
                log(`  Found ${apps.length} appointments: `);
                apps.forEach(a => {
                    log(`    [${a.status}] ${a.startAt.toISOString()} (Local: ${a.startAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}) (ID: ${a.id})`);
                });
            }
        }
    }

    fs.writeFileSync('debug_result.txt', logBuffer.join('\n'));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
