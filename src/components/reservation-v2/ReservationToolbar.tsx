'use client';

import { useRef, useEffect, useState } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Calendar,
    Search,
    UserX,
    AlertCircle,
    X,
    Plus,
    PanelLeftClose,
    PanelLeftOpen,
    Home,
    Users,
    CalendarDays,
    List,
    Menu,
    User,
    Mic
} from 'lucide-react';
import { MobileVoiceInput } from '@/components/mobile/MobileVoiceInput';
import Link from 'next/link';
import { Stats } from '@/app/reservation-v2/ReservationV2Client';
import { VoiceCommandResult, parseVoiceCommand } from '@/actions/voiceCommandActions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';

interface ReservationToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedStaffId: string;
    onStaffChange: (staffId: string) => void;
    staffList: { id: string; name: string }[];
    viewMode: 'daily' | 'all';
    onViewModeChange: (mode: 'daily' | 'all' | 'today' | 'tomorrow') => void;
    includePast: boolean;
    onIncludePastChange: (include: boolean) => void;
    currentDate: string;
    onDateChange: (direction: 'prev' | 'next') => void;
    onDateSelect?: (date: string) => void;
    stats: Stats;
    showUnassignedOnly: boolean;
    onUnassignedToggle: () => void;
    showUnresolvedOnly: boolean;
    onUnresolvedToggle: () => void;
    displayedCount: number;
    isSidebarOpen: boolean;
    onSidebarToggle: () => void;
    onNewReservation: () => void;
    onVoiceCommand?: (result: VoiceCommandResult) => void;
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
    onDateSelect,
    stats,
    showUnassignedOnly,
    onUnassignedToggle,
    showUnresolvedOnly,
    onUnresolvedToggle,
    displayedCount,
    isSidebarOpen,
    onSidebarToggle,
    onNewReservation,
    onVoiceCommand
}: ReservationToolbarProps) {
    const parsedDate = parseISO(currentDate);
    const isCurrentToday = format(new Date(), 'yyyy-MM-dd') === currentDate;
    const isCurrentTomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd') === currentDate;

    const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

    // ハンドララッパー: シートを閉じてからアクションを実行
    const handleSheetAction = (action: () => void) => {
        action();
        setIsDateSheetOpen(false);
    };

    // BottomSheet Title
    const sheetTitle = "メニュー & 期間変更";

    return (
        <div className="bg-white border-b border-slate-200">
            {/* Mobile View (< md) - Unified Single Header */}
            <div className="md:hidden flex flex-col bg-white sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 px-3 py-2.5 h-[60px]"> {/* Height fixed for consistency */}

                    {/* 1. Date Selector (Left) */}
                    <button
                        onClick={() => setIsDateSheetOpen(true)}
                        className="flex flex-col items-start justify-center pl-1 pr-2 py-1 active:bg-slate-100 rounded-lg transition-colors shrink-0 max-w-[100px]"
                    >
                        <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">
                            {viewMode === 'all' ? 'LIST' : format(parsedDate, 'yyyy', { locale: ja })}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold text-slate-800 tabular-nums leading-none tracking-tight whitespace-nowrap">
                                {viewMode === 'all' ? (
                                    '全期間'
                                ) : (
                                    <>
                                        {format(parsedDate, 'M/d', { locale: ja })}
                                        <span className="text-xs font-normal text-slate-500 ml-0.5">({format(parsedDate, 'E', { locale: ja })})</span>
                                    </>
                                )}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                    </button>

                    {/* 2. Search Input (Center - Flexible) */}
                    <div className="relative flex-1 min-w-0 h-10">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="検索..."
                            className="w-full h-full pl-9 pr-10 py-0 bg-slate-100 border-none rounded-full text-base md:text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <MobileVoiceInput
                                onCommit={async (text) => {
                                    // 音声コマンド解析を呼び出し
                                    if (onVoiceCommand) {
                                        const result = await parseVoiceCommand(text);
                                        if (result.success && result.data) {
                                            onVoiceCommand(result.data);
                                        } else {
                                            // 解析失敗時はそのまま検索
                                            onSearchChange(text);
                                        }
                                    } else {
                                        // フォールバック: 従来の検索
                                        onSearchChange(text);
                                    }
                                }}
                                trigger={
                                    <button className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-full active:bg-slate-200 transition-colors">
                                        <Mic className="w-4 h-4" />
                                    </button>
                                }
                            />
                        </div>
                    </div>

                    {/* 3. Staff Selector (Icon Button with native select overlay) */}
                    <div className="relative shrink-0 w-10 h-10">
                        <div className={`w-full h-full flex items-center justify-center rounded-full transition-colors border ${selectedStaffId !== 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}>
                            <User className="w-5 h-5" />
                        </div>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => onStaffChange(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            <option value="all">全スタッフ</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 4. New Reservation Button (Right) */}
                    <button
                        onClick={onNewReservation}
                        className="shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-all hover:bg-emerald-700"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>


            {/* Mobile Bottom Sheet for Date Selection & Navigation */}
            <BottomSheet
                isOpen={isDateSheetOpen}
                onClose={() => setIsDateSheetOpen(false)}
                title="メニュー & 期間変更"
            >
                <div className="space-y-6 pb-6">
                    {/* Navigation Links */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ナビゲーション</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/" className="col-span-1" onClick={() => setIsDateSheetOpen(false)}>
                                <Button variant="outline" className="w-full h-12 text-base justify-start px-4 border-slate-200">
                                    <Home className="w-4 h-4 mr-2 text-slate-500" />
                                    ホーム
                                </Button>
                            </Link>
                            <Link href="/customer-notebook" className="col-span-1" onClick={() => setIsDateSheetOpen(false)}>
                                <Button variant="outline" className="w-full h-12 text-base justify-start px-4 border-slate-200">
                                    <Users className="w-4 h-4 mr-2 text-indigo-500" />
                                    顧客ノート
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    {/* Shortcuts */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">表示期間</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-12 text-base justify-start px-4"
                                onClick={() => handleSheetAction(() => onViewModeChange('today'))}
                            >
                                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                                今日
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-base justify-start px-4"
                                onClick={() => handleSheetAction(() => onViewModeChange('tomorrow'))}
                            >
                                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                明日
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-base justify-start px-4"
                                onClick={() => handleSheetAction(() => {
                                    const nextWeek = addDays(new Date(), 7);
                                    onDateSelect?.(format(nextWeek, 'yyyy-MM-dd'));
                                })}
                            >
                                <CalendarDays className="w-4 h-4 mr-2 text-slate-500" />
                                来週
                            </Button>
                            <Button
                                variant={viewMode === 'all' ? 'default' : 'outline'}
                                className={`h-12 text-base justify-start px-4 ${viewMode === 'all' ? 'bg-slate-800 text-white' : ''}`}
                                onClick={() => handleSheetAction(() => onViewModeChange('all'))}
                            >
                                <List className="w-4 h-4 mr-2" />
                                全期間リスト
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            日付を直接指定
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full text-base p-3 pl-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 transition-colors appearance-none"
                                value={format(parsedDate, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleSheetAction(() => onDateSelect?.(e.target.value));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </BottomSheet>

            {/* Desktop View (>= md) - Original Layout Preserved */}
            <div className="hidden md:block">
                {/* 上段: 日付ナビゲーション & メインアクション */}
                <div className="px-6 py-3 flex items-center justify-between border-b border-slate-100">
                    {/* 左: 日付操作 & ナビゲーション */}
                    <div className="flex items-center gap-6">
                        {/* ナビゲーションアイコン */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <Link
                                href="/"
                                title="ホーム"
                                className="flex items-center justify-center p-2 text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            >
                                <Home className="w-5 h-5" />
                            </Link>
                            <div className="w-px h-4 bg-slate-200" />
                            <Link
                                href="/customer-notebook"
                                title="Customer Notebook"
                                className="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            >
                                <Users className="w-5 h-5" />
                            </Link>
                            <div className="w-px h-4 bg-slate-200" />
                            <Link
                                href="/reservation-v2"
                                title="Reservation Notebook"
                                className="flex items-center justify-center p-2 text-emerald-600 bg-white shadow-sm rounded-md"
                            >
                                <Calendar className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

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
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                今日
                            </button>
                            <button
                                onClick={() => onViewModeChange('tomorrow')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'daily' && isCurrentTomorrow
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                明日
                            </button>
                            <button
                                onClick={() => onViewModeChange('all')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'all'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                全期間
                            </button>
                        </div>
                    </div>

                    {/* 右側: ナビリンク(サイドバー閉時) + サイドバートグル + 新規予約 */}
                    <div className="flex items-center gap-2">


                        {/* サイドバートグルボタン */}
                        <button
                            onClick={onSidebarToggle}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title={isSidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </button>

                        {/* 新規予約 */}
                        <button
                            onClick={onNewReservation}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            <span>新規予約</span>
                        </button>
                    </div>
                </div>

                {/* 下段: 検索 & フィルター */}
                <div className="px-6 py-3 bg-slate-50/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* 検索 */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="お客様検索..."
                                className="pl-9 pr-8 py-1.5 w-60 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:border-emerald-300 transition-colors"
                        >
                            <option value="all">担当: 全員</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => onIncludePastChange(!includePast)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${includePast
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                                            申し送り {stats.unresolvedMemos}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 件数 */}
                    <div className="text-sm font-medium text-slate-500">
                        全 <span className="text-slate-900 text-lg font-bold tabular-nums">{displayedCount}</span> 件
                    </div>
                </div>
            </div>
        </div>
    );
}
