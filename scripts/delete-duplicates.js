// Delete duplicate Yamada customers
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // IDs to delete (from browser subagent)
    const idsToDelete = [
        '62b71ff5-2770-47d5-be6a-3c1d34d93951', // duplicate Hanako
        'ed7e71dc-8cc5-45e8-9898-17097dc8fd92'  // duplicate Taro
    ];

    for (const id of idsToDelete) {
        try {
            // First delete related records
            await p.clinicalRecord.deleteMany({ where: { patientId: id } });
            await p.appointment.deleteMany({ where: { patientId: id } });
            // Then delete patient
            await p.patient.delete({ where: { id } });
            console.log('Deleted patient:', id);
        } catch (e) {
            console.log('Error deleting', id, e.message);
        }
    }

    console.log('Done!');
}

main().finally(() => p.$disconnect());
