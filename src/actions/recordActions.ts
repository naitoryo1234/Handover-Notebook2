'use server';

import { revalidatePath } from 'next/cache';
import { RecordSchema } from '@/config/schema';
import * as recordService from '@/services/recordService';

export async function addRecord(patientId: string, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const operatorId = formData.get('operatorId') as string | null;

    // Transform tags from string "a,b,c" to array for validation if needed, 
    // currently Schema expects array but ConfigForm sends individual inputs. 
    // However, ConfigForm generic implementation sends strings. 
    // For the tag field (text input), we need to split it manually.

    const tagsString = rawData.tags as string;
    const tagsArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];

    const dataToValidate = {
        ...rawData,
        patientId,
        tags: tagsArray,
    };

    const validated = RecordSchema.safeParse(dataToValidate);

    if (!validated.success) {
        console.error(validated.error);
        return { success: false, errors: validated.error.flatten().fieldErrors };
    }

    try {
        await recordService.createRecord(validated.data, patientId, operatorId || undefined);
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Database Error' };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
}

export async function deleteRecord(recordId: string, patientId: string) {
    try {
        await recordService.deleteRecord(recordId);
        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/history`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete record:', error);
        return { success: false, message: 'Failed to delete record' };
    }
}
