import { prisma } from '@/lib/db';
import { PatientInput } from '@/config/schema';
import { getKanaVariants } from '@/lib/kanaUtils';

// Pure Service Functions

/**
 * Get patients with optional search query
 * Supports hiragana/katakana insensitive search
 */
export const getPatients = async (query?: string) => {
    // Check if query is numeric for ID search
    const isNumeric = query && /^\d+$/.test(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
        deletedAt: null, // Always exclude deleted patients
    };

    if (query) {
        // Get hiragana and katakana variants of the query
        const kanaVariants = getKanaVariants(query);

        // Build OR conditions for all kana variants
        const nameConditions = kanaVariants.map(v => ({ name: { contains: v } }));
        const kanaConditions = kanaVariants.map(v => ({ kana: { contains: v } }));

        where.OR = [
            ...nameConditions,
            ...kanaConditions,
        ];

        if (isNumeric) {
            where.OR.push({ pId: parseInt(query) });
        }
    }

    return await prisma.patient.findMany({
        where,
        include: {
            records: {
                orderBy: { visitDate: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' },
    });
};

/**
 * Find similar patients for duplicate check
 * Supports hiragana/katakana insensitive search
 */
export const findSimilarPatients = async (name: string, kana: string) => {
    if (!name && !kana) return [];

    // Get hiragana and katakana variants
    const nameVariants = name ? getKanaVariants(name) : [];
    const kanaVariants = kana ? getKanaVariants(kana) : [];

    // Build OR conditions for all variants
    const nameConditions = nameVariants.map(v => ({ name: { contains: v } }));
    const kanaConditions = kanaVariants.map(v => ({ kana: { contains: v } }));

    return await prisma.patient.findMany({
        where: {
            OR: [
                ...nameConditions,
                ...kanaConditions
            ],
            deletedAt: null
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
    });
};

export const getPatientById = async (id: string) => {
    return await prisma.patient.findUnique({
        where: { id },
        include: {
            records: {
                orderBy: { visitDate: 'desc' },
            },
        },
    });
};

export const createPatient = async (data: PatientInput) => {
    // Manual Auto-increment for SQLite
    const lastPatient = await prisma.patient.findFirst({
        orderBy: { pId: 'desc' },
    });
    const nextPId = (lastPatient?.pId ?? 0) + 1;

    return await prisma.patient.create({
        data: {
            pId: nextPId,
            name: data.name,
            kana: data.kana,
            phone: data.phone,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            gender: data.gender,
            memo: data.memo,
            // Default JSONs
            tags: '[]',
            attributes: '{}',
            externalRef: '{}',
            importMeta: '{}',
        },
    });
};
