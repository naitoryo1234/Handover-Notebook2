import { prisma } from '@/lib/prisma';

export const SYSTEM_SETTINGS_KEYS = {
    PLUGIN_ATTACHMENTS_ENABLED: 'plugins.attachments.enabled',
    // カレンダー設定
    CALENDAR_WEEK_START_HOUR: 'calendar.week.startHour',
    CALENDAR_WEEK_END_HOUR: 'calendar.week.endHour',
} as const;

// デフォルト値
export const CALENDAR_DEFAULTS = {
    weekStartHour: 9,
    weekEndHour: 21,
} as const;

export type SystemSettingsKey = typeof SYSTEM_SETTINGS_KEYS[keyof typeof SYSTEM_SETTINGS_KEYS];

/**
 * Get a system setting value by key.
 * Returns null if not found.
 */
export async function getSystemSetting<T>(key: string): Promise<T | null> {
    const setting = await prisma.systemSetting.findUnique({
        where: { key },
    });

    if (!setting) return null;

    try {
        return JSON.parse(setting.value) as T;
    } catch (e) {
        console.error(`Failed to parse system setting for key: ${key}`, e);
        return null;
    }
}

/**
 * Update or create a system setting.
 */
export const updateSystemSetting = async (key: string, value: unknown, description?: string) => {
    return prisma.systemSetting.upsert({
        where: { key },
        update: {
            value: JSON.stringify(value),
            ...(description && { description }),
        },
        create: {
            key,
            value: JSON.stringify(value),
            description,
        },
    });
};

/**
 * Get all settings relevant for app initialization/config.
 * This can be expanded to fetch multiple keys in one go if needed.
 */
export async function getAllSystemSettings(): Promise<Record<string, unknown>> {
    const settings = await prisma.systemSetting.findMany();

    return settings.reduce((acc: Record<string, unknown>, setting: { key: string; value: string }) => {
        try {
            acc[setting.key] = JSON.parse(setting.value);
        } catch {
            acc[setting.key] = setting.value;
        }
        return acc;
    }, {} as Record<string, unknown>);
}
