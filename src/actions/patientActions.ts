'use server'

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPatient, findSimilarPatients } from '@/services/patientService';
import { getNow } from '@/lib/dateUtils';
import { getKanaVariants } from '@/lib/kanaUtils';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * Create a new patient
 */
export async function addPatient(formData: FormData) {
    const rawData = {
        name: formData.get('name') as string,
        kana: formData.get('kana') as string,
        birthDate: formData.get('birthDate') as string || undefined,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        memo: formData.get('memo') as string,
        tags: formData.get('tags') as string || undefined
    }

    if (!rawData.name || !rawData.kana) {
        // Simple server-side validation
        throw new Error('Name and Kana are required');
    }

    // Process tags (comma separated string -> JSON array)
    // Note: createPatient service might need adjustment if tags not passed
    // But createPatient takes PatientCreateInput which expects tags as String (JSON)
    // We should parse it here.
    let tagsJson: string | undefined = undefined;
    if (rawData.tags) {
        tagsJson = JSON.stringify(rawData.tags.split(',').map(t => t.trim()).filter(Boolean));
    }

    const inputData = { ...rawData, tags: tagsJson };
    const newPatient = await createPatient(inputData);

    revalidatePath('/');
    redirect(`/patients/${newPatient.id}`);
}

/**
 * Update entire patient profile
 */
export async function updatePatient(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const kana = formData.get('kana') as string;
    const gender = formData.get('gender') as string;
    const phone = formData.get('phone') as string;
    const birthDateStr = formData.get('birthDate') as string;
    const memo = formData.get('memo') as string;
    const tagsStr = formData.get('tags') as string;

    if (!id || !name || !kana) {
        return { success: false, message: '必須項目が不足しています' };
    }

    let birthDate: Date | null = null;
    if (birthDateStr) {
        birthDate = new Date(birthDateStr);
    }

    let tagsJson: string | undefined = undefined;
    if (tagsStr) {
        tagsJson = JSON.stringify(tagsStr.split(',').map(t => t.trim()).filter(Boolean));
    }

    try {
        await prisma.patient.update({
            where: { id },
            data: {
                name,
                kana,
                gender: gender || null,
                phone: phone || null,
                birthDate: birthDate || null,
                memo: memo || '',
                tags: tagsJson // Update tags if present (ConfigForm sends them)
            }
        });

        revalidatePath(`/patients/${id}`);
    } catch (error) {
        console.error('Failed to update patient:', error);
        return { success: false, error: 'Failed to update patient' };
    }

    // Success redirect
    redirect(`/patients/${id}`);
}

/**
 * Check for duplicate patients
 */
export async function checkDuplicates(name: string, kana: string) {
    if (!name && !kana) return [];
    const results = await findSimilarPatients(name, kana);
    // Serialize dates for client component
    return results.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        birthDate: p.birthDate ? p.birthDate.toISOString() : null,
    }));
}

/**
 * Update patient memo
 */
export async function updatePatientMemo(patientId: string, memo: string) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { memo }
        });
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update patient memo:', error);
        return { success: false, error: 'Failed to update memo' };
    }
}

/**
 * Update patient tags
 */
export async function updatePatientTags(patientId: string, tags: string[]) {
    try {
        await prisma.patient.update({
            where: { id: patientId },
            data: { tags: JSON.stringify(tags) }
        });
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update patient tags:', error);
        return { success: false, error: 'Failed to update tags' };
    }
}

/**
 * Logically delete a patient and cancel future appointments
 */
export async function deletePatient(patientId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Cancel future appointments (Integrity)
            // Only cancel 'scheduled' appointments in the future
            await tx.appointment.updateMany({
                where: {
                    patientId: patientId,
                    startAt: { gte: getNow() },
                    status: 'scheduled'
                },
                data: { status: 'cancelled' }
            });

            // 2. Logically delete the patient
            await tx.patient.update({
                where: { id: patientId },
                data: { deletedAt: new Date() }
            });
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete patient:', error);
        return { success: false, error: 'Failed to delete patient' };
    }
}

/**
 * Search patients for selection (Lightweight)
 * Supports hiragana/katakana insensitive search
 */
