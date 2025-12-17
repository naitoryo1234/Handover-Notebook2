'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Upload an attachment to a clinical record
 */
export async function uploadAttachmentAction(formData: FormData) {
    const recordId = formData.get('recordId') as string;
    const patientId = formData.get('patientId') as string;
    const file = formData.get('file') as File;

    if (!recordId || !patientId || !file) {
        return { success: false, message: '必須項目が不足しています' };
    }

    try {
        // Generate storage key (year/month/uuid.ext)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const ext = file.name.split('.').pop() || 'jpg';
        const uuid = crypto.randomUUID();
        const storageKey = `attachments/${year}/${month}/${uuid}.${ext}`;

        // Save file to public directory (for demo - production should use cloud storage)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create directory if not exists
        const fs = await import('fs/promises');
        const path = await import('path');
        const dir = path.join(process.cwd(), 'public', 'attachments', String(year), month);
        await fs.mkdir(dir, { recursive: true });

        // Write file
        const filePath = path.join(dir, `${uuid}.${ext}`);
        await fs.writeFile(filePath, buffer);

        // Create DB record
        const attachment = await prisma.attachment.create({
            data: {
                patientId,
                recordId,
                fileType: file.type,
                storageKey,
            },
        });

        revalidatePath(`/patients/${patientId}`);

        return { success: true, attachment };
    } catch (error) {
        console.error('Attachment upload error:', error);
        return { success: false, message: 'アップロードに失敗しました' };
    }
}

/**
 * Delete an attachment
 */
export async function deleteAttachmentAction(attachmentId: string, patientId: string) {
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment) {
            return { success: false, message: '添付ファイルが見つかりません' };
        }

        // Delete file from storage
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', attachment.storageKey);

        try {
            await fs.unlink(filePath);
        } catch {
            // File may not exist, continue with DB deletion
        }

        // Delete DB record
        await prisma.attachment.delete({
            where: { id: attachmentId },
        });

        revalidatePath(`/patients/${patientId}`);

        return { success: true };
    } catch (error) {
        console.error('Attachment delete error:', error);
        return { success: false, message: '削除に失敗しました' };
    }
}

/**
 * Get attachments for a record
 */
export async function getAttachmentsForRecord(recordId: string) {
    return prisma.attachment.findMany({
        where: { recordId },
        orderBy: { createdAt: 'desc' },
    });
}
