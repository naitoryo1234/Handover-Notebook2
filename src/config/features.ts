/**
 * Feature Flags and Configuration
 * 
 * This file controls which features are enabled/disabled in the application.
 * Features can be toggled via environment variables for different deployment scenarios.
 */

// Helper to safely parse boolean from environment variable
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
};

export const features = {
    /**
     * Authentication Configuration
     * 
     * AUTH_ENABLED=false (default): No authentication, anyone can access
     * AUTH_ENABLED=true + AUTH_MODE=pin: Simple PIN authentication with operator selection
     */
    auth: {
        enabled: parseBoolean(process.env.AUTH_ENABLED, false),
        mode: (process.env.AUTH_MODE || 'pin') as 'pin' | 'password' | 'oauth',
        pin: process.env.AUTH_PIN || '0000',
    },

    /**
     * Operator Tracking Configuration
     * 
     * Records who created/updated records for audit purposes.
     * This is always enabled when auth is enabled.
     */
    logging: {
        operatorTracking: true,  // createdBy/updatedBy tracking
        auditLog: false,         // Full audit log (future feature)
    },

    /**
     * Plugin Configuration
     * 
     * Optional features that can be enabled per-deployment.
     * Each plugin should be self-contained in src/plugins/<name>/
     */
    plugins: {
        /**
         * Record Attachments (Images)
         * Allows adding images to existing records.
         * ATTACHMENTS_ENABLED=true to enable
         */
        attachments: {
            enabled: parseBoolean(process.env.NEXT_PUBLIC_ATTACHMENTS_ENABLED, false),
            maxFileSizeMB: parseInt(process.env.NEXT_PUBLIC_ATTACHMENTS_MAX_SIZE_MB || '5', 10),
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
    },
} as const;

// Type exports for use in other files
export type AuthMode = typeof features.auth.mode;
export type Features = typeof features;
