'use client';

import { useState, useMemo } from 'react';
import { format, addDays, parseISO } from 'date-fns';

import { useRouter } from 'next/navigation';
import { Appointment } from '@/services/appointmentServiceV2';
import { cancelAppointmentAction, checkInAppointmentAction, completeAppointmentAction } from '@/actions/appointmentActions';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { ReservationToolbar } from '@/components/reservation-v2/ReservationToolbar';
import { ReservationTable } from '@/components/reservation-v2/ReservationTable';
import { SearchStatusBar } from '@/components/reservation-v2/SearchStatusBar';
import { MiniCalendar } from '@/components/reservation-v2/MiniCalendar';

import { TodayAppointmentsList } from '@/components/reservation-v2/TodayAppointmentsList';
import { SidebarContainer } from '@/components/reservation-v2/SidebarContainer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReservationModal, EditingAppointment } from '@/components/reservation-v2/ReservationModal';

interface Staff {
    id: string;
    name: string;
}

interface Patient {
    id: string;
    name: string;
    kana: string;
    pId: number;
}

interface Stats {
    total: number;
    unassigned: number;
    unresolvedMemos: number;
}

interface ReservationV2ClientProps {
    initialAppointments: Appointment[];
    allAppointments: Appointment[];
    staffList: Staff[];
    patients: Patient[];
    currentDate: string;
    stats: Stats;
}

// ... imports

export type ViewMode = 'daily' | 'all';

