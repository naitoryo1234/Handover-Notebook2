'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Check, Circle, Ban, User, Edit3, Trash2, FileText, AlertTriangle, ChevronDown, ChevronUp, AlertCircle, FileText as FileTextIcon } from 'lucide-react';
import { Appointment } from '@/services/appointmentServiceV2';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReservationTableProps {
    appointments: Appointment[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

type DialogState = {
    type: 'admin' | 'memo';
    appointment: Appointment;
} | null;

export function ReservationTable({ appointments, onEdit, onDelete }: ReservationTableProps) {
    // 申し送り・メモダイアログ用
    const [dialogState, setDialogState] = useState<DialogState>(null);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <Check className="w-5 h-5 text-green-600 bg-green-100 rounded-full p-0.5" />;
            case 'cancelled':
                return <Ban className="w-5 h-5 text-slate-300" />;
            case 'arrived':
                return <Circle className="w-5 h-5 text-amber-500 fill-amber-500" />;
            case 'scheduled':
                return <Circle className="w-5 h-5 text-emerald-600" />;
            default:
                return <Circle className="w-5 h-5 text-slate-200" />;
        }
    };

    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 m-6 p-12 text-center">
                <div className="text-slate-400 text-lg mb-2">予約がありません</div>
                <p className="text-slate-500 text-sm">検索条件を変更するか、新規予約を作成してください</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 m-6 overflow-hidden">
            <table className="w-full table-fixed">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-36">日時・時間</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-56">お客様名</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-28">担当者</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">メモ</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-56">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {appointments.map((appointment) => {
                        const isPast = new Date(appointment.visitDate).getTime() + (appointment.duration * 60000) < new Date().getTime();
                        const isDimmed = appointment.status === 'cancelled' || appointment.status === 'completed' || isPast;

                        return (
                            <tr
                                key={appointment.id}
                                className={`transition-colors ${isDimmed
                                    ? 'bg-slate-50/80 opacity-60 hover:bg-slate-100/80'
                                    : 'hover:bg-slate-50'
                                    }`}
                            >
                                {/* 状態 */}
                                <td className="px-4 py-4">
                                    {getStatusIcon(appointment.status)}
                                </td>

                                {/* 日時・時間 */}
                                <td className="px-4 py-4">
                                    <div className="text-xs text-slate-500 font-mono">
                                        {format(new Date(appointment.visitDate), 'yyyy/MM/dd (E)', { locale: ja })}
                                    </div>
                                    <div className={`text-lg font-bold font-mono ${isDimmed ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {format(new Date(appointment.visitDate), 'HH:mm')}
                                    </div>
                                </td>

                                {/* お客様名 */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Link
                                            href={`/customers/${appointment.patientId}`}
                                            className={`text-lg font-bold transition-colors truncate ${isDimmed
                                                ? 'text-slate-600 hover:text-slate-800'
                                                : 'text-slate-800 hover:text-emerald-600'
                                                }`}
                                            title={appointment.patientName}
                                        >
                                            {appointment.patientName}
                                        </Link>
                                        {appointment.visitCount && (
                                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${isDimmed
                                                ? 'bg-slate-200 text-slate-500'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {appointment.visitCount}回目
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 truncate">
                                        {appointment.patientKana}
                                    </div>
                                </td>

                                {/* 担当者 */}
                                <td className="px-4 py-4">
                                    {appointment.staffName ? (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 truncate" title={appointment.staffName}>
                                                {appointment.staffName}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse whitespace-nowrap">
                                            未割り当て
                                        </span>
                                    )}
                                </td>

                                {/* メモ */}
                                <td className="px-4 py-4 max-w-xs">
                                    <div className="flex flex-col gap-2 items-start">
                                        {/* 申し送りボタン */}
                                        {appointment.adminMemo && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDialogState({ type: 'admin', appointment });
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full hover:bg-rose-100 transition-colors shadow-sm"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">申し送りあり</span>
                                            </button>
                                        )}
                                        {/* メモボタン (統一デザイン) */}
                                        {appointment.memo && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDialogState({ type: 'memo', appointment });
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                                            >
                                                <FileTextIcon className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">メモあり</span>
                                            </button>
                                        )}
                                    </div>
                                </td>

                                {/* 操作 */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {appointment.status === 'cancelled' ? (
                                            <>
                                                <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-400 text-sm font-bold rounded-lg cursor-not-allowed">
                                                    <FileText className="w-4 h-4" />
                                                    記録
                                                </span>
                                                <button
                                                    disabled
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg border border-slate-200 cursor-not-allowed"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    編集
                                                </button>
                                                <button
                                                    disabled
                                                    className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    href={`/customers/${appointment.patientId}`}
                                                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${isDimmed
                                                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        }`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    記録
                                                </Link>
                                                <button
                                                    onClick={() => onEdit(appointment.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => onDelete(appointment.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Unified Memo Dialog */}
            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${dialogState?.type === 'admin' ? 'text-rose-600' : 'text-blue-600'
                            }`}>
                            {dialogState?.type === 'admin' ? (
                                <>
                                    <AlertCircle className="w-5 h-5" />
                                    申し送り事項
                                </>
                            ) : (
                                <>
                                    <FileTextIcon className="w-5 h-5" />
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
                        <div className={`p-4 rounded-lg border leading-relaxed whitespace-pre-wrap ${dialogState?.type === 'admin'
                            ? 'bg-rose-50 border-rose-100 text-rose-800'
                            : 'bg-blue-50 border-blue-100 text-blue-800'
                            }`}>
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