export async function searchPatientsForSelect(query: string) {
    if (!query || query.length < 1) return [];

    const isNumeric = /^\d+$/.test(query);
    const idCondition = isNumeric ? { pId: parseInt(query) } : undefined;

    // Get hiragana and katakana variants of the query
    const kanaVariants = getKanaVariants(query);

    // Build OR conditions for all kana variants
    const nameConditions = kanaVariants.map(v => ({ name: { contains: v } }));
    const kanaConditions = kanaVariants.map(v => ({ kana: { contains: v } }));

    const patients = await prisma.patient.findMany({
        where: {
            OR: [
                ...nameConditions,
                ...kanaConditions,
                ...(idCondition ? [idCondition] : [])
            ],
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            kana: true,
            pId: true,
            birthDate: true,
            phone: true,
            memo: true
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
    });

    return patients.map(p => ({
        ...p,
        birthDate: p.birthDate ? p.birthDate.toISOString() : null
    }));
}

/**
 * Global search across patients and their records
 * Searches: name, kana, phone, memo (Pinned Note), ClinicalRecord content
 * Returns patients with hit information (where the match was found)
 */
export type GlobalSearchResult = {
    patient: {
        id: string;
        name: string;
        kana: string;
        pId: number;
        phone: string | null;
    };
    hits: Array<{
        field: 'name' | 'kana' | 'phone' | 'memo' | 'record';
        preview: string;
        date?: string;
    }>;
};

export async function searchPatientsGlobal(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.length < 2) return [];

    const q = query.trim();
    const kanaVariants = getKanaVariants(q);

    // 1. Search in Patient fields (name, kana, phone, memo)
    const patientConditions = [
        ...kanaVariants.map(v => ({ name: { contains: v, mode: 'insensitive' as const } })),
        ...kanaVariants.map(v => ({ kana: { contains: v, mode: 'insensitive' as const } })),
        { phone: { contains: q } },
        { memo: { contains: q, mode: 'insensitive' as const } },
    ];

    const patientsFromPatient = await prisma.patient.findMany({
        where: {
            OR: patientConditions,
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            kana: true,
            pId: true,
            phone: true,
            memo: true,
        },
        take: 20,
        orderBy: { updatedAt: 'desc' }
    });

    // 2. Search in ClinicalRecord fields (subjective, objective, assessment, plan)
    const recordConditions = [
        { subjective: { contains: q, mode: 'insensitive' as const } },
        { objective: { contains: q, mode: 'insensitive' as const } },
        { assessment: { contains: q, mode: 'insensitive' as const } },
        { plan: { contains: q, mode: 'insensitive' as const } },
    ];

    const recordsWithPatient = await prisma.clinicalRecord.findMany({
        where: {
            OR: recordConditions,
            patient: { deletedAt: null }
        },
        select: {
            id: true,
            subjective: true,
            objective: true,
            assessment: true,
            plan: true,
            visitDate: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    kana: true,
                    pId: true,
                    phone: true,
                    memo: true,
                }
            }
        },
        take: 50,
        orderBy: { visitDate: 'desc' }
    });

    // 3. Build result map (patient ID -> result)
    const resultMap = new Map<string, GlobalSearchResult>();

    // Helper to add hit
    const addHit = (
        patient: { id: string; name: string; kana: string; pId: number; phone: string | null },
        hit: GlobalSearchResult['hits'][0]
    ) => {
        if (!resultMap.has(patient.id)) {
            resultMap.set(patient.id, { patient, hits: [] });
        }
        // Avoid duplicate hits (same field and similar preview)
        const existing = resultMap.get(patient.id)!;
        const isDuplicate = existing.hits.some(h => h.field === hit.field && h.preview === hit.preview);
        if (!isDuplicate) {
            existing.hits.push(hit);
        }
    };

    // Helper to extract preview (show around the match)
    const extractPreview = (text: string | null, maxLen = 60): string => {
        if (!text) return '';
        const lowerText = text.toLowerCase();
        const lowerQ = q.toLowerCase();
        const idx = lowerText.indexOf(lowerQ);
        if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '...' : '');
        const start = Math.max(0, idx - 20);
        const end = Math.min(text.length, idx + q.length + 40);
        let preview = text.slice(start, end);
        if (start > 0) preview = '...' + preview;
        if (end < text.length) preview = preview + '...';
        return preview;
    };

    // Process patient matches
    for (const p of patientsFromPatient) {
        const patient = { id: p.id, name: p.name, kana: p.kana, pId: p.pId, phone: p.phone };

        // Check which field matched
        const lowerQ = q.toLowerCase();
        for (const v of kanaVariants) {
            if (p.name.toLowerCase().includes(v.toLowerCase())) {
                addHit(patient, { field: 'name', preview: p.name });
                break;
            }
        }
        for (const v of kanaVariants) {
            if (p.kana.toLowerCase().includes(v.toLowerCase())) {
                addHit(patient, { field: 'kana', preview: p.kana });
                break;
            }
        }
        if (p.phone && p.phone.includes(q)) {
            addHit(patient, { field: 'phone', preview: p.phone });
        }
        if (p.memo && p.memo.toLowerCase().includes(lowerQ)) {
            addHit(patient, { field: 'memo', preview: extractPreview(p.memo) });
        }
    }

    // Process record matches
    for (const r of recordsWithPatient) {
        const patient = {
            id: r.patient.id,
            name: r.patient.name,
            kana: r.patient.kana,
            pId: r.patient.pId,
            phone: r.patient.phone
        };
        const lowerQ = q.toLowerCase();
        const dateStr = r.visitDate.toLocaleDateString('ja-JP');

        // Check which SOAP field matched
        const fields = [
            { name: 'subjective' as const, value: r.subjective },
            { name: 'objective' as const, value: r.objective },
            { name: 'assessment' as const, value: r.assessment },
            { name: 'plan' as const, value: r.plan },
        ];

        for (const f of fields) {
            if (f.value && f.value.toLowerCase().includes(lowerQ)) {
                addHit(patient, {
                    field: 'record',
                    preview: extractPreview(f.value),
                    date: dateStr
                });
                break; // Only one hit per record
            }
        }
    }

    // 4. Convert map to array and limit results
    const results = Array.from(resultMap.values());

    // Sort by number of hits (more hits = more relevant)
    results.sort((a, b) => b.hits.length - a.hits.length);

    return results.slice(0, 20);
}

