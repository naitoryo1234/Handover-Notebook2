'use client';

import { createContext, useContext, ReactNode } from 'react';
import { features as defaultFeatures, type Features } from '@/config/features';
import { CALENDAR_DEFAULTS } from '@/services/systemSettingService';

// カレンダー設定の型
interface CalendarSettings {
    startHour: number;
    endHour: number;
}

interface FeaturesContextType {
    features: Features;
    calendarSettings: CalendarSettings;
}

const FeaturesContext = createContext<FeaturesContextType>({
    features: defaultFeatures,
    calendarSettings: {
        startHour: CALENDAR_DEFAULTS.weekStartHour,
        endHour: CALENDAR_DEFAULTS.weekEndHour,
    },
});

interface FeaturesProviderProps {
    children: ReactNode;
    // We pass overrides from the server (fetched from DB)
    dbSettings: Record<string, unknown>;
}

export const FeaturesProvider = ({ children, dbSettings }: FeaturesProviderProps) => {
    // Merge default features (env vars) with DB settings
    // This allows DB settings to override env vars

    // Deep merge logic specific to our structure
    const mergedFeatures: Features = {
        ...defaultFeatures,
        plugins: {
            ...defaultFeatures.plugins,
            attachments: {
                ...defaultFeatures.plugins.attachments,
                // Check if specific key exists in DB settings, otherwise keep default
                // Key matches SYSTEM_SETTINGS_KEYS.PLUGIN_ATTACHMENTS_ENABLED in service
                enabled: typeof dbSettings['plugins.attachments.enabled'] === 'boolean'
                    ? dbSettings['plugins.attachments.enabled']
                    : defaultFeatures.plugins.attachments.enabled,
            }
        }
    };

    // Calendar settings from DB or defaults
    const calendarSettings: CalendarSettings = {
        startHour: typeof dbSettings['calendar.week.startHour'] === 'number'
            ? dbSettings['calendar.week.startHour']
            : CALENDAR_DEFAULTS.weekStartHour,
        endHour: typeof dbSettings['calendar.week.endHour'] === 'number'
            ? dbSettings['calendar.week.endHour']
            : CALENDAR_DEFAULTS.weekEndHour,
    };

    return (
        <FeaturesContext.Provider value={{ features: mergedFeatures, calendarSettings }}>
            {children}
        </FeaturesContext.Provider>
    );
};

export const useFeatures = () => {
    const context = useContext(FeaturesContext);
    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeaturesProvider');
    }
    return context;

};

