'use client';

import { Phone, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface CustomerSummaryCardProps {
    patient: {
        id: string;
        name: string;
        kana: string;
        phone?: string | null;
        memo?: string | null;
    };
    onViewDetail?: () => void;
    compact?: boolean;
    showMemoPreview?: boolean;
    className?: string;
}

/**
 * CustomerSummaryCard
 * 
 * コンパクトな顧客情報カード。予約詳細やボトムシートからの呼び出し用。
 * 
 * @param patient - 顧客情報
 * @param onViewDetail - 詳細表示時のコールバック（指定時はLinkの代わりにボタンになる）
 * @param compact - さらに小さい表示
 * @param showMemoPreview - メモのプレビューを表示するか
 */
export function CustomerSummaryCard({
    patient,
    onViewDetail,
    compact = false,
    showMemoPreview = true,
    className,
}: CustomerSummaryCardProps) {
    const content = (
        <div className={clsx(
            "bg-white rounded-xl border border-slate-200 transition-all",
            compact ? "p-3" : "p-4",
            onViewDetail ? "hover:border-indigo-300 hover:shadow-sm cursor-pointer" : "",
            className
        )}>
            {/* Header: Name + Kana */}
            <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                    <h3 className={clsx(
                        "font-bold text-slate-800 truncate",
                        compact ? "text-sm" : "text-base"
                    )}>
                        {patient.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{patient.kana}</p>
                </div>
                {onViewDetail && (
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
            </div>

            {/* Phone */}
            {patient.phone && (
                <div className={clsx(
                    "flex items-center gap-2 text-slate-600",
                    compact ? "text-xs mb-2" : "text-sm mb-3"
                )}>
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a
                        href={`tel:${patient.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-indigo-600 transition-colors"
                    >
                        {patient.phone}
                    </a>
                </div>
            )}

            {/* Memo Preview */}
            {showMemoPreview && patient.memo && (
                <div className={clsx(
                    "bg-amber-50/60 border border-amber-100 rounded-lg",
                    compact ? "p-2" : "p-3"
                )}>
                    <div className="flex items-start gap-2">
                        <FileText className={clsx(
                            "text-amber-500 flex-shrink-0 mt-0.5",
                            compact ? "w-3 h-3" : "w-3.5 h-3.5"
                        )} />
                        <p className={clsx(
                            "text-slate-700 line-clamp-2",
                            compact ? "text-xs" : "text-sm"
                        )}>
                            {patient.memo}
                        </p>
                    </div>
                </div>
            )}

            {/* Empty memo state */}
            {showMemoPreview && !patient.memo && (
                <div className={clsx(
                    "border border-dashed border-slate-200 rounded-lg text-center",
                    compact ? "p-2" : "p-3"
                )}>
                    <p className="text-xs text-slate-400">メモなし</p>
                </div>
            )}
        </div>
    );

    // If onViewDetail is provided, wrap in a clickable div
    if (onViewDetail) {
        return (
            <div onClick={onViewDetail} role="button" tabIndex={0}>
                {content}
            </div>
        );
    }

    // Otherwise, wrap in a Link to customer detail page
    return (
        <Link href={`/customers/${patient.id}`} className="block">
            {content}
        </Link>
    );
}

/**
 * CustomerSummaryCardCompact
 * 
 * 超コンパクト版。リスト内のインライン表示用。
 */
export function CustomerSummaryCardInline({
    patient,
    onClick,
}: {
    patient: { id: string; name: string; kana: string; phone?: string | null };
    onClick?: () => void;
}) {
    const Wrapper = onClick ? 'button' : Link;
    const wrapperProps = onClick
        ? { onClick, type: 'button' as const }
        : { href: `/customers/${patient.id}` };

    return (
        // @ts-expect-error - Dynamic component typing
        <Wrapper
            {...wrapperProps}
            className="flex items-center gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors w-full text-left"
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{patient.name}</p>
                <p className="text-xs text-slate-500 truncate">{patient.kana}</p>
            </div>
            {patient.phone && (
                <span className="text-xs text-slate-400 flex-shrink-0">{patient.phone}</span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
        </Wrapper>
    );
}
