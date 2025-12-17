import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 w-full max-w-none pb-20 pt-1">
            {/* LEFT SIDEBAR: Profile & Pinned Note */}
            <div className="lg:sticky lg:top-0 h-fit max-h-[calc(100vh-120px)] overflow-y-auto space-y-6 pr-2">
                {/* Profile Card Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center">
                    <Skeleton className="h-8 w-32 mb-2" /> {/* Name */}
                    <Skeleton className="h-4 w-20 mb-6" /> {/* Kana */}

                    <div className="flex flex-col gap-2 w-full px-4">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                </div>

                {/* PINNED NOTE Skeleton */}
                <Skeleton className="h-[100px] w-full rounded-xl" />
            </div>

            {/* RIGHT MAIN: Timeline History */}
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 px-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-1 h-6 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-full" />
                </div>

                {/* Timeline List Skeletons */}
                <div className="space-y-8 pl-4 border-l border-slate-100 ml-1 pb-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="relative pl-6">
                            {/* Dot */}
                            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 ring-4 ring-white" />

                            {/* Date */}
                            <Skeleton className="h-4 w-24 mb-2" />

                            {/* Content */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
