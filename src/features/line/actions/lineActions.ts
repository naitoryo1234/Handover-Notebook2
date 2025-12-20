'use server';

/**
 * LINE Integration Server Actions
 * 
 * Provides server-side operations for LINE settings management
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// =====================================================
// Channel Management
// =====================================================

/**
 * Create or update LINE channel configuration
 */
export async function saveLineChannel(data: {
    name: string;
    channelId: string;
    channelSecret: string;
    channelAccessToken: string;
}): Promise<{ success: boolean; error?: string; channelDbId?: string }> {
    try {
        // Check if channel already exists
        const existing = await prisma.lineChannel.findUnique({
            where: { channelId: data.channelId },
        });

        if (existing) {
            // Update existing
            await prisma.lineChannel.update({
                where: { channelId: data.channelId },
                data: {
                    name: data.name,
                    channelSecret: data.channelSecret,
                    channelAccessToken: data.channelAccessToken,
                    isActive: true,
                },
            });
            revalidatePath('/settings/integrations/line');
            return { success: true, channelDbId: existing.id };
        }

        // Create new
        const channel = await prisma.lineChannel.create({
            data: {
                name: data.name,
                channelId: data.channelId,
                channelSecret: data.channelSecret,
                channelAccessToken: data.channelAccessToken,
            },
        });

        revalidatePath('/settings/integrations/line');
        return { success: true, channelDbId: channel.id };
    } catch (error) {
        console.error('[LINE] Save channel error:', error);
        return { success: false, error: 'チャンネル設定の保存に失敗しました' };
    }
}

/**
 * Get current LINE channel configuration
 */
export async function getLineChannel() {
    const channel = await prisma.lineChannel.findFirst({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            channelId: true,
            webhookUrl: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return channel;
}

/**
 * Disable LINE integration
 */
export async function disableLineChannel(channelId: string): Promise<{ success: boolean }> {
    try {
        await prisma.lineChannel.update({
            where: { channelId },
            data: { isActive: false },
        });
        revalidatePath('/settings/integrations/line');
        return { success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Update webhook URL after setup
 */
export async function updateWebhookUrl(
    channelDbId: string,
    webhookUrl: string
): Promise<{ success: boolean }> {
    try {
        await prisma.lineChannel.update({
            where: { id: channelDbId },
            data: { webhookUrl },
        });
        return { success: true };
    } catch {
        return { success: false };
    }
}

// =====================================================
// Message Operations
// =====================================================

/**
 * Get recent LINE messages for a channel
 */
export async function getRecentMessages(channelId: string, limit = 50) {
    const messages = await prisma.lineMessage.findMany({
        where: { channelId },
        orderBy: { sentAt: 'desc' },
        take: limit,
    });
    return messages;
}

/**
 * Get message count statistics
 */
export async function getMessageStats(channelId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [incoming, outgoing, thisMonth] = await Promise.all([
        prisma.lineMessage.count({
            where: { channelId, direction: 'incoming' },
        }),
        prisma.lineMessage.count({
            where: { channelId, direction: 'outgoing' },
        }),
        prisma.lineMessage.count({
            where: {
                channelId,
                direction: 'outgoing',
                sentAt: { gte: startOfMonth },
            },
        }),
    ]);

    return { incoming, outgoing, thisMonthOutgoing: thisMonth };
}
