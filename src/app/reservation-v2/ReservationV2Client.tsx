'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useRouter } from 'next/navigation';
import { Appointment } from '@/services/appointmentServiceV2';
import { cancelAppointmentAction, checkInAppointmentAction, completeAppointmentAction, cancelCheckInAction, undoAppointmentStatusAction } from '@/actions/appointmentActions';
import { VoiceCommandResult } from '@/actions/voiceCommandActions';
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

export interface Stats {
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
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return allAppointments.filter(a => {
            const visitDate = new Date(a.visitDate);
            return visitDate >= todayStart && visitDate < todayEnd;
        }).sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
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
        // 
        // 修正: 検索時は強制的に viewMode='all' になる（handleSearchChange）ので、ここはシンプルで良い。

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

    // 日付選択ハンドラ (カレンダー/指定日付ジャンプ用)
    const handleDateSelect = (dateStr: string) => {
        setViewMode('daily'); // 日付を指定したら必ず日次モードへ
        router.push(`/reservation-v2?date=${dateStr}`);
    };

    // 日付ナビゲーション (前日/翌日)
    const handleDateChange = (direction: 'prev' | 'next') => {
        const current = parseISO(currentDate);
        const newDate = direction === 'next' ? addDays(current, 1) : addDays(current, -1);
        handleDateSelect(format(newDate, 'yyyy-MM-dd'));
    };

    // クイックアクションハンドラ (今日/明日/全期間)
    const handleQuickAction = (action: 'today' | 'tomorrow' | 'all' | 'daily') => {
        const current = new Date();
        const tomorrow = addDays(current, 1);

        if (action === 'today') {
            handleDateSelect(format(current, 'yyyy-MM-dd'));
        } else if (action === 'tomorrow') {
            handleDateSelect(format(tomorrow, 'yyyy-MM-dd'));
        } else if (action === 'all') {
            setViewMode('all');
        } else if (action === 'daily') {
            setViewMode('daily');
        }
    };

