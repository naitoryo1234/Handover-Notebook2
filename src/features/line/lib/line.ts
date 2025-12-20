/**
 * LINE Integration Module - Core Library
 * 
 * This module provides:
 * - Webhook signature verification
 * - LINE API client initialization
 * - Channel-specific operations (multi-tenant)
 */

import crypto from 'crypto';
import { messagingApi, webhook, HTTPFetchError } from '@line/bot-sdk';
import { prisma } from '@/lib/prisma';

// =====================================================
// Types
// =====================================================

export interface LineChannelConfig {
    id: string;
    channelId: string;
    channelSecret: string;
    channelAccessToken: string;
}

// =====================================================
// Signature Verification (Multi-tenant)
// =====================================================

/**
 * Verify LINE webhook signature using channel-specific secret
 */
export function verifySignature(
    body: string,
    signature: string,
    channelSecret: string
): boolean {
    const hash = crypto
        .createHmac('sha256', channelSecret)
        .update(body)
        .digest('base64');
    return hash === signature;
}

/**
 * Get channel config by Channel ID and verify signature
 */
export async function verifyWebhookRequest(
    body: string,
    signature: string,
    channelId: string
): Promise<LineChannelConfig | null> {
    const channel = await prisma.lineChannel.findUnique({
        where: { channelId, isActive: true },
        select: {
            id: true,
            channelId: true,
            channelSecret: true,
            channelAccessToken: true,
        },
    });

    if (!channel) {
        console.error(`[LINE] Channel not found: ${channelId}`);
        return null;
    }

    if (!verifySignature(body, signature, channel.channelSecret)) {
        console.error(`[LINE] Invalid signature for channel: ${channelId}`);
        return null;
    }

    return channel;
}

// =====================================================
// LINE API Client Factory
// =====================================================

/**
 * Create a Messaging API client for a specific channel
 */
export function createMessagingClient(channelAccessToken: string) {
    return new messagingApi.MessagingApiClient({
        channelAccessToken,
    });
}

// =====================================================
// Message Operations
// =====================================================

/**
 * Send a text message to a user
 */
export async function sendTextMessage(
    accessToken: string,
    userId: string,
    text: string
): Promise<boolean> {
    const client = createMessagingClient(accessToken);

    try {
        await client.pushMessage({
            to: userId,
            messages: [{ type: 'text', text }],
        });
        return true;
    } catch (error) {
        if (error instanceof HTTPFetchError) {
            console.error(`[LINE] Push message failed: ${error.status}`, error.body);
        } else {
            console.error('[LINE] Push message error:', error);
        }
        return false;
    }
}

/**
 * Reply to a webhook event (free, must be within 30 seconds)
 */
export async function replyMessage(
    accessToken: string,
    replyToken: string,
    text: string
): Promise<boolean> {
    const client = createMessagingClient(accessToken);

    try {
        await client.replyMessage({
            replyToken,
            messages: [{ type: 'text', text }],
        });
        return true;
    } catch (error) {
        if (error instanceof HTTPFetchError) {
            console.error(`[LINE] Reply failed: ${error.status}`, error.body);
        } else {
            console.error('[LINE] Reply error:', error);
        }
        return false;
    }
}

// =====================================================
// Channel Management
// =====================================================

/**
 * Get the first active LINE channel (for single-tenant use)
 */
export async function getDefaultChannel(): Promise<LineChannelConfig | null> {
    const channel = await prisma.lineChannel.findFirst({
        where: { isActive: true },
        select: {
            id: true,
            channelId: true,
            channelSecret: true,
            channelAccessToken: true,
        },
    });
    return channel;
}

/**
 * Check if LINE integration is enabled (any active channel exists)
 */
export async function isLineIntegrationEnabled(): Promise<boolean> {
    const count = await prisma.lineChannel.count({
        where: { isActive: true },
    });
    return count > 0;
}
