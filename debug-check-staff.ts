
import { prisma } from './src/lib/db';

async function main() {
    console.log('--- Checking Staff Records ---');
    const staff = await prisma.staff.findMany();
    console.log(`Found ${staff.length} staff records.`);
    staff.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.name}, Role: ${s.role}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
