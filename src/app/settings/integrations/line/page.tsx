/**
 * LINE Integration Settings Page
 * 
 * オプション機能としてのLINE連携設定画面
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getLineChannel } from '@/features/line/actions/lineActions';
import { LineSettingsForm } from '@/features/line/components/LineSettingsForm';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LineSettingsPage() {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookBaseUrl = `${protocol}://${host}`;

    const existingChannel = await getLineChannel();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-xl font-bold text-slate-800">LINE連携設定</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    {/* Description */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">
                            LINE Messaging API 連携
                        </h2>
                        <p className="text-sm text-slate-600">
                            LINE公式アカウントと連携して、予約リマインドや顧客からのメッセージ受信を行えます。
                        </p>
                    </div>

                    <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-lg" />}>
                        <LineSettingsForm
                            existingChannel={existingChannel}
                            webhookBaseUrl={webhookBaseUrl}
                        />
                    </Suspense>
                </div>

                {/* Help Section */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-medium text-amber-800 mb-2">設定手順</h3>
                    <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside">
                        <li>LINE公式アカウントでMessaging APIを有効化</li>
                        <li>LINE Developers ConsoleからChannel ID/Secret/Access Tokenを取得</li>
                        <li>上記フォームに入力して保存</li>
                        <li>表示されるWebhook URLをLINE Developersに設定</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
