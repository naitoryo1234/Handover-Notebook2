'use server'

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function uploadImage(formData: FormData) {
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;

    if (!file || !patientId) return { success: false, error: 'ファイルまたは顧客IDが無効です' };

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads dir if not exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique name
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = join(uploadDir, fileName);

        // Write file
        await writeFile(filePath, buffer);

        // Get default staff
        const staff = await prisma.staff.findFirst();
        if (!staff) {
            // Should verify staff exists in real app
            // return { success: false, error: 'スタッフが見つかりません' };
        }

        // Create ClinicalRecord wrapper for the image
        // We treat standalone image upload as a 'record' with type 'image' in metadata
        await prisma.clinicalRecord.create({
            data: {
                patientId,
                staffId: staff?.id || 'unknown', // Ideally should be current user
                visitDate: new Date(),
                subjective: '画像添付',
                metadata: JSON.stringify({ type: 'image', flags: [] }),
                attachments: {
                    create: {
                        patientId,
                        fileType: file.type,
                        storageKey: `/uploads/${fileName}`
                    }
                }
            }
        });

        revalidatePath(`/customers/${patientId}`);
        return { success: true };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'アップロードに失敗しました' };
    }
}
