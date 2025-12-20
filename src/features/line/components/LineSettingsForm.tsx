'use client';

/**
 * LINE Settings Form Component
 * 
 * API認証情報を入力・保存するフォーム
 */

import { useState, useTransition } from 'react';
import { saveLineChannel } from '@/features/line/actions/lineActions';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface LineSettingsFormProps {
    existingChannel?: {
        id: string;
        name: string;
        channelId: string;
        webhookUrl: string | null;
    } | null;
    webhookBaseUrl: string;
}

export function LineSettingsForm({ existingChannel, webhookBaseUrl }: LineSettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const [formData, setFormData] = useState({
        name: existingChannel?.name || '',
        channelId: existingChannel?.channelId || '',
        channelSecret: '',
        channelAccessToken: '',
    });

    const webhookUrl = `${webhookBaseUrl}/api/line/webhook`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.channelId || !formData.channelSecret || !formData.channelAccessToken) {
            setResult({ success: false, message: 'すべての項目を入力してください' });
            return;
        }

        startTransition(async () => {
            const response = await saveLineChannel(formData);
            if (response.success) {
                setResult({ success: true, message: 'LINE連携設定を保存しました' });
                // Clear sensitive fields
                setFormData(prev => ({ ...prev, channelSecret: '', channelAccessToken: '' }));
            } else {
                setResult({ success: false, message: response.error || '保存に失敗しました' });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            {existingChannel && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-emerald-800">LINE連携済み</p>
                        <p className="text-sm text-emerald-600 mt-1">
                            チャンネル: {existingChannel.name}
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        表示名
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="例: 〇〇院 予約通知"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                </div>

                {/* Channel ID */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Channel ID
                    </label>
                    <input
                        type="text"
                        value={formData.channelId}
                        onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                        placeholder="LINE DevelopersからコピーしたChannel ID"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                    />
                </div>

                {/* Channel Secret */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Channel Secret
                    </label>
                    <div className="relative">
                        <input
                            type={showSecret ? 'text' : 'password'}
                            value={formData.channelSecret}
                            onChange={(e) => setFormData({ ...formData, channelSecret: e.target.value })}
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Channel Access Token */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Channel Access Token
                    </label>
                    <div className="relative">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={formData.channelAccessToken}
                            onChange={(e) => setFormData({ ...formData, channelAccessToken: e.target.value })}
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Webhook URL Display */}
                <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Webhook URL（LINE Developersに設定）
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white px-3 py-2 rounded border border-slate-200 text-sm text-slate-600 break-all">
                            {webhookUrl}
                        </code>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(webhookUrl)}
                            className="px-3 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                        >
                            コピー
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        LINE Developers Console → Messaging API設定 → Webhook URL に上記URLを設定してください
                    </p>
                </div>

                {/* Result Message */}
                {result && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-red-50 text-red-800'
                        }`}>
                        {result.success ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{result.message}</span>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        '設定を保存'
                    )}
                </Button>
            </form>

            {/* Help Link */}
            <div className="text-center">
                <a
                    href="https://developers.line.biz/console/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    LINE Developers Console を開く
                </a>
            </div>
        </div>
    );
}
