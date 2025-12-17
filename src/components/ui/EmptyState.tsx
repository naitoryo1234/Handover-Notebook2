'use client';

import { clsx } from 'clsx';
import { Search, FileX, AlertCircle, Users, Calendar } from 'lucide-react';

type ThemeColor = 'slate' | 'indigo' | 'teal' | 'amber';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    theme?: ThemeColor;
    size?: 'sm' | 'md' | 'lg';
}

const themeStyles: Record<ThemeColor, { bg: string; icon: string; title: string; button: string }> = {
    slate: {
        bg: 'bg-slate-50',
        icon: 'text-slate-400',
        title: 'text-slate-600',
        button: 'bg-slate-600 hover:bg-slate-700 text-white',
    },
    indigo: {
        bg: 'bg-indigo-50/50',
        icon: 'text-indigo-400',
        title: 'text-indigo-700',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    teal: {
        bg: 'bg-teal-50/50',
        icon: 'text-teal-400',
        title: 'text-teal-700',
        button: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
    amber: {
        bg: 'bg-amber-50/50',
        icon: 'text-amber-400',
        title: 'text-amber-700',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
};

const sizeStyles = {
    sm: {
        container: 'py-6 px-4',
        iconWrapper: 'w-10 h-10',
        icon: 'w-5 h-5',
        title: 'text-sm',
        description: 'text-xs',
        button: 'text-xs px-3 py-1.5',
    },
    md: {
        container: 'py-8 px-6',
        iconWrapper: 'w-12 h-12',
        icon: 'w-6 h-6',
        title: 'text-base',
        description: 'text-sm',
        button: 'text-sm px-4 py-2',
    },
    lg: {
        container: 'py-12 px-8',
        iconWrapper: 'w-16 h-16',
        icon: 'w-8 h-8',
        title: 'text-lg',
        description: 'text-base',
        button: 'text-sm px-5 py-2.5',
    },
};

export function EmptyState({
    icon,
    title,
    description,
    action,
    theme = 'slate',
    size = 'md',
}: EmptyStateProps) {
    const colors = themeStyles[theme];
    const sizes = sizeStyles[size];

    return (
        <div className={clsx(
            'flex flex-col items-center justify-center text-center rounded-xl',
            colors.bg,
            sizes.container
        )}>
            <div className={clsx(
                'rounded-full flex items-center justify-center mb-3',
                colors.bg,
                sizes.iconWrapper
            )}>
                {icon ? (
                    <div className={clsx(colors.icon, sizes.icon)}>{icon}</div>
                ) : (
                    <FileX className={clsx(colors.icon, sizes.icon)} />
                )}
            </div>
            <h3 className={clsx('font-medium mb-1', colors.title, sizes.title)}>
                {title}
            </h3>
            {description && (
                <p className={clsx('text-slate-500 max-w-xs', sizes.description)}>
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className={clsx(
                        'mt-4 rounded-lg font-medium transition-colors',
                        colors.button,
                        sizes.button
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Preset variants for common use cases
export function EmptyStateSearch({ theme = 'slate', query }: { theme?: ThemeColor; query?: string }) {
    return (
        <EmptyState
            icon={<Search className="w-full h-full" />}
            title="検索結果がありません"
            description={query ? `「${query}」に一致する結果が見つかりませんでした` : undefined}
            theme={theme}
            size="sm"
        />
    );
}

export function EmptyStateList({
    theme = 'slate',
    title = 'データがありません',
    description,
    action,
}: {
    theme?: ThemeColor;
    title?: string;
    description?: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <EmptyState
            icon={<FileX className="w-full h-full" />}
            title={title}
            description={description}
            action={action}
            theme={theme}
        />
    );
}

export function EmptyStateError({
    theme = 'slate',
    title = 'エラーが発生しました',
    description,
    onRetry,
}: {
    theme?: ThemeColor;
    title?: string;
    description?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={<AlertCircle className="w-full h-full" />}
            title={title}
            description={description}
            action={onRetry ? { label: '再試行', onClick: onRetry } : undefined}
            theme={theme}
        />
    );
}

export function EmptyStateCustomers({ action }: { action?: { label: string; onClick: () => void } }) {
    return (
        <EmptyState
            icon={<Users className="w-full h-full" />}
            title="顧客がいません"
            description="新しい顧客を登録してください"
            action={action}
            theme="indigo"
        />
    );
}

export function EmptyStateReservations({ action }: { action?: { label: string; onClick: () => void } }) {
    return (
        <EmptyState
            icon={<Calendar className="w-full h-full" />}
            title="予約がありません"
            description="本日の予約はありません"
            action={action}
            theme="teal"
        />
    );
}
