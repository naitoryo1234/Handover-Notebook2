import { prisma } from '@/lib/db';
import { RecordInput } from '@/config/schema';

// Extended type with creatorName
export type RecordWithCreator = Awaited<ReturnType<typeof prisma.clinicalRecord.findMany>>[number] & {
    staff: { id: string; name: string; role: string; active: boolean; createdAt: Date; updatedAt: Date } | null;
    creatorName?: string;
};

export const getRecordsByPatientId = async (patientId: string): Promise<RecordWithCreator[]> => {
    const records = await prisma.clinicalRecord.findMany({
        where: { patientId },
        orderBy: { visitDate: 'desc' },
        include: {
            attachments: true,
            staff: true
        }
    });

    // Collect creator IDs and fetch their names
    const creatorIds = [...new Set(
        records
            .filter(r => r.createdBy)
            .map(r => r.createdBy as string)
    )];

    const creators = creatorIds.length > 0
        ? await prisma.staff.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, name: true }
        })
        : [];

    const creatorMap = new Map(creators.map(c => [c.id, c.name]));

    return records.map(record => ({
        ...record,
        creatorName: record.createdBy
            ? creatorMap.get(record.createdBy)
            : undefined,
    }));
};

export const createRecord = async (data: RecordInput, patientId: string, createdBy?: string) => {
    // Validate staffId is provided (required by schema)
    if (!data.staffId) {
        throw new Error('担当者の選択は必須です');
    }

    // Auto-increment visit count
    const count = await prisma.clinicalRecord.count({
        where: { patientId },
    });

    return await prisma.clinicalRecord.create({
        data: {
            patientId,
            visitCount: count + 1,
            visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
            subjective: data.subjective || '',
            objective: data.objective || '',
            assessment: data.assessment || '',
            plan: data.plan || '',
            tags: JSON.stringify(data.tags || []),
            metadata: '{}',
            rawText: '', // Future use
            staffId: data.staffId,
            createdBy: createdBy || null,
            updatedBy: createdBy || null,
        },
    });
};

export const deleteRecord = async (recordId: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Get record to find patientId and visitCount
        const target = await tx.clinicalRecord.findUnique({
            where: { id: recordId },
            select: { patientId: true, visitCount: true }
        });

        if (!target) {
            throw new Error("Record not found");
        }

        // 2. Delete the record
        const deleted = await tx.clinicalRecord.delete({
            where: { id: recordId }
        });

        // 3. Decrement visitCount for all subsequent records of this patient
        await tx.clinicalRecord.updateMany({
            where: {
                patientId: target.patientId,
                visitCount: { gt: target.visitCount }
            },
            data: {
                visitCount: { decrement: 1 }
            }
        });

        return deleted;
    });
};
