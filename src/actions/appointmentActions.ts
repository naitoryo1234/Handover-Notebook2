'use server';

import { revalidatePath } from 'next/cache';
import { createAppointment, cancelAppointment, updateAppointment } from '@/services/appointmentService';
import { redirect } from 'next/navigation';

export async function scheduleAppointment(formData: FormData) {
    const patientId = formData.get('patientId') as string;
    const dateStr = formData.get('visitDate') as string;
    const timeStr = formData.get('visitTime') as string;
    const memo = formData.get('memo') as string;
    const staffId = formData.get('staffId') as string;
    const operatorId = formData.get('operatorId') as string | null;

    if (!patientId || !dateStr || !timeStr) {
        return { success: false, message: '必須項目が不足しています' };
    }

    const startAt = new Date(`${dateStr}T${timeStr}`);
    const adminMemo = formData.get('adminMemo') as string | undefined;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : 60;

    try {
        await createAppointment(patientId, startAt, memo, staffId || undefined, duration, adminMemo, operatorId || undefined);
        revalidatePath('/');
        revalidatePath(`/patients/${patientId}`);
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '登録に失敗しました' };
    }
}

export async function cancelAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await cancelAppointment(appointmentId);
        revalidatePath('/');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || 'キャンセルに失敗しました' };
    }
}

export async function updateAppointmentAction(formData: FormData) {
    const id = formData.get('id') as string;
    const dateStr = formData.get('visitDate') as string;
    const timeStr = formData.get('visitTime') as string;
    const memo = formData.get('memo') as string;
    const staffId = formData.get('staffId') as string;
    const operatorId = formData.get('operatorId') as string | null;

    if (!id || !dateStr || !timeStr) {
        return { success: false, message: '必須項目が不足しています' };
    }

    const startAt = new Date(`${dateStr}T${timeStr}`);
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;

    const adminMemo = formData.has('adminMemo') ? formData.get('adminMemo') as string : undefined;

    // Checkbox handling:
    // If formData has 'isMemoResolved', use its value.
    // If NOT (e.g. unchecked in standard form), we should check if this is an update that INTENDS to change it?
    // Actually, HTML forms don't send unchecked boxes.
    // But updateAppointmentAction is used by AppointmentEditModal which includes the checkbox.
    // If unchecked, it's missing. We want to set it to false.
    // BUT if we are calling this from a context where we simply didn't include the checkbox (partial update), we might accidentally unset it.
    // For safer updates, we should probably assume "if visitDate/Time is present, and we are editing, we usually send all fields".
    // However, to be safe, let's treat "missing" as "undefined/skip" UNLESS we know it's the Edit form?
    // No, standard HTML behavior is missing = false. The Edit form relies on this.
    // We will assume that if explicit "id" is passed, we are saving the form.
    // "adminMemo" is explicit textarea. If empty, it sends "".

    // Let's rely on explicit "true" string for checked. If missing, it implies false IF we assume full form submission.
    // But to allow partial updates via Action, we must be careful.
    // For now, let's keep previous logic for isMemoResolved but handle adminMemo carefully.

    // Actually, let's check strict presence for safety.
    // If existing code relies on "missing = false", we must keep it OR fix the sender to send "false".
    // AppointmentEditModal uses default HTML, so unchecked = missing.
    // So: const isMemoResolved = formData.get('isMemoResolved') === 'true'; 
    // This resolves to false if missing. This is correct for the Edit Modal.
    const isMemoResolved = formData.get('isMemoResolved') === 'true';

    // Construct updateData with only present fields (or null if explicitly empty/cleared)
    // Use Prisma.AppointmentUpdateInput type? Or just partial object.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { startAt };
    if (duration !== undefined) updateData.duration = duration;
    if (adminMemo !== undefined) updateData.adminMemo = adminMemo;
    updateData.isMemoResolved = isMemoResolved; // This forces false if missing. Accepted for Edit Modal.

    // Track who updated
    if (operatorId) {
        updateData.updatedBy = operatorId;
    }

    if (formData.has('memo')) {
        updateData.memo = formData.get('memo') as string;
    }

    if (staffId === "") {
        updateData.staffId = null; // Unassign
    } else if (staffId) {
        updateData.staffId = staffId; // Assign
    }
    // If staffId is undefined/null (missing from form), we simply don't set it in updateData, preserving current.

    try {
        await updateAppointment(id, updateData);
        revalidatePath('/');
        revalidatePath('/appointments');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '更新に失敗しました' };
    }
}

export async function checkInAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentService').then(s => s.checkInAppointment(appointmentId));
        revalidatePath('/');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || 'チェックインに失敗しました' };
    }
}

export async function cancelCheckInAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentService').then(s => s.cancelCheckIn(appointmentId));
        revalidatePath('/');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || 'チェックイン取り消しに失敗しました' };
    }
}

export async function toggleAdminMemoResolutionAction(
    appointmentId: string,
    isResolved: boolean,
    operatorId?: string // 操作者ID（オプション）
) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        const updateData: Record<string, unknown> = {
            isMemoResolved: isResolved,
        };

        // 操作者追跡: 解決時に誰が解決したかを記録
        if (isResolved) {
            updateData.adminMemoResolvedAt = new Date();
            if (operatorId) {
                updateData.adminMemoResolvedBy = operatorId;
            }
        } else {
            // 解決を取り消す場合はクリア
            updateData.adminMemoResolvedAt = null;
            updateData.adminMemoResolvedBy = null;
        }

        await import('@/services/appointmentService').then(s => s.updateAppointment(appointmentId, updateData));
        revalidatePath('/');
        revalidatePath('/appointments');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '更新に失敗しました' };
    }
}

export async function completeAppointmentAction(appointmentId: string) {
    if (!appointmentId) return { success: false, message: 'IDが不足しています' };
    try {
        await import('@/services/appointmentService').then(s => s.updateAppointment(appointmentId, { status: 'completed' }));
        revalidatePath('/');
        return { success: true };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message || '完了処理に失敗しました' };
    }
}
