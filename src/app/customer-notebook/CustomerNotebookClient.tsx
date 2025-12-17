'use client';

import { useState } from 'react';
import { Patient } from '@prisma/client';
import { updatePatientMemo } from '@/actions/patientActions';
import { Save, Edit3, X, FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomerNotebookClientProps {
    patient: Patient;
}

export function CustomerNotebookClient({ patient }: CustomerNotebookClientProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [memo, setMemo] = useState(patient.memo || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const result = await updatePatientMemo(patient.id, memo);
            if (result.success) {
                setMessage({ type: 'success', text: '保存しました' });
                setIsEditing(false);
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || '保存に失敗しました' });
            }
        } catch {
            setMessage({ type: 'error', text: '保存中にエラーが発生しました' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setMemo(patient.memo || '');
        setIsEditing(false);
        setMessage(null);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/customer-notebook')}
                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
                        <p className="text-sm text-slate-500">{patient.kana}</p>
                    </div>
                </div>
                {!isEditing ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/customers/${patient.id}`)}
                            className="text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                            title="詳細ページへ移動"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium hidden sm:inline">詳細を表示</span>
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span className="text-sm font-medium">編集</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? '保存中...' : '保存'}
                        </button>
                    </div>
                )}
            </div>

            {/* メッセージ */}
            {message && (
                <div
                    className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Pinned Note */}
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Pinned Note</span>
                </div>

                {isEditing ? (
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={10}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="この顧客に関するメモを入力してください..."
                        autoFocus
                    />
                ) : (
                    <div className="min-h-[200px] bg-slate-50 rounded-xl p-4">
                        {patient.memo ? (
                            <p className="text-slate-700 whitespace-pre-wrap">{patient.memo}</p>
                        ) : (
                            <p className="text-slate-400 italic">メモはまだありません</p>
                        )}
                    </div>
                )}
            </div>

            {/* 顧客情報 */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {patient.phone && (
                        <div>
                            <span className="text-slate-500">電話番号:</span>
                            <span className="ml-2 text-slate-700">{patient.phone}</span>
                        </div>
                    )}
                    {patient.birthDate && (
                        <div>
                            <span className="text-slate-500">生年月日:</span>
                            <span className="ml-2 text-slate-700">
                                {new Date(patient.birthDate).toLocaleDateString('ja-JP')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
