/**
 * LINE Webhook API Route
 * 
 * Receives events from LINE Platform and processes them:
 * - Message events: Store and auto-reply
 * - Follow events: Welcome message
 * - etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhook } from '@line/bot-sdk';
import { prisma } from '@/lib/prisma';
import {
    verifyWebhookRequest,
    replyMessage,
    type LineChannelConfig,
} from '@/features/line/lib/line';
import {
    generateAutoReply,
    generateMediaResponse,
} from '@/features/line/services/autoReplyService';

// Webhook event types from LINE
type WebhookEvent = webhook.Event;
type MessageEvent = webhook.MessageEvent;

/**
 * POST /api/line/webhook
 * 
 * Receives webhook events from LINE Platform
 */
export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const body = await request.text();
        const signature = request.headers.get('x-line-signature') || '';

        // Parse body to get destination (channel ID)
        let parsed: { destination?: string; events?: WebhookEvent[] };
        try {
            parsed = JSON.parse(body);
        } catch {
            console.error('[LINE Webhook] Invalid JSON body');
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const channelId = parsed.destination;
        if (!channelId) {
            console.error('[LINE Webhook] Missing destination in webhook');
            return NextResponse.json({ error: 'Missing destination' }, { status: 400 });
        }

        // Verify signature and get channel config
        const channel = await verifyWebhookRequest(body, signature, channelId);
        if (!channel) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Process events asynchronously but respond immediately
        const events = parsed.events || [];

        // Process in background (non-blocking)
        processEvents(events, channel).catch((error) => {
            console.error('[LINE Webhook] Event processing error:', error);
        });

        // Respond immediately to LINE (must be within 1 second)
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LINE Webhook] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * Process webhook events
 */
async function processEvents(events: WebhookEvent[], channel: LineChannelConfig) {
    for (const event of events) {
        try {
            switch (event.type) {
                case 'message':
                    await handleMessageEvent(event as MessageEvent, channel);
                    break;
                case 'follow':
                    await handleFollowEvent(event, channel);
                    break;
                case 'unfollow':
                    console.log(`[LINE] User unfollowed: ${event.source?.userId}`);
                    break;
                default:
                    console.log(`[LINE] Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            console.error(`[LINE] Error processing event ${event.type}:`, error);
        }
    }
}

/**
 * Handle message events
 */
async function handleMessageEvent(event: MessageEvent, channel: LineChannelConfig) {
    const userId = event.source?.userId;
    if (!userId) {
        console.error('[LINE] Message event without userId');
        return;
    }

    const message = event.message;
    let content = '';
    let replyText = '';

    // Extract content based on message type
    switch (message.type) {
        case 'text':
            content = message.text;
            replyText = generateAutoReply(content);
            break;
        case 'sticker':
            content = `[Sticker: ${message.packageId}/${message.stickerId}]`;
            replyText = generateMediaResponse('sticker');
            break;
        case 'image':
            content = '[Image]';
            replyText = generateMediaResponse('image');
            break;
        default:
            content = `[${message.type}]`;
            replyText = generateMediaResponse(message.type);
    }

    // Save incoming message to database
    await prisma.lineMessage.create({
        data: {
            channelId: channel.id,
            lineUserId: userId,
            direction: 'incoming',
            messageType: message.type,
            content,
            rawPayload: JSON.stringify(event),
        },
    });

    // Send auto-reply (free - using replyToken)
    if (event.replyToken) {
        const replied = await replyMessage(
            channel.channelAccessToken,
            event.replyToken,
            replyText
        );

        if (replied) {
            // Save outgoing message
            await prisma.lineMessage.create({
                data: {
                    channelId: channel.id,
                    lineUserId: userId,
                    direction: 'outgoing',
                    messageType: 'text',
                    content: replyText,
                },
            });
        }
    }
}

/**
 * Handle follow events (new friend)
 */
async function handleFollowEvent(event: WebhookEvent, channel: LineChannelConfig) {
    const userId = event.source?.userId;
    if (!userId) return;

    console.log(`[LINE] New follower: ${userId}`);

    // Welcome message
    if ('replyToken' in event && event.replyToken) {
        const welcomeMessage = '🎉 友だち追加ありがとうございます！\n\nこちらからご予約のリマインドやお知らせをお届けします。';

        await replyMessage(
            channel.channelAccessToken,
            event.replyToken,
            welcomeMessage
        );
    }
}
