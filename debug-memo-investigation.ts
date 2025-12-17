/**
 * Debug Script: Investigate Memo Auto-Copy Issue
 * 
 * This script checks raw database values to determine if:
 * 1. Appointment.memo is being populated at CREATE time
 * 2. Prisma is incorrectly joining Patient.memo into Appointment.memo
 * 
 * Run: npx ts-node debug-memo-investigation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function investigateMemoIssue() {
    console.log('========================================');
    console.log('Memo Auto-Copy Investigation');
    console.log('========================================\n');

    // Step 1: Get a patient with a memo
    const patientWithMemo = await prisma.patient.findFirst({
        where: {
            memo: { not: null, not: '' }
        },
        select: {
            id: true,
            name: true,
            memo: true,
        }
    });

    if (!patientWithMemo) {
        console.log('No patient with memo found. Creating test patient...');
        const testPatient = await prisma.patient.create({
            data: {
                pId: 99999,
                name: 'Test Patient for Debug',
                kana: 'テストペイシェント',
                memo: 'This is the PATIENT memo (Pinned Note)',
            }
        });
        console.log('Created test patient:', testPatient);
    }

    const patient = patientWithMemo || await prisma.patient.findFirst({
        where: { pId: 99999 },
        select: { id: true, name: true, memo: true }
    });

    if (!patient) {
        console.log('ERROR: Could not find or create patient');
        return;
    }

    console.log('=== Target Patient ===');
    console.log(`ID: ${patient.id}`);
    console.log(`Name: ${patient.name}`);
    console.log(`Patient Memo: "${patient.memo}"`);
    console.log('');

    // Step 2: Query existing appointments for this patient (RAW)
    console.log('=== Existing Appointments (Raw Query) ===');
    const existingAppointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        select: {
            id: true,
            memo: true,
            startAt: true,
        },
        orderBy: { startAt: 'desc' },
        take: 5,
    });

    for (const appt of existingAppointments) {
        console.log(`Appointment ${appt.id}:`);
        console.log(`  - DB memo value: "${appt.memo}"`);
        console.log(`  - memo is null: ${appt.memo === null}`);
        console.log(`  - memo is empty string: ${appt.memo === ''}`);
        console.log(`  - memo === patient.memo: ${appt.memo === patient.memo}`);
        console.log('');
    }

    // Step 3: Query WITH patient include to see if Prisma does something weird
    console.log('=== Appointments WITH Patient Include ===');
    const appointmentsWithPatient = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
            patient: {
                select: { memo: true }
            }
        },
        orderBy: { startAt: 'desc' },
        take: 3,
    });

    for (const appt of appointmentsWithPatient) {
        console.log(`Appointment ${appt.id}:`);
        console.log(`  - appt.memo: "${appt.memo}"`);
        console.log(`  - appt.patient.memo: "${appt.patient.memo}"`);
        console.log(`  - Are they equal? ${appt.memo === appt.patient.memo}`);
        console.log('');
    }

    // Step 4: Create a new test appointment with EMPTY memo
    console.log('=== Creating Test Appointment (memo = empty string) ===');
    const testAppointment = await prisma.appointment.create({
        data: {
            patientId: patient.id,
            startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            memo: '', // Explicitly empty
            duration: 30,
        }
    });
    console.log(`Created appointment: ${testAppointment.id}`);
    console.log(`  - Saved memo value: "${testAppointment.memo}"`);
    console.log('');

    // Step 5: Re-read the appointment to check what Prisma returns
    console.log('=== Re-reading Test Appointment ===');

    // Raw read
    const rawRead = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
        select: { id: true, memo: true }
    });
    console.log(`Raw read memo: "${rawRead?.memo}"`);

    // Read with patient
    const withPatientRead = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
        include: { patient: { select: { memo: true } } }
    });
    console.log(`With patient read:`);
    console.log(`  - appt.memo: "${withPatientRead?.memo}"`);
    console.log(`  - patient.memo: "${withPatientRead?.patient.memo}"`);
    console.log('');

    // Step 6: Create appointment with null memo
    console.log('=== Creating Test Appointment (memo = undefined/null) ===');
    const testAppointment2 = await prisma.appointment.create({
        data: {
            patientId: patient.id,
            startAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
            // memo is NOT set (undefined)
            duration: 30,
        }
    });
    console.log(`Created appointment: ${testAppointment2.id}`);
    console.log(`  - Saved memo value: "${testAppointment2.memo}"`);
    console.log(`  - memo is null: ${testAppointment2.memo === null}`);
    console.log('');

    // Cleanup
    console.log('=== Cleanup ===');
    await prisma.appointment.delete({ where: { id: testAppointment.id } });
    await prisma.appointment.delete({ where: { id: testAppointment2.id } });
    console.log('Deleted test appointments');

    console.log('\n========================================');
    console.log('Investigation Complete');
    console.log('========================================');
}

investigateMemoIssue()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
