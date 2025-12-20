'use client';

import { X } from 'lucide-react';
import { ViewMode } from '@/app/reservation-v2/ReservationV2Client';
import { TimeRange } from '@/actions/voiceCommandActions';

interface Staff {
    id: string;
    name: string;
}

interface SearchStatusBarProps {
    searchQuery: string;
    selectedStaffId: string;
    staffList: Staff[];
    viewMode: ViewMode;
    showUnassignedOnly: boolean;
    showUnresolvedOnly: boolean;
    timeRange?: TimeRange | 'all';
    afterHour?: number | null;
    aroundHour?: number | null;
    resultCount: number;
    onClear: () => void;
    onRemoveFilter: (type: 'query' | 'staff' | 'unassigned' | 'unresolved' | 'period' | 'timeRange' | 'afterHour' | 'aroundHour') => void;
}

export function SearchStatusBar({
    searchQuery,
    selectedStaffId,
    staffList,
    viewMode,
    showUnassignedOnly,
    showUnresolvedOnly,
    timeRange,
    afterHour,
    aroundHour,
    resultCount,
    onClear,
    onRemoveFilter
}: SearchStatusBarProps) {
    const getStaffName = (id: string) => {
        const staff = staffList.find(s => s.id === id);
        return staff?.name || id;
    };

    const getTimeRangeLabel = (range: TimeRange): string => {
        const labels: Record<TimeRange, string> = {
            morning: '午前 (0:00-12:00)',
            afternoon: '午後 (12:00-17:00)',
            evening: '夕方 (17:00-20:00)',
            night: '夜 (20:00-24:00)'
        };
        return labels[range];
    };

    return (
        <div className="bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between transition-all px-3 py-1.5 md:px-6 md:py-3 cursor-default select-none touch-none">
            {/* Left Content: Labels & Chips */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 overflow-hidden">
                {/* Desktop Label */}
                <span className="hidden md:inline text-sm font-medium text-emerald-800 shrink-0">
                    🔍 検索条件:
                </span>
                {/* Mobile Label (Mini) */}
                <span className="md:hidden text-[10px] font-bold text-emerald-700 shrink-0">
                    条件:
                </span>

                {/* Chips Container */}
                <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar mask-linear-fade pr-2">
                    {viewMode === 'all' && (
                        <button
                            onClick={() => onRemoveFilter('period')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-white text-emerald-700 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-emerald-200 whitespace-nowrap hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
                        >
                            <span>📅 <span className="hidden md:inline">全期間</span><span className="md:hidden">全期間</span></span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                    )}
                    {searchQuery && (
                        <button
                            onClick={() => onRemoveFilter('query')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-white text-emerald-700 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-emerald-200 whitespace-nowrap max-w-[120px] hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
                        >
                            <span className="truncate">🔤 &quot;{searchQuery}&quot;</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                        </button>
                    )}
                    {selectedStaffId !== 'all' && (
                        <button
                            onClick={() => onRemoveFilter('staff')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-white text-emerald-700 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-emerald-200 whitespace-nowrap hover:bg-emerald-50 active:bg-emerald-100 transition-colors group"
                        >
                            <span>👤 {getStaffName(selectedStaffId)}</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                    )}
                    {showUnassignedOnly && (
                        <button
                            onClick={() => onRemoveFilter('unassigned')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-amber-100 text-amber-800 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-amber-200 whitespace-nowrap hover:bg-amber-100/80 active:bg-amber-200 transition-colors group"
                        >
                            <span>未定のみ</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 group-hover:text-amber-700 transition-colors" />
                        </button>
                    )}
                    {showUnresolvedOnly && (
                        <button
                            onClick={() => onRemoveFilter('unresolved')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-red-100 text-red-800 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-red-200 whitespace-nowrap hover:bg-red-100/80 active:bg-red-200 transition-colors group"
                        >
                            <span>申し送り</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500 group-hover:text-red-700 transition-colors" />
                        </button>
                    )}
                    {/* 時間帯フィルター */}
                    {timeRange && timeRange !== 'all' && (
                        <button
                            onClick={() => onRemoveFilter('timeRange')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-100 text-blue-800 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-blue-200 whitespace-nowrap hover:bg-blue-100/80 active:bg-blue-200 transition-colors group"
                        >
                            <span>🕐 {getTimeRangeLabel(timeRange)}</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                        </button>
                    )}
                    {/* 〇時以降フィルター */}
                    {afterHour !== null && afterHour !== undefined && (
                        <button
                            onClick={() => onRemoveFilter('afterHour')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-100 text-blue-800 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-blue-200 whitespace-nowrap hover:bg-blue-100/80 active:bg-blue-200 transition-colors group"
                        >
                            <span>🕐 {afterHour}時以降</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                        </button>
                    )}
                    {/* 〇時周辺フィルター */}
                    {aroundHour !== null && aroundHour !== undefined && (
                        <button
                            onClick={() => onRemoveFilter('aroundHour')}
                            className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-blue-100 text-blue-800 text-[10px] md:text-xs font-medium rounded md:rounded-md border border-blue-200 whitespace-nowrap hover:bg-blue-100/80 active:bg-blue-200 transition-colors group"
                        >
                            <span>🕐 {aroundHour}時周辺 ({aroundHour - 1}:00-{aroundHour + 1}:59)</span>
                            <X className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                        </button>
                    )}
                </div>
            </div>

            {/* Right Actions: Result Count & Clear */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-2 md:pl-0 h-full">
                <span className="hidden md:inline text-sm text-emerald-700">
                    📊 結果: <span className="font-bold">{resultCount}</span>件
                </span>

                <button
                    onClick={onClear}
                    className="text-[10px] md:text-sm text-slate-500 md:text-emerald-600 bg-white md:bg-transparent border border-slate-200 md:border-none px-2 py-0.5 md:px-0 rounded-full md:rounded-none hover:text-emerald-800 hover:underline font-medium whitespace-nowrap transition-colors active:bg-slate-100"
                >
                    <span className="md:hidden">クリア</span>
                    <span className="hidden md:inline">条件をクリア</span>
                </button>
            </div>
        </div>
    );
}
