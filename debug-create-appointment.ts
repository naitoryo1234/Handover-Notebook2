
import { createAppointment } from './src/services/appointmentService';
import { prisma } from './src/lib/db';

async function main() {
    // 山下 里美
    const patientId = 'e6258a3b-8266-4a43-991c-1f927c521395';
    // ユーザーが試したであろう日時 (2026/01/15 10:00)
    // Local time string parsing check
    const startAt = new Date('2026-01-15T10:00:00');

    console.log('Attempting to create appointment for:', startAt.toString());

    try {
        const result = await createAppointment(
            patientId,
            startAt,
            'Debug memo from script',
            undefined, // staffId
            60, // duration
            'Admin memo debug'
        );
        console.log('Success! Created Appointment ID:', result.id);
        console.log('Status:', result.status);
    } catch (e) {
        console.error('Error creating appointment:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
