
import { getPatients } from '../src/services/patientService';

async function main() {
    try {
        console.log('Testing getPatients with empty query...');
        await getPatients('');
        console.log('Success empty');

        console.log('Testing getPatients with "test"...');
        await getPatients('test');
        console.log('Success test');

        console.log('Testing getPatients with "123"...');
        await getPatients('123');
        console.log('Success 123');

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
