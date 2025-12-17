'use server';

import { SYSTEM_SETTINGS_KEYS, updateSystemSetting } from '@/services/systemSettingService';
import { revalidatePath } from 'next/cache';

export async function toggleAttachmentPluginAction(enabled: boolean) {
    try {
        await updateSystemSetting(
            SYSTEM_SETTINGS_KEYS.PLUGIN_ATTACHMENTS_ENABLED,
            enabled,
            'Enable/Disable Image Attachment Plugin'
        );
        revalidatePath('/'); // Revalidate everywhere as this affects global layout
        return { success: true };
    } catch (error) {
        console.error('Failed to toggle attachment plugin:', error);
        return { success: false, error: 'Failed to update setting' };
    }
}

export async function updateCalendarBusinessHoursAction(startHour: number, endHour: number) {
    try {
        // Validate
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            return { success: false, error: '時刻は0〜23の範囲で指定してください' };
        }
        if (startHour >= endHour) {
            return { success: false, error: '終了時刻は開始時刻より後にしてください' };
        }

        await updateSystemSetting(
            SYSTEM_SETTINGS_KEYS.CALENDAR_WEEK_START_HOUR,
            startHour,
            '週表示カレンダーの開始時刻'
        );
        await updateSystemSetting(
            SYSTEM_SETTINGS_KEYS.CALENDAR_WEEK_END_HOUR,
            endHour,
            '週表示カレンダーの終了時刻'
        );
        revalidatePath('/appointments');
        return { success: true };
    } catch (error) {
        console.error('Failed to update calendar business hours:', error);
        return { success: false, error: 'Failed to update setting' };
    }
}
