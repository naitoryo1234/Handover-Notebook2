
'use client';

import { useState } from 'react';
import { format, parseISO, differenceInMinutes, isAfter, isBefore, addMinutes, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { RefreshCw, User, Clock, Hash, AlertCircle, FileText, LogIn, CheckCircle2 } from 'lucide-react';
import { getNow } from '@/lib/dateUtils';
import { Appointment } from '@/services/appointmentServiceV2';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TodayAppointmentsListProps {
    appointments: Appointment[];
    currentTime?: Date;
    listLabel?: string; // ヘッダーに表示するラベル (日付など)
    onPatientSelect?: (patientName: string) => void;
    onCheckIn?: (id: string) => void;
    onComplete?: (id: string) => void;
    onCardTap?: (appointment: Appointment) => void;
    filterState?: {
        unassigned: boolean;
        unresolved: boolean;
    };
    onToggleFilter?: (type: 'unassigned' | 'unresolved') => void;
}

type DialogState = {
    type: 'admin' | 'memo';
    appointment: Appointment;
} | null;

export function TodayAppointmentsList({
    appointments,
    currentTime = new Date(),
    listLabel,
    onPatientSelect,
    onCheckIn,
    onComplete,
    onCardTap,
    filterState,
    onToggleFilter
}: TodayAppointmentsListProps) {
    // 申し送り・メモダイアログ用
    const [dialogState, setDialogState] = useState<DialogState>(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 簡易的なステータス判定ロジック
    const getStatusBadge = (apt: Appointment) => {
        const start = new Date(apt.visitDate);
        const end = addMinutes(start, apt.duration);
        const now = currentTime;

        if (apt.status === 'cancelled') {
            return <Badge variant="outline" className="text-slate-400 border-slate-200">キャンセル</Badge>;
        }

        if (apt.status === 'completed') {
            return <Badge variant="secondary" className="bg-slate-100 text-slate-500">完了</Badge>;
        }

        if (isAfter(now, end)) {
            // 時間過ぎてるのに完了してない -> 未会計/完了待ち?
            return <Badge variant="secondary" className="bg-slate-100 text-slate-500">終了</Badge>;
        }

        if (isBefore(now, start)) {
            // まだ始まってない
            const minutesToStart = differenceInMinutes(start, now);
            if (minutesToStart <= 15 && minutesToStart > 0) {
                return <Badge className="bg-amber-500 text-white hover:bg-amber-600">まもなく</Badge>;
            }
            return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">予定</Badge>;
        }

        // 進行中
        const minutesLeft = differenceInMinutes(end, now);
        if (minutesLeft <= 10) {
            return <Badge className="bg-rose-500 text-white hover:bg-rose-600 animate-pulse">あと{minutesLeft}分</Badge>;
        }

        return <Badge className="bg-indigo-500 text-white hover:bg-indigo-600">対応中</Badge>;
    };

    // Filter appointments:
    // 1. Remove cancelled
    // 2. Remove past appointments (with 30min buffer)
    const filteredAppointments = appointments.filter(apt => {
        if (apt.status === 'cancelled') return false;

        const start = new Date(apt.visitDate);
        const end = addMinutes(start, apt.duration);
        // Buffer time: Keep showing for 30 mins after appointment ends (for checkout/cleanup)
        const displayUntil = addMinutes(end, 30);

        return displayUntil > currentTime;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header - Slim Bar, Full Width */}
            <div className="shrink-0 bg-emerald-600 px-3 py-2 text-white shadow-sm z-10 mt-0 touch-none">
                <div className="flex items-center justify-between">
                    {/* Left: Label (Date) & Count */}
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm leading-none tracking-tight">
                            {listLabel || (
                                <>
                                    {format(new Date(), 'yyyy-MM-dd', { locale: ja })}
                                    <span className="font-normal opacity-90 ml-1">
                                        ({format(new Date(), 'eee', { locale: ja })})
                                    </span>
                                </>
                            )}
                        </span>
                        <span className="flex items-center justify-center h-5 px-1.5 text-[10px] font-bold bg-white/20 rounded-full backdrop-blur-sm">
                            {filteredAppointments.length}
                        </span>
                    </div>

                    {/* Right: Time & Refresh */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-100/90 font-mono leading-none">
                            {format(currentTime, 'HH:mm')} 更新
                        </span>
                        <div className="bg-emerald-700/50 p-1 rounded hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95" title="更新">
                            <RefreshCw className="w-3 h-3 text-emerald-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Strip */}
            {/* Alert Strip (Interactive Filters) */}
            {(filteredAppointments.some(a => !a.staffName) || filteredAppointments.some(a => a.adminMemo)) && (
                <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-3 py-2 flex flex-wrap gap-x-4 gap-y-2 text-xs animate-in slide-in-from-top-2 touch-none">
                    {filteredAppointments.filter(a => !a.staffName).length > 0 && (
                        <button
                            onClick={() => onToggleFilter?.('unassigned')}
                            className={cn(
                                "flex items-center gap-1.5 font-bold transition-all px-2 py-1 rounded-md",
                                filterState?.unassigned
                                    ? "bg-amber-200 text-amber-900 shadow-sm ring-1 ring-amber-400"
                                    : "text-amber-700 bg-amber-100/50 hover:bg-amber-100"
                            )}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>担当未定 {filteredAppointments.filter(a => !a.staffName).length}件</span>
                        </button>
                    )}
                    {filteredAppointments.filter(a => a.adminMemo && !a.isMemoResolved).length > 0 && (
                        <button
                            onClick={() => onToggleFilter?.('unresolved')}
                            className={cn(
                                "flex items-center gap-1.5 font-bold transition-all px-2 py-1 rounded-md",
                                filterState?.unresolved
                                    ? "bg-rose-200 text-rose-900 shadow-sm ring-1 ring-rose-400"
                                    : "text-rose-600 bg-rose-100/50 hover:bg-rose-100"
                            )}
                        >
                            <AlertCircle className={cn("w-3.5 h-3.5", !filterState?.unresolved && "animate-pulse")} />
                            <span>申し送り {filteredAppointments.filter(a => a.adminMemo && !a.isMemoResolved).length}件</span>
                        </button>
                    )}
                </div>
            )}

            {/* List Content - Full Width */}
            <div className="flex-1 overflow-y-scroll overscroll-contain px-3 py-3 bg-slate-50">
                {filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">表示する予定はありません</p>
                    </div>
                ) : (
                    filteredAppointments.map((apt) => {
                        const start = new Date(apt.visitDate);
                        const end = addMinutes(start, apt.duration);

                        // 今日の日付と異なれば日付を表示する
                        const isToday = isSameDay(start, getNow());
                        const datePrefix = !isToday ? format(start, 'M/d(eee) ', { locale: ja }) : '';

                        const timeRange = `${datePrefix}${format(start, 'HH:mm')} -${format(end, 'HH:mm')} `;

                        return (
                            <div
                                key={apt.id}
                                onClick={() => onCardTap ? onCardTap(apt) : onPatientSelect?.(apt.patientName)}
                                className={cn(
                                    "bg-white rounded-xl p-3 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md cursor-pointer hover:bg-slate-50 active:bg-slate-100",
                                    apt.status === 'cancelled' && "opacity-50 bg-slate-50 grayscale-[0.5]",
                                    (apt.status !== 'cancelled' && (
                                        new Date(apt.visitDate).getTime() + (apt.duration * 60000) < new Date().getTime()
                                    )) && "opacity-70 bg-slate-50/50"
                                )}
                            >
                                {/* Status Indicator Strip */}
                                <div className={cn(
                                    "absolute left-0 top-3 bottom-3 w-1 rounded-r opacity-60",
                                    apt.status === 'cancelled' ? "bg-slate-300" : "bg-emerald-400"
                                )} />

                                <div className="pl-3">
                                    {/* Row 1: Time & Status */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="font-bold text-slate-700 text-lg font-mono tracking-tight leading-none">
                                            {timeRange}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* ステータスバッジ */}
                                            <div className="scale-90 origin-right">
                                                {getStatusBadge(apt)}
                                            </div>
                                            {/* アクションボタン */}
                                            {apt.status === 'scheduled' && onCheckIn && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCheckIn(apt.id);
                                                    }}
                                                    className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors shadow-sm"
                                                    title="チェックイン"
                                                >
                                                    <LogIn className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {apt.status === 'arrived' && onComplete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onComplete(apt.id);
                                                    }}
                                                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm"
                                                    title="完了"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Name */}
                                    <div className="mb-2">
                                        <div className="flex items-baseline gap-2 overflow-hidden">
                                            <span className="font-bold text-slate-800 text-base truncate">
                                                {apt.patientName}
                                            </span>
                                            <span className="text-xs text-slate-400 truncate shrink-0 max-w-[80px]">
                                                {apt.patientKana}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Row 3: Staff & Duration */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            {apt.staffName ? (
                                                <>
                                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[120px]">
                                                        {apt.staffName}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                                                    未割り当て
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                                            <Clock className="w-3 h-3" />
                                            <span>{apt.duration}分</span>
                                        </div>
                                    </div>

                                    {/* Row 4: Tags */}
                                    {(apt.memo || apt.adminMemo) && (
                                        <div className="flex flex-wrap gap-2 items-center mt-1">
                                            {apt.adminMemo && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDialogState({ type: 'admin', appointment: apt });
                                                    }}
                                                    className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center gap-1 hover:bg-rose-100 transition-colors shadow-sm"
                                                >
                                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                                    <span className="font-medium">申し送りあり</span>
                                                </button>
                                            )}
                                            {apt.memo && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDialogState({ type: 'memo', appointment: apt });
                                                    }}
                                                    className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors shadow-sm"
                                                >
                                                    <FileText className="w-3 h-3 shrink-0" />
                                                    <span className="font-medium">メモあり</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Unified Memo Dialog */}
            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={`flex items - center gap - 2 ${dialogState?.type === 'admin' ? 'text-rose-600' : 'text-blue-600'
                            } `}>
                            {dialogState?.type === 'admin' ? (
                                <>
                                    <AlertCircle className="w-5 h-5" />
                                    申し送り事項
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    予約メモ
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4">
                            <div className="text-sm text-slate-500 mb-1">対象のお客様</div>
                            <div className="font-bold text-lg">{dialogState?.appointment.patientName} 様</div>
                        </div>
                        <div className={`p - 4 rounded - lg border leading - relaxed whitespace - pre - wrap ${dialogState?.type === 'admin'
                            ? 'bg-rose-50 border-rose-100 text-rose-800'
                            : 'bg-blue-50 border-blue-100 text-blue-800'
                            } `}>
                            {dialogState?.type === 'admin'
                                ? dialogState.appointment.adminMemo
                                : dialogState?.appointment.memo
                            }
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
