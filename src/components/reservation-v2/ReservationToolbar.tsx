'use client';

import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Search, ChevronLeft, ChevronRight, Plus, AlertCircle, UserX, X } from 'lucide-react';

interface Staff {
    id: string;
    name: string;
}

interface Stats {
    total: number;
    unassigned: number;
    unresolvedMemos: number;
}

interface ReservationToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedStaffId: string;
    onStaffChange: (value: string) => void;
    staffList: Staff[];
    viewMode: 'daily' | 'all';
    onViewModeChange: (mode: 'today' | 'tomorrow' | 'all') => void;
    includePast: boolean;
    onIncludePastChange: (value: boolean) => void;
    currentDate: string;
    onDateChange: (direction: 'prev' | 'next') => void;
    stats: Stats;
    showUnassignedOnly: boolean;
    onUnassignedToggle: () => void;
    showUnresolvedOnly: boolean;
    onUnresolvedToggle: () => void;

    onNewReservation: () => void;
}

export function ReservationToolbar({
    searchQuery,
    onSearchChange,
    selectedStaffId,
    onStaffChange,
    staffList,
    viewMode,
    onViewModeChange,
    includePast,
    onIncludePastChange,
    currentDate,
    onDateChange,
    stats,
    showUnassignedOnly,
    onUnassignedToggle,
    showUnresolvedOnly,
    onUnresolvedToggle,
    onNewReservation
}: ReservationToolbarProps) {
    const parsedDate = parseISO(currentDate);

    const today = new Date();
    const isCurrentToday = isSameDay(parsedDate, today);
    const isCurrentTomorrow = isSameDay(parsedDate, addDays(today, 1));

    return (
        <div className="bg-white border-b border-slate-200">
            {/* 上段: 日付ナビゲーション & メインアクション */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100">
                {/* 左: 日付操作 */}
                <div className="flex items-center gap-6">
                    {/* 日付移動 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDateChange('prev')}
                            disabled={viewMode === 'all'}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'all'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-indigo-600'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className={`text-xl font-bold tabular-nums tracking-tight min-w-[160px] text-center ${viewMode === 'all' ? 'text-indigo-600' : 'text-slate-800'}`}>
                            {viewMode === 'all' ? (
                                <span>全期間を表示</span>
                            ) : (
                                <>
                                    {format(parsedDate, 'yyyy年M月d日', { locale: ja })}
                                    <span className="ml-2 text-base font-normal text-slate-500">
                                        ({format(parsedDate, 'E', { locale: ja })})
                                    </span>
                                </>
                            )}
                        </span>

                        <button
                            onClick={() => onDateChange('next')}
                            disabled={viewMode === 'all'}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'all'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-indigo-600'
                                }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* クイックジャンプ */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => onViewModeChange('today')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'daily' && isCurrentToday
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            今日
                        </button>
                        <button
                            onClick={() => onViewModeChange('tomorrow')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'daily' && isCurrentTomorrow
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            明日
                        </button>
                        <button
                            onClick={() => onViewModeChange('all')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'all'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            全期間
                        </button>
                    </div>
                </div>

                {/* 右: 新規予約 */}
                <button
                    onClick={onNewReservation}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    <span>新規予約</span>
                </button>
            </div>

            {/* 下段: 検索 & フィルター */}
            <div className="px-6 py-3 bg-slate-50/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* 検索 */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="お客様検索..."
                            className="pl-9 pr-8 py-1.5 w-60 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* 担当者 */}
                    <div className="h-6 w-px bg-slate-200 mx-1" />

                    <select
                        value={selectedStaffId}
                        onChange={(e) => onStaffChange(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-indigo-300 transition-colors"
                    >
                        <option value="all">担当: 全員</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => onIncludePastChange(!includePast)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${includePast
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        過去含
                    </button>

                    {/* フィルターバッジ */}
                    {(stats.unassigned > 0 || stats.unresolvedMemos > 0) && (
                        <>
                            <div className="h-6 w-px bg-slate-200 mx-1" />
                            <div className="flex items-center gap-2">
                                {stats.unassigned > 0 && (
                                    <button
                                        onClick={onUnassignedToggle}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${showUnassignedOnly
                                            ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-800'
                                            }`}
                                    >
                                        <UserX className="w-3.5 h-3.5" />
                                        未定 {stats.unassigned}
                                    </button>
                                )}
                                {stats.unresolvedMemos > 0 && (
                                    <button
                                        onClick={onUnresolvedToggle}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${showUnresolvedOnly
                                            ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-500/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-800'
                                            }`}
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        送 {stats.unresolvedMemos}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* 件数 */}
                <div className="text-sm font-medium text-slate-500">
                    全 <span className="text-slate-900 text-lg font-bold tabular-nums">{stats.total}</span> 件
                </div>
            </div>
        </div>
    );
}