    // 検索ハンドラ (検索時は自動で全期間・過去込みモードにして検索性を向上)
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (query) {
            // 検索文字が入ったら全期間検索モードへ
            if (viewMode !== 'all') setViewMode('all');
            if (!includePast) setIncludePast(true);
        } else {
            // クリアされたら今日に戻す（または元の状態に戻す）
            // ユーザー体験的には「検索終わったから今日の予定に戻る」が自然か
            const current = new Date(); // URLの日付に戻すべきだが、とりあえず今日に戻すのが無難
            if (viewMode === 'all') {
                // ここで日付リセットまですると不便な場合もあるが、要望としては「戻りたい」はず
                // ただしURLのdateパラメータは生きているので、dailyに戻せばURLの日付が表示される
                setViewMode('daily');
            }
            // includePastは戻さない（ユーザーが意図してオンにしたかもしれないので）
        }
    };

    // 音声コマンド適用ハンドラ
    const applyVoiceCommand = useCallback((result: VoiceCommandResult) => {
        // 名前検索
        if (result.name) {
            setSearchQuery(result.name);
            // 名前検索時は全期間・過去込みで検索
            if (viewMode !== 'all') setViewMode('all');
            if (!includePast) setIncludePast(true);
            toast.success(`"${result.name}" で検索`, { duration: 2000 });
        }

        // 日付フィルター（名前と併用可能）
        if (result.date) {
            setViewMode('daily');
            router.push(`/reservation-v2?date=${result.date}`);
            if (!result.name) {
                toast.success(`${result.date} の予約を表示`, { duration: 2000 });
            }
        }

        // 全期間表示（名前も日付もない場合）
        if (result.period === 'all' && !result.name && !result.date) {
            setViewMode('all');
            toast.success('全期間の予約を表示', { duration: 2000 });
        }

        // 担当未定フィルター
        if (result.showUnassigned) {
            setShowUnassignedOnly(true);
            if (viewMode !== 'all') setViewMode('all');
            toast.success('担当未定の予約を表示', { duration: 2000 });
        }

        // 申し送りありフィルター
        if (result.showUnresolved) {
            setShowUnresolvedOnly(true);
            if (viewMode !== 'all') setViewMode('all');
            toast.success('申し送りありの予約を表示', { duration: 2000 });
        }

        // 解析失敗時はそのままテキスト検索
        if (!result.name && !result.date && !result.period && !result.showUnassigned && !result.showUnresolved) {
            // 敬称を除去して検索（フォールバック）
            const cleanedText = result.rawText
                .replace(/さん|様|さま|くん|ちゃん/g, '')
                .trim();
            if (cleanedText) {
                setSearchQuery(cleanedText);
                if (viewMode !== 'all') setViewMode('all');
                if (!includePast) setIncludePast(true);
            }
        }
    }, [router, viewMode, includePast]);

    // 顧客選択ハンドラ (サイドバーからの遷移用)
    const handlePatientSelect = (patientName: string) => {
        handleSearchChange(patientName); // 共通ロジックを使用
        setSelectedStaffId('all');   // スタッフ絞り込み解除
    };

    // フィルター個別解除ハンドラ
    const handleRemoveFilter = (type: 'query' | 'staff' | 'unassigned' | 'unresolved' | 'period') => {
        switch (type) {
            case 'query': setSearchQuery(''); break;
            case 'staff': setSelectedStaffId('all'); break;
            case 'unassigned': setShowUnassignedOnly(false); break;
            case 'unresolved': setShowUnresolvedOnly(false); break;
            case 'period': setViewMode('daily'); break;
        }
    };

    // Handlers
    const handleCheckIn = async (id: string) => {
        const result = await checkInAppointmentAction(id);
        if (result.success) {
            toast.success('チェックイン完了', {
                description: 'お客様の来店を確認しました',
                action: {
                    label: '元に戻す',
                    onClick: async () => {
                        const undoResult = await cancelCheckInAction(id);
                        if (undoResult.success) {
                            toast.info('チェックインを取り消しました');
                        }
                    }
                },
                duration: 5000
            });
        } else {
            toast.error('エラー', { description: result.message || 'チェックインに失敗しました' });
        }
    };

    const handleComplete = async (id: string) => {
        const result = await completeAppointmentAction(id);
        if (result.success) {
            toast.success('施術完了', {
                description: '予約が完了になりました',
                action: {
                    label: '元に戻す',
                    onClick: async () => {
                        const undoResult = await undoAppointmentStatusAction(id, 'arrived');
                        if (undoResult.success) {
                            toast.info('完了を取り消しました');
                        }
                    }
                },
                duration: 5000
            });
        } else {
            toast.error('エラー', { description: result.message || '完了処理に失敗しました' });
        }
    };

    // リストヘッダーのラベル生成
    const listLabel = viewMode === 'all'
        ? '予約一覧'
        : `${format(parseISO(currentDate), 'yyyy-MM-dd', { locale: ja })} (${format(parseISO(currentDate), 'eee', { locale: ja })})`;

    return (
        <>
            {/* ========== Mobile Layout (md未満) ========== */}
            <div className="md:hidden flex flex-col h-screen max-h-screen bg-slate-50">
                {/* モバイル用ツールバー */}
                <div className="shrink-0 z-20 shadow-sm bg-white/80 backdrop-blur-sm border-b border-slate-200">
                    <ReservationToolbar
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        selectedStaffId={selectedStaffId}
                        onStaffChange={setSelectedStaffId}
                        staffList={staffList}
                        viewMode={viewMode}
                        onViewModeChange={handleQuickAction}
                        includePast={includePast}
                        onIncludePastChange={setIncludePast}
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onDateSelect={handleDateSelect}
                        stats={stats}
                        showUnassignedOnly={showUnassignedOnly}
                        onUnassignedToggle={() => setShowUnassignedOnly(!showUnassignedOnly)}
                        showUnresolvedOnly={showUnresolvedOnly}
                        onUnresolvedToggle={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
                        displayedCount={filteredAppointments.length}
                        isSidebarOpen={isSidebarOpen}
                        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        onNewReservation={() => setIsReservationModalOpen(true)}
                        onVoiceCommand={applyVoiceCommand}
                    />
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
                            onRemoveFilter={handleRemoveFilter}
                        />
                    )}
                </div>

                {/* モバイル用カードリスト */}
                <div className="flex-1 overflow-y-auto">
                    <TodayAppointmentsList
                        appointments={filteredAppointments}
                        listLabel={listLabel}
                        onPatientSelect={handlePatientSelect}
                        onCheckIn={handleCheckIn}
                        onComplete={handleComplete}
                        onCardTap={(apt) => {
                            setEditingAppointment({
                                id: apt.id,
                                patientId: apt.patientId,
                                patientName: apt.patientName,
                                patientKana: apt.patientKana,
                                visitDate: apt.visitDate,
                                duration: apt.duration,
                                staffId: apt.staffId,
                                memo: apt.memo,
                                adminMemo: apt.adminMemo
                            });
                            setIsReservationModalOpen(true);
                        }}
                        filterState={{
                            unassigned: showUnassignedOnly,
                            unresolved: showUnresolvedOnly
                        }}
                        onToggleFilter={(type) => {
                            if (type === 'unassigned') setShowUnassignedOnly(!showUnassignedOnly);
                            if (type === 'unresolved') setShowUnresolvedOnly(!showUnresolvedOnly);
                        }}
                    />
                </div>
            </div>

            {/* ========== Desktop Layout (md以上) - 以前のレイアウトを復元 ========== */}
            <div className="hidden md:flex h-screen max-h-screen bg-slate-50 overflow-hidden">
                {/* 左: サイドバー */}
                {isSidebarOpen && (
                    <div className="w-[300px] flex-none h-full border-r border-slate-200 bg-white z-20">
                        <SidebarContainer
                            calendarContent={
                                <MiniCalendar
                                    currentDate={currentDate}
                                    highlightSelected={viewMode === 'daily'}
                                    onDateSelect={(date) => {
                                        setViewMode('daily');
                                        router.push(`/reservation-v2?date=${date}`);
                                    }}
                                />
                            }
                            todayListContent={
                                <TodayAppointmentsList
                                    appointments={todayAppointments}
                                    onPatientSelect={handlePatientSelect}
                                    onCheckIn={handleCheckIn}
                                    onComplete={handleComplete}
                                />
                            }
                        />
                    </div>
                )}

                {/* 右: メインコンテンツ (スクロール可能) */}
                <div className="flex-1 h-full overflow-y-auto min-w-0">
                    {/* ツールバー (sticky) */}
                    <div className="sticky top-0 z-20 shadow-sm bg-white/80 backdrop-blur-sm">
                        <ReservationToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            selectedStaffId={selectedStaffId}
                            onStaffChange={setSelectedStaffId}
                            staffList={staffList}
                            viewMode={viewMode}
                            onViewModeChange={handleQuickAction}
                            includePast={includePast}
                            onIncludePastChange={setIncludePast}
                            currentDate={currentDate}
                            onDateChange={handleDateChange}
                            onDateSelect={handleDateSelect}
                            stats={stats}
                            showUnassignedOnly={showUnassignedOnly}
                            onUnassignedToggle={() => setShowUnassignedOnly(!showUnassignedOnly)}
                            showUnresolvedOnly={showUnresolvedOnly}
                            onUnresolvedToggle={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
                            displayedCount={filteredAppointments.length}
                            isSidebarOpen={isSidebarOpen}
                            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                            onNewReservation={() => setIsReservationModalOpen(true)}
                            onVoiceCommand={applyVoiceCommand}
                        />
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
                                onRemoveFilter={handleRemoveFilter}
                            />
                        )}
                    </div>

                    {/* テーブル */}
                    <ReservationTable
                        appointments={filteredAppointments}
                        onEdit={(id) => {
                            const apt = allAppointments.find(a => a.id === id);
                            if (apt) {
                                setEditingAppointment({
                                    id: apt.id,
                                    patientId: apt.patientId,
                                    patientName: apt.patientName,
                                    patientKana: apt.patientKana,
                                    visitDate: apt.visitDate,
                                    duration: apt.duration,
                                    staffId: apt.staffId,
                                    memo: apt.memo,
                                    adminMemo: apt.adminMemo
                                });
                                setIsReservationModalOpen(true);
                            }
                        }}
                        onDelete={(id) => setDeleteTargetId(id)}
                        onCheckIn={handleCheckIn}
                        onComplete={handleComplete}
                    />
                </div>
            </div>

            {/* ========== 共通モーダル ========== */}
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
        </>
    );
}