export function ReservationV2Client({
    initialAppointments,
    allAppointments,
    staffList,
    patients,
    currentDate,
    stats
}: ReservationV2ClientProps) {
    const router = useRouter();

    // フィルター状態
    const [searchQuery, setSearchQuery] = useState('');
    // インクリメンタル検索のデバウンス
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [includePast, setIncludePast] = useState(false);
    const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

    const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);

    // Modal State
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<EditingAppointment | null>(null);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 削除確認モーダル State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // 本日の予約リスト (サイドバー用, 常に今日の分を表示)
    const todayAppointments = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return allAppointments.filter(a =>
            (typeof a.visitDate === 'string' ? a.visitDate : new Date(a.visitDate).toISOString()).startsWith(todayStr)
        ).sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    }, [allAppointments]);

    // フィルター適用済みかどうか
    const hasActiveFilters = searchQuery !== ''
        || selectedStaffId !== 'all'
        || viewMode !== 'daily'
        || showUnassignedOnly
        || showUnresolvedOnly;

    // フィルター適用後の予約リスト
    const filteredAppointments = useMemo(() => {
        // 全期間モードなら初期リストとして全件を使用、それ以外は当日のリスト（initialAppointments）
        // ただし viewMode === 'daily' でも searchQuery がある場合は全件から探したいかも？
        // UseCase 3: "Search box inputted... display all future/past" -> No, actually user explicitly presses "All".
        // If users search in "Daily" mode, they expect to search within that day.
        // So:
        // ViewMode = 'all' -> Source: allAppointments (filtered by date if includePast is false)
        // ViewMode = 'daily' -> Source: initialAppointments (which is server-filtered by currentDate)

        let result = viewMode === 'all' ? allAppointments : initialAppointments;

        // 検索クエリでフィルタ (デバウンス適用)
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            result = result.filter(a =>
                a.patientName.toLowerCase().includes(query) ||
                a.patientKana?.toLowerCase().includes(query) ||
                a.memo?.toLowerCase().includes(query)
            );
        }

        // スタッフでフィルタ
        if (selectedStaffId !== 'all') {
            result = result.filter(a => a.staffId === selectedStaffId);
        }

        // 未割り当てのみ
        if (showUnassignedOnly) {
            result = result.filter(a => !a.staffId);
        }

        // 未解決メモのみ
        if (showUnresolvedOnly) {
            result = result.filter(a => a.adminMemo && !a.isMemoResolved);
        }

        // 全期間モードの時の過去フィルタ
        if (viewMode === 'all' && !includePast) {
            const today = new Date(); // リアルタイムの今日
            today.setHours(0, 0, 0, 0);
            result = result.filter(a => new Date(a.visitDate) >= today);
        }

        // ViewMode = 'daily' の場合、基本的には server component から渡された initialAppointments で日付は合っているはずだが、
        // 念のため日付フィルタはかけない（パフォーマンス優先）。
        // URLの日付と乖離がないことを前提とする。

        // ソート: 日時順
        result = result.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

        return result;
    }, [initialAppointments, allAppointments, debouncedSearchQuery, selectedStaffId, viewMode, showUnassignedOnly, showUnresolvedOnly, includePast]);

    // フィルターをクリア
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStaffId('all');
        setViewMode('daily'); // 今日（URLの日付）に戻す
        setShowUnassignedOnly(false);
        setShowUnresolvedOnly(false);
    };

    // 日付ナビゲーション
    const handleDateChange = (direction: 'prev' | 'next') => {
        const current = parseISO(currentDate);
        const newDate = direction === 'next' ? addDays(current, 1) : addDays(current, -1);
        setViewMode('daily'); // 日付操作したら必ず日次モードへ
        router.push(`/reservation-v2?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    // クイックアクションハンドラ (今日/明日/全期間)
    const handleQuickAction = (action: 'today' | 'tomorrow' | 'all') => {
        const current = new Date();
        const tomorrow = addDays(current, 1);

        if (action === 'today') {
            setViewMode('daily');
            router.push(`/reservation-v2?date=${format(current, 'yyyy-MM-dd')}`);
        } else if (action === 'tomorrow') {
            setViewMode('daily');
            router.push(`/reservation-v2?date=${format(tomorrow, 'yyyy-MM-dd')}`);
        } else if (action === 'all') {
            setViewMode('all');
        }
    };

    // 顧客選択ハンドラ (サイドバーからの遷移用)
    const handlePatientSelect = (patientName: string) => {
        setSearchQuery(patientName); // 名前で検索
        setViewMode('all');          // 全期間表示
        setIncludePast(false);       // 過去分は含めない (これからの方が見たい)
        setSelectedStaffId('all');   // スタッフ絞り込み解除
    };

    return (
        <div className="flex h-screen max-h-screen bg-slate-50 overflow-hidden">
            {/* サイドバー */}
            {isSidebarOpen && (
                <div className="w-[300px] flex-none h-full border-r border-slate-200 bg-white hidden lg:block z-20">
                    <SidebarContainer
                        calendarContent={
                            <MiniCalendar
                                currentDate={currentDate}
                                highlightSelected={viewMode === 'daily'}
                                onDateSelect={(date) => {
                                    // カレンダーの日付を選択したらその日に移動し、単日モードへ
                                    setViewMode('daily');
                                    router.push(`/reservation-v2?date=${date}`);
                                }}
                            />
                        }
                        todayListContent={
                            <TodayAppointmentsList
                                appointments={todayAppointments}
                                onPatientSelect={handlePatientSelect}
                            />
                        }
                    />
                </div>
            )}

            {/* メインコンテンツ (スクロール領域) */}
            <div className="flex-1 h-full overflow-y-auto min-w-0">
                <div className="w-full sticky top-0 z-20 shadow-sm bg-white/80 backdrop-blur-sm transition-all">
                    {/* ツールバー (日付・アクション・フィルタ) */}
                    <ReservationToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedStaffId={selectedStaffId}
                        onStaffChange={setSelectedStaffId}
                        staffList={staffList}
                        viewMode={viewMode}
                        onViewModeChange={handleQuickAction}
                        includePast={includePast}
                        onIncludePastChange={setIncludePast}
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        stats={stats}
                        showUnassignedOnly={showUnassignedOnly}
                        onUnassignedToggle={() => setShowUnassignedOnly(!showUnassignedOnly)}
                        showUnresolvedOnly={showUnresolvedOnly}
                        onUnresolvedToggle={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
                        displayedCount={filteredAppointments.length}
                        isSidebarOpen={isSidebarOpen}
                        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        onNewReservation={() => setIsReservationModalOpen(true)}
                    />

                    {/* 検索条件バー (検索中のみ表示・ツールバーと一緒に固定) */}
                    {hasActiveFilters && (
                        <SearchStatusBar
                            searchQuery={searchQuery}
                            selectedStaffId={selectedStaffId}
                            staffList={staffList}
                            viewMode={viewMode}
                            showUnassignedOnly={showUnassignedOnly}
                            showUnresolvedOnly={showUnresolvedOnly}
                            resultCount={filteredAppointments.length}
                            onClear={clearFilters}
                        />
                    )}
                </div>

                {/* テーブル */}
                <ReservationTable
                    appointments={filteredAppointments}
                    onEdit={(id) => {
                        // 編集対象の予約を探す
                        const target = filteredAppointments.find(a => a.id === id);
                        if (target) {
                            setEditingAppointment({
                                id: target.id,
                                patientId: target.patientId,
                                patientName: target.patientName,
                                patientKana: target.patientKana,
                                visitDate: target.visitDate,
                                duration: target.duration,
                                staffId: target.staffId,
                                memo: target.memo,
                                adminMemo: target.adminMemo
                            });
                            setIsReservationModalOpen(true);
                        }
                    }}
                    onDelete={(id) => setDeleteTargetId(id)}
                    onCheckIn={async (id) => {
                        const result = await checkInAppointmentAction(id);
                        if (result.success) {
                            toast.success('チェックイン完了', { description: 'お客様の来店を確認しました' });
                        } else {
                            toast.error('エラー', { description: result.message || 'チェックインに失敗しました' });
                        }
                    }}
                    onComplete={async (id) => {
                        const result = await completeAppointmentAction(id);
                        if (result.success) {
                            toast.success('施術完了', { description: '予約が完了になりました' });
                        } else {
                            toast.error('エラー', { description: result.message || '完了処理に失敗しました' });
                        }
                    }}
                />
            </div>

            <ReservationModal
                isOpen={isReservationModalOpen}
                onClose={() => {
                    setIsReservationModalOpen(false);
                    setEditingAppointment(null); // 閉じたら編集状態クリア
                }}
                staffList={staffList}
                patients={patients}
                initialDate={currentDate.split('T')[0]}
                editingAppointment={editingAppointment}
            />

            {/* 削除確認ダイアログ */}
            <ConfirmDialog
                open={!!deleteTargetId}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                title="予約のキャンセル"
                description="この予約をキャンセル（削除）してもよろしいですか？この操作は取り消せません。"
                confirmLabel="削除する"
                variant="danger"
                onConfirm={async () => {
                    if (deleteTargetId) {
                        const result = await cancelAppointmentAction(deleteTargetId);
                        if (!result.success) {
                            alert(result.message || '削除に失敗しました');
                        }
                        setDeleteTargetId(null);
                    }
                }}
            />
        </div>

    );
}
