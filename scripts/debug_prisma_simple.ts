
import 'dotenv/config'; // Load env before other imports
import { prisma } from '../src/lib/db';

async function main() {
    try {
        const url = process.env.DATABASE_URL || '';
        console.log('DATABASE_URL starts with:', url.split(':')[0]);
        console.log('Simple findMany...');
        const res = await prisma.patient.findMany();
        console.log('Success', res.length);
    } catch (e) {
        console.log('Caught Error!');
        console.error(e);
    }
}

main();
