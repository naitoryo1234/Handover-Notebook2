'use client';

import { useState, useTransition } from 'react';
import { Cpu, Check, Loader2, Sparkles } from 'lucide-react';
import { savePresetSetting } from '@/actions/settingsActions';

interface PresetSelectorProps {
    initialPreset: string;
}

const presets = [
    {
        id: 'default',
        name: 'デフォルト',
        description: '整骨院・鍼灸院向けの汎用プリセット。基本的な施術用語をカバー。',
        color: 'slate',
    },
    {
        id: 'acupuncture',
        name: '鍼灸院',
        description: '経穴名・東洋医学用語を網羅した鍼灸院特化プリセット。内旋/外旋などの誤変換も修正。',
        color: 'emerald',
    },
];

export function PresetSelector({ initialPreset }: PresetSelectorProps) {
    const [selectedPreset, setSelectedPreset] = useState(initialPreset);
    const [isPending, startTransition] = useTransition();
    const [savedMessage, setSavedMessage] = useState(false);

    const handleSelectPreset = (presetId: string) => {
        setSelectedPreset(presetId);
        setSavedMessage(false);

        startTransition(async () => {
            const result = await savePresetSetting(presetId);
            if (result.success) {
                setSavedMessage(true);
                setTimeout(() => setSavedMessage(false), 2000);
            }
        });
    };

    return (
        <div>
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-slate-500" />
                    <h2 className="font-semibold text-slate-800">AIプリセット</h2>
                </div>
                {savedMessage && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-in fade-in">
                        <Check className="w-3 h-3" />
                        保存しました
                    </span>
                )}
            </div>

            {/* 説明 */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
                <p className="text-sm text-slate-600">
                    音声入力のテキスト整形に使用するプリセットを選択してください。
                    業態に特化したプリセットを選ぶことで、専門用語の誤変換が減少します。
                </p>
            </div>

            {/* プリセット一覧 */}
            <div className="p-4 space-y-3">
                {presets.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    const colorClass = preset.color === 'emerald'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50';
                    const selectedColorClass = preset.color === 'emerald'
                        ? 'ring-emerald-500'
                        : 'ring-indigo-500';

                    return (
                        <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset.id)}
                            disabled={isPending}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                    ? `${colorClass} ring-2 ${selectedColorClass}`
                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${preset.color === 'emerald'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{preset.name}</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">{preset.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {isPending && selectedPreset === preset.id ? (
                                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                    ) : isSelected ? (
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${preset.color === 'emerald'
                                                ? 'bg-emerald-500'
                                                : 'bg-indigo-500'
                                            }`}>
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* 将来機能の予告 */}
            <div className="p-4 border-t border-slate-100">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-700">
                        <strong>Coming Soon:</strong> カスタム用語の登録機能を追加予定です。
                        よく使う専門用語を登録することで、さらに精度が向上します。
                    </p>
                </div>
            </div>
        </div>
    );
}
