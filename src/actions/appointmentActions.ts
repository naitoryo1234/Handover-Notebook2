'use server';

import { revalidatePath } from 'next/cache';
import { createAppointment, cancelAppointment, updateAppointment } from '@/services/appointmentServiceV2';
import { AppointmentSchema } from '@/config/schema';
import { z } from 'zod';

// 予約更新用スキーマ（IDが必須）
const AppointmentUpdateSchema = AppointmentSchema.extend({
    id: z.string().min(1, '予約IDが必要です'),
});

export async function scheduleAppointment(formData: FormData) {
    const rawData = {
        patientId: formData.get('patientId') as string,
        visitDate: formData.get('visitDate') as string,
        visitTime: formData.get('visitTime') as string,
        duration: formData.get('duration'),
        staffId: formData.get('staffId') as string,
        memo: formData.get('memo') as string,
        adminMemo: formData.get('adminMemo') as string,
        operatorId: formData.get('operatorId') as string,
    };

    // Zodバリデーション
    const validated = AppointmentSchema.safeParse(rawData);
    if (!validated.success) {
        const errors = validated.error.flatten().fieldErrors;
        // フィールドエラーがあれば最初のエラーをメッセージとして返す
        const firstError = Object.values(errors).flat()[0] || 'バリデーションエラー';
        return { success: false, message: firstError, errors };
    }

    const { patientId, visitDate, visitTime, duration, staffId, memo, adminMemo, operatorId } = validated.data;
    const startAt = new Date(`${visitDate}T${visitTime}`);

    try {
        await createAppointment(patientId, startAt, memo || '', staffId || undefined, duration, adminMemo || undefined, operatorId || undefined);
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        revalidatePath('/reservation-v2');
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '登録に失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function cancelAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await cancelAppointment(appointmentId);
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        revalidatePath('/reservation-v2');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'キャンセルに失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function updateAppointmentAction(formData: FormData) {
    const rawData = {
        id: formData.get('id') as string,
        patientId: formData.get('patientId') as string || 'placeholder', // 更新時はpatientIdは変更しないのでプレースホルダー
        visitDate: formData.get('visitDate') as string,
        visitTime: formData.get('visitTime') as string,
        duration: formData.get('duration'),
        staffId: formData.get('staffId') as string,
        memo: formData.get('memo') as string,
        adminMemo: formData.get('adminMemo') as string,
        operatorId: formData.get('operatorId') as string,
    };

    // 更新用スキーマで検証
    const validated = AppointmentUpdateSchema.safeParse(rawData);
    if (!validated.success) {
        const errors = validated.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0] || 'バリデーションエラー';
        return { success: false, message: firstError, errors };
    }

    const { id, visitDate, visitTime, duration, staffId, memo, adminMemo, operatorId } = validated.data;
    const startAt = new Date(`${visitDate}T${visitTime}`);

    const isMemoResolved = formData.get('isMemoResolved') === 'true';

    // 更新データを構築
    const updateData: Record<string, unknown> = { startAt, isMemoResolved };
    if (duration !== undefined) updateData.duration = duration;
    if (adminMemo !== undefined) updateData.adminMemo = adminMemo;
    if (operatorId) updateData.updatedBy = operatorId;
    if (formData.has('memo')) updateData.memo = memo;

    if (staffId === "") {
        updateData.staffId = null; // 担当者解除
    } else if (staffId) {
        updateData.staffId = staffId;
    }

    try {
        await updateAppointment(id, updateData);
        revalidatePath('/');
        revalidatePath('/appointments');
        revalidatePath('/reservation-notebook');
        revalidatePath('/reservation-v2');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '更新に失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function checkInAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentServiceV2').then(s => s.checkInAppointment(appointmentId));
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'チェックインに失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function cancelCheckInAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentServiceV2').then(s => s.cancelCheckIn(appointmentId));
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'チェックイン取り消しに失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function toggleAdminMemoResolutionAction(
    appointmentId: string,
    isResolved: boolean,
    operatorId?: string
) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        const updateData: Record<string, unknown> = {
            isMemoResolved: isResolved,
        };

        if (isResolved) {
            updateData.adminMemoResolvedAt = new Date();
            if (operatorId) {
                updateData.adminMemoResolvedBy = operatorId;
            }
        } else {
            updateData.adminMemoResolvedAt = null;
            updateData.adminMemoResolvedBy = null;
        }

        await import('@/services/appointmentServiceV2').then(s => s.updateAppointment(appointmentId, updateData));
        revalidatePath('/');
        revalidatePath('/appointments');
        revalidatePath('/reservation-notebook');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '更新に失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function completeAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentServiceV2').then(s => s.updateAppointment(appointmentId, { status: 'completed' }));
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '完了処理に失敗しました';
        console.error(e);
        return { success: false, message };
    }
}

export async function undoAppointmentStatusAction(appointmentId: string, previousStatus: string) {
    if (!appointmentId || !previousStatus) return { success: false, message: 'パラメータが不足しています' };
    try {
        await import('@/services/appointmentServiceV2').then(s => s.updateAppointment(appointmentId, { status: previousStatus }));
        revalidatePath('/');
        revalidatePath('/reservation-notebook');
        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'ステータス復元に失敗しました';
        console.error(e);
        return { success: false, message };
    }
}
