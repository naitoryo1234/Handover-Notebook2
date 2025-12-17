import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-100", className)}
            {...props}
        />
    )
}

// Preset: Text line skeleton
function SkeletonText({ className, width = 'full' }: { className?: string; width?: 'full' | '3/4' | '1/2' | '1/4' }) {
    const widthClass = {
        'full': 'w-full',
        '3/4': 'w-3/4',
        '1/2': 'w-1/2',
        '1/4': 'w-1/4',
    }[width];

    return <Skeleton className={cn("h-4", widthClass, className)} />;
}

// Preset: Card skeleton
function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("bg-white rounded-xl border border-slate-200 p-4 space-y-3", className)}>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    );
}

// Preset: List item skeleton
function SkeletonListItem({ className, hasAvatar = false }: { className?: string; hasAvatar?: boolean }) {
    return (
        <div className={cn("flex items-center gap-3 p-3", className)}>
            {hasAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

// Preset: List skeleton (multiple items)
function SkeletonList({
    count = 3,
    hasAvatar = false,
    className
}: {
    count?: number;
    hasAvatar?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("divide-y divide-slate-100", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonListItem key={i} hasAvatar={hasAvatar} />
            ))}
        </div>
    );
}

// Preset: Customer list item skeleton (matches CustomerNotebook list)
function SkeletonCustomerListItem({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-between px-4 py-3", className)}>
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
    );
}

// Preset: Timeline item skeleton
function SkeletonTimelineItem({ className }: { className?: string }) {
    return (
        <div className={cn("flex gap-3 p-4", className)}>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}

export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonListItem,
    SkeletonList,
    SkeletonCustomerListItem,
    SkeletonTimelineItem,
}

