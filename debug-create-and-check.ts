
import { createAppointment } from './src/services/appointmentService';
import { prisma } from './src/lib/db';

async function main() {
    const patientId = 'e6258a3b-8266-4a43-991c-1f927c521395'; // 山下 里美
    const startAt = new Date('2026-01-15T13:00:00'); // 13:00

    console.log(`Creating appointment at ${startAt.toISOString()} for patient ${patientId}`);

    try {
        const result = await createAppointment(
            patientId,
            startAt,
            'Direct Check Memo',
            undefined,
            60
        );
        console.log('Created ID:', result.id);

        // 1. Find Unique (ID指定)
        const found = await prisma.appointment.findUnique({ where: { id: result.id } });
        console.log('Found by ID:', found ? 'YES' : 'NO');
        if (found) {
            console.log('  Status:', found.status);
            console.log('  StartAt:', found.startAt.toISOString());
        }

        // 2. Find Many (Patient指定) - Count check
        const allApps = await prisma.appointment.findMany({
            where: { patientId: patientId },
            orderBy: { startAt: 'desc' }
        });
        console.log(`Found ${allApps.length} appointments for this patient.`);
        const match = allApps.find(a => a.id === result.id);
        console.log('Found in list:', match ? 'YES' : 'NO');

        if (match) {
            console.log('  List item StartAt:', match.startAt.toISOString());
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main().finally(() => prisma.$disconnect());
