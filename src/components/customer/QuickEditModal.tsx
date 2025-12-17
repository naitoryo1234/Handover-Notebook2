'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: {
        id: string;
        name: string;
        kana: string;
        phone?: string | null;
    };
    onSave: (data: { name: string; kana: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
}

/**
 * QuickEditModal
 * 
 * モバイル向けの簡易顧客編集モーダル。
 * 必須フィールド（名前、カナ、電話番号）のみを編集可能。
 */
export function QuickEditModal({
    isOpen,
    onClose,
    patient,
    onSave,
}: QuickEditModalProps) {
    const [name, setName] = useState(patient.name);
    const [kana, setKana] = useState(patient.kana);
    const [phone, setPhone] = useState(patient.phone || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; kana?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; kana?: string } = {};
        if (!name.trim()) newErrors.name = '名前は必須です';
        if (!kana.trim()) newErrors.kana = 'フリガナは必須です';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const result = await onSave({ name: name.trim(), kana: kana.trim(), phone: phone.trim() });
            if (result.success) {
                toast.success('顧客情報を更新しました');
                onClose();
            } else {
                toast.error(result.error || '更新に失敗しました');
            }
        } catch (error) {
            console.error(error);
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        // Reset form to original values
        setName(patient.name);
        setKana(patient.kana);
        setPhone(patient.phone || '');
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                        顧客情報を編集
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            お名前 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                }`}
                            placeholder="山田 太郎"
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Kana */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            フリガナ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={kana}
                            onChange={(e) => setKana(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.kana ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                }`}
                            placeholder="ヤマダ タロウ"
                        />
                        {errors.kana && (
                            <p className="text-xs text-red-500 mt-1">{errors.kana}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            電話番号
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                            placeholder="090-1234-5678"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
