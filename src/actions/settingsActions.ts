'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { setCurrentPreset, PresetType } from '@/lib/presets';

/**
 * プリセット設定を保存
 */
export async function savePresetSetting(preset: string) {
    try {
        // DBに保存
        await prisma.systemSetting.upsert({
            where: { key: 'voice_preset' },
            update: { value: preset },
            create: {
                key: 'voice_preset',
                value: preset,
                description: '音声テキスト整形に使用するプリセット'
            }
        });

        // メモリ上のプリセットも更新
        setCurrentPreset(preset as PresetType);

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to save preset setting:', error);
        return { success: false, error: 'Database Error' };
    }
}

/**
 * システム設定を取得
 */
export async function getSystemSetting(key: string) {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key }
        });
        return setting?.value || null;
    } catch (error) {
        console.error('Failed to get system setting:', error);
        return null;
    }
}

/**
 * システム設定を保存
 */
export async function setSystemSetting(key: string, value: string, description?: string) {
    try {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value, description }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to set system setting:', error);
        return { success: false, error: 'Database Error' };
    }
}