/**
 * Create a new patient (Simple version for Customer Notebook)
 */
export async function addPatientSimple(data: {
    name: string;
    kana: string;
    phone?: string;
    birthDate?: string;
    memo?: string;
}) {
    if (!data.name || !data.kana) {
        return { success: false, error: '名前とフリガナは必須です' };
    }

    try {
        const newPatient = await createPatient({
            name: data.name,
            kana: data.kana,
            phone: data.phone,
            birthDate: data.birthDate,
            memo: data.memo,
        });

        revalidatePath('/');
        return { success: true, patient: newPatient };
    } catch (error) {
        console.error('Failed to create patient:', error);
        return { success: false, error: '顧客の登録に失敗しました' };
    }
}

/**
 * Add a memo to the timeline (Creates a ClinicalRecord)
 */
export async function addTimelineMemo(patientId: string, content: string, type: 'memo' | 'record' = 'memo', flags: string[] = []) {
    if (!content.trim()) {
        return { success: false, error: 'メモの内容は必須です' };
    }

    try {
        // Fallback staff (For demo purposes without auth)
        let staff = await prisma.staff.findFirst();
        if (!staff) {
            staff = await prisma.staff.create({
                data: { name: 'Demo Staff', role: 'Director' }
            });
        }

        await prisma.clinicalRecord.create({
            data: {
                patientId,
                staffId: staff.id,
                visitDate: new Date(),
                subjective: content, // Use 'subjective' field for simple memo
                metadata: JSON.stringify({ type, flags }) // Include type and flags
            }
        });

        revalidatePath(`/customers/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to add timeline memo:', error);
        return { success: false, error: 'メモの追加に失敗しました' };
    }
}

/**
 * Load more timeline entries (for pagination)
 */
export async function loadMoreTimeline(patientId: string, offset: number, limit: number = 10, query?: string) {
    try {
        const appointmentWhere: { patientId: string; OR?: Array<Record<string, { contains: string }>> } = { patientId };
        const recordWhere: { patientId: string; OR?: Array<Record<string, { contains: string }>> } = { patientId };

        if (query && query.trim()) {
            const q = query.trim();
            appointmentWhere.OR = [
                { memo: { contains: q } },
                { adminMemo: { contains: q } }
                // Note: Appointment status usually not searched by text logic here, but could be added
            ];
            recordWhere.OR = [
                { subjective: { contains: q } },
                { objective: { contains: q } },
                { assessment: { contains: q } },
                { plan: { contains: q } }
            ];
        }

        const [appointments, records] = await Promise.all([
            prisma.appointment.findMany({
                where: appointmentWhere,
                orderBy: { startAt: 'desc' },
            }),
            prisma.clinicalRecord.findMany({
                where: recordWhere,
                orderBy: { visitDate: 'desc' },
                include: { attachments: true }
            })
        ]);

        // Combine and sort
        type TimelineRaw = {
            id: string;
            date: Date;
            type: 'appointment' | 'record' | 'memo' | 'image';
            content: string;
            subContent?: string;
            status?: string;
            flags?: string[];
            images?: string[];
        };

        const timeline: TimelineRaw[] = [
            ...appointments.map(a => ({
                id: a.id,
                date: a.startAt,
                type: 'appointment' as const,
                content: `アポイントメント: ${a.status === 'scheduled' ? '予定' : a.status === 'completed' ? '完了' : a.status === 'cancelled' ? 'キャンセル' : a.status}`,
                subContent: a.memo || undefined,
                status: a.status
            })),
            ...records.map(r => {
                let type: 'record' | 'memo' | 'image' = 'record';
                let flags: string[] = [];
                try {
                    const meta = JSON.parse(r.metadata || '{}');
                    if (meta.type === 'memo') type = 'memo';
                    if (meta.type === 'image') type = 'image';
                    if (Array.isArray(meta.flags)) flags = meta.flags;
                } catch {
                    // ignore
                }
                return {
                    id: r.id,
                    date: r.visitDate,
                    type,
                    content: r.subjective || '記録あり',
                    subContent: type === 'record' ? '施術記録' : undefined,
                    flags,
                    images: r.attachments.map(a => a.storageKey)
                };
            })
        ];

        // Sort by date desc and apply pagination
        const sorted = timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
        const paginated = sorted.slice(offset, offset + limit);
        const hasMore = sorted.length > offset + limit;

        // Serialize dates for client
        const serialized = paginated.map(entry => ({
            ...entry,
            date: entry.date.toISOString()
        }));

        return { success: true, entries: serialized, hasMore, total: sorted.length };
    } catch (error) {
        console.error('Failed to load timeline:', error);
        return { success: false, error: 'タイムラインの読み込みに失敗しました', entries: [], hasMore: false };
    }
}


/**
 * Delete a timeline entry (ClinicalRecord only - appointments cannot be deleted from timeline)
 */
export async function deleteTimelineEntry(entryId: string, entryType: 'memo' | 'record' | 'image', patientId: string) {
    if (!['memo', 'record', 'image'].includes(entryType)) {
        return { success: false, error: 'この種類の記録は削除できません' };
    }

    try {
        if (entryType === 'image') {
            const record = await prisma.clinicalRecord.findUnique({
                where: { id: entryId },
                include: { attachments: true }
            });

            if (record && record.attachments.length > 0) {

                for (const att of record.attachments) {
                    if (att.storageKey.startsWith('/uploads/')) {
                        const fileName = att.storageKey.replace('/uploads/', '');
                        const filePath = join(process.cwd(), 'public', 'uploads', fileName);
                        try {
                            await unlink(filePath);
                        } catch (e) {
                            console.warn('Failed to delete file:', filePath, e);
                        }
                    }
                }
            }
        }

        await prisma.clinicalRecord.delete({
            where: { id: entryId }
        });

        revalidatePath(`/customers/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete timeline entry:', error);
        return { success: false, error: '削除に失敗しました' };
    }
}

/**
 * Update a timeline entry
 */
export async function updateTimelineEntry(entryId: string, entryType: string, content: string, patientId: string, flags?: string[]) {
    if (!content.trim()) {
        return { success: false, error: '内容は必須です' };
    }

    try {
        if (entryType === 'appointment') {
            await prisma.appointment.update({
                where: { id: entryId },
                data: { memo: content }
            });
        } else {
            // For 'memo' and 'record', they are both ClinicalRecord
            // Need to merge new flags into existing metadata
            const record = await prisma.clinicalRecord.findUnique({
                where: { id: entryId },
                select: { metadata: true }
            });

            if (record) {
                const meta = JSON.parse(record.metadata || '{}');
                // Only update flags if they are provided (for backward compatibility if needed, though here we always pass them from edit)
                if (flags) {
                    meta.flags = flags;
                }

                await prisma.clinicalRecord.update({
                    where: { id: entryId },
                    data: {
                        subjective: content,
                        metadata: JSON.stringify(meta)
                    }
                });
            }
        }

        revalidatePath(`/customers/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update timeline entry:', error);
        return { success: false, error: '更新に失敗しました' };
    }
}
