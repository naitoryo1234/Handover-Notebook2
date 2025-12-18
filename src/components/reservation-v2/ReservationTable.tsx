'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Check, Circle, Ban, User, Edit3, Trash2, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Appointment } from '@/services/appointmentServiceV2';
import Link from 'next/link';

interface ReservationTableProps {
    appointments: Appointment[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ReservationTable({ appointments, onEdit, onDelete }: ReservationTableProps) {
    // メモ展開状態の管理
    const [expandedMemos, setExpandedMemos] = useState<Set<string>>(new Set());

    const toggleMemoExpand = (id: string) => {
        setExpandedMemos(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

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
                    {appointments.map((appointment) => (
                        <tr
                            key={appointment.id}
                            className={`hover:bg-slate-50 transition-colors ${appointment.status === 'cancelled' ? 'opacity-50' : ''
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
                                <div className="text-lg font-bold text-slate-800 font-mono">
                                    {format(new Date(appointment.visitDate), 'HH:mm')}
                                </div>
                            </td>

                            {/* お客様名 */}
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Link
                                        href={`/customers/${appointment.patientId}`}
                                        className="text-lg font-bold text-slate-800 hover:text-emerald-600 transition-colors truncate"
                                        title={appointment.patientName}
                                    >
                                        {appointment.patientName}
                                    </Link>
                                    {appointment.visitCount && (
                                        <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full whitespace-nowrap">
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
                                {(appointment.memo || appointment.adminMemo) && (
                                    <div
                                        className="cursor-pointer group"
                                        onClick={() => toggleMemoExpand(appointment.id)}
                                    >
                                        {appointment.memo && (
                                            <p className={`text-sm text-slate-600 mb-1 ${expandedMemos.has(appointment.id) ? '' : 'line-clamp-2'}`}>
                                                {appointment.memo}
                                            </p>
                                        )}
                                        {appointment.adminMemo && (
                                            <div className={`text-sm p-2 rounded-md border ${appointment.isMemoResolved
                                                ? 'bg-slate-50 border-slate-200 text-slate-500'
                                                : 'bg-red-50 border-red-200 text-red-700'
                                                }`}>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="font-bold text-xs">申し送り</span>
                                                    {appointment.isMemoResolved && (
                                                        <span className="text-xs text-slate-400 ml-auto">解決済</span>
                                                    )}
                                                </div>
                                                <p className={expandedMemos.has(appointment.id) ? '' : 'line-clamp-2'}>{appointment.adminMemo}</p>
                                            </div>
                                        )}
                                        {/* 展開/縮小インジケータ */}
                                        <div className="flex items-center justify-center mt-1 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {expandedMemos.has(appointment.id) ? (
                                                <><ChevronUp className="w-3 h-3" /><span>縮小</span></>
                                            ) : (
                                                <><ChevronDown className="w-3 h-3" /><span>全文表示</span></>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}
