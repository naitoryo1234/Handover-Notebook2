'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

import { LABELS } from '@/config/labels';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    variant?: 'danger' | 'primary' | 'warning' | 'error';
    onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = LABELS.DIALOG.DEFAULT_CONFIRM,
    cancelLabel = LABELS.DIALOG.DEFAULT_CANCEL,
    variant = 'primary',
    hideCancel = false,
    onConfirm,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Ensure we only render portal on client
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !loading) {
            onOpenChange(false);
        }
    };

    // Variant-specific configuration
    const config = {
        danger: {
            icon: Trash2,
            headerBg: 'bg-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            iconColor: 'text-red-600',
        },
        error: {
            icon: AlertTriangle,
            headerBg: 'bg-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            iconColor: 'text-red-600',
        },
        warning: {
            icon: AlertTriangle,
            headerBg: 'bg-yellow-600',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
            iconColor: 'text-yellow-600',
        },
        primary: {
            icon: Info,
            headerBg: 'bg-indigo-600',
            buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
            iconColor: 'text-indigo-600',
        },
    }[variant];

    const Icon = config.icon;

    if (!open || !mounted) return null;

    const dialogContent = (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
            style={{ zIndex: 99999, pointerEvents: 'auto' }}
            onClick={handleBackdropClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 relative"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`${config.headerBg} text-white p-4 flex items-center gap-3`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <h3 className="font-bold text-base flex-1 break-words">{title}</h3>
                    {!loading && (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-white/80 hover:text-white transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6">
                    {description && (
                        <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">
                            {description}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3" style={{ pointerEvents: 'auto' }}>
                        {!hideCancel && (
                            <button
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                type="button"
                                style={{ pointerEvents: 'auto' }}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelLabel}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            type="button"
                            style={{ pointerEvents: 'auto' }}
                            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonBg}`}
                        >
                            {loading ? '処理中...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render directly to document.body using portal
    return createPortal(dialogContent, document.body);
}
