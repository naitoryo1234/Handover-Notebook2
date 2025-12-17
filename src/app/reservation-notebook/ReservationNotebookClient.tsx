'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMinutes, addDays, addWeeks } from 'date-fns';
import { Clock, User, Plus, Edit3, X, Ban, AlertTriangle } from 'lucide-react';
import { Appointment } from '@/services/appointmentService';
import { cancelAppointmentAction, scheduleAppointment, updateAppointmentAction } from '@/actions/appointmentActions';
import { CustomerSelector } from '@/components/appointment/CustomerSelector';
import { EmptyStateReservations } from '@/components/ui/EmptyState';

interface Patient {
    id: string;
    name: string;
    kana: string;
    pId: number;
}

interface ReservationNotebookClientProps {
    initialAppointments: Appointment[];
    patients: Patient[];
    currentDate: string;
}

export function ReservationNotebookClient({
    initialAppointments,
    patients,
    currentDate,
}: ReservationNotebookClientProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');

    const activeAppointments = initialAppointments.filter(a => a.status !== 'cancelled');

    // 編集モード時の初期値セット
    useEffect(() => {
        if (editingAppointment) {
            setSelectedPatientId(editingAppointment.patientId);
            setFormDate(format(new Date(editingAppointment.visitDate), 'yyyy-MM-dd'));
            setFormTime(format(new Date(editingAppointment.visitDate), 'HH:mm'));
        } else {
            setSelectedPatientId('');
            setFormDate(format(new Date(currentDate), 'yyyy-MM-dd'));
            setFormTime('10:00');
        }
    }, [editingAppointment, currentDate, isModalOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedPatientId) {
            alert('顧客を選択してください');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        // CustomerSelector内のhidden inputか、明示的にappendするか
        // CustomerSelectorに name="patientId" のhidden inputがあるため、FormDataに含まれるはずだが
        // 安全のため確認＆上書き
        formData.set('patientId', selectedPatientId);

        try {
            if (editingAppointment) {
                formData.set('id', editingAppointment.id);
                await updateAppointmentAction(formData);
            } else {
                await scheduleAppointment(formData);
            }
            setIsModalOpen(false);
            setEditingAppointment(null);
            router.refresh();
        } catch (error) {
            console.error('Failed to save appointment:', error);
            alert('予約の保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (appointmentId: string) => {
        if (!confirm('この予約をキャンセルしますか？')) return;

        try {
            await cancelAppointmentAction(appointmentId);
            router.refresh();
        } catch (error) {
            console.error('Failed to cancel appointment:', error);
        }
    };

    const handleEdit = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleNewAppointment = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    // Quick Actions
    const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
        const base = new Date();
        let target = base;
        if (type === 'tomorrow') target = addDays(base, 1);
        if (type === 'nextWeek') target = addWeeks(base, 1);
        setFormDate(format(target, 'yyyy-MM-dd'));
    };

    const addTime = (minutes: number) => {
        if (!formTime) return;
        const [h, m] = formTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m);
        const newDate = addMinutes(date, minutes);
        setFormTime(format(newDate, 'HH:mm'));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">予定</span>;
            case 'arrived':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">来店</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">完了</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">キャンセル</span>;
            default:
                return null;
        }
    };

    return (
        <>
            {/* 予約追加ボタン */}
            <div className="px-6 py-4 border-b border-slate-100">
                <button
                    onClick={handleNewAppointment}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow"
                >
                    <Plus className="w-4 h-4" />
                    新規予約を作成
                </button>
            </div>

            {/* 予約リスト */}
            <div className="divide-y divide-slate-100">
                {activeAppointments.length > 0 ? (
                    activeAppointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="px-6 py-4 hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-bold font-mono">
                                                {format(new Date(appointment.visitDate), 'HH:mm')}
                                            </span>
                                            <span className="text-slate-400 text-xs">
                                                {appointment.duration}min
                                            </span>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-lg">
                                            {appointment.patientName}
                                        </span>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            様
                                        </span>
                                    </div>
                                    {appointment.memo && (
                                        <p className="mt-2 text-sm text-slate-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg flex items-start gap-2">
                                            <span className="mt-0.5 text-amber-500">●</span>
                                            {appointment.memo}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(appointment)}
                                        className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                        title="編集"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCancel(appointment.id)}
                                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="キャンセル"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-4">
                        <EmptyStateReservations
                            action={{
                                label: '新規予約を作成',
                                onClick: handleNewAppointment
                            }}
                        />
                    </div>
                )}
            </div>

            {/* モーダル */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingAppointment ? '予約を編集' : '新規予約を作成'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingAppointment(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* 顧客選択 */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <User className="w-4 h-4" /> お客様
                                </label>
                                <CustomerSelector
                                    patients={patients}
                                    selectedPatientId={selectedPatientId}
                                    onSelect={setSelectedPatientId}
                                />
                            </div>

                            {/* 日時設定 */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    日時・時間
                                </label>
                                <div className="grid grid-cols-[1.5fr,1fr,1fr] gap-3">
                                    <input
                                        type="date"
                                        name="date"
                                        required
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium text-slate-700"
                                    />
                                    <input
                                        type="time"
                                        name="time"
                                        required
                                        value={formTime}
                                        onChange={(e) => setFormTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium text-slate-700"
                                    />
                                    <select
                                        name="duration"
                                        defaultValue={editingAppointment?.duration || 60}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium text-slate-700"
                                    >
                                        <option value="30">30分</option>
                                        <option value="60">60分</option>
                                        <option value="90">90分</option>
                                        <option value="120">120分</option>
                                    </select>
                                </div>
                                {/* クイックボタン */}
                                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setQuickDate('today')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors">今日</button>
                                        <button type="button" onClick={() => setQuickDate('tomorrow')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors">明日</button>
                                        <button type="button" onClick={() => setQuickDate('nextWeek')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors">来週</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => addTime(15)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-100 transition-colors">+15分</button>
                                        <button type="button" onClick={() => addTime(30)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-100 transition-colors">+30分</button>
                                        <button type="button" onClick={() => addTime(60)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg border border-indigo-100 transition-colors">+60分</button>
                                    </div>
                                </div>
                            </div>

                            {/* 担当者（デモなので固定またはSelect） */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">担当者</label>
                                <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600">
                                    <option>担当者 (未定)</option>
                                    <option>高橋 院長</option>
                                    <option>佐々木 スタッフ</option>
                                </select>
                            </div>


                            {/* 受付メモ・申し送り */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        受付メモ
                                    </label>
                                    <textarea
                                        name="memo"
                                        rows={2}
                                        defaultValue={editingAppointment?.memo || ''}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                        placeholder="患者様からの要望など"
                                    />
                                </div>

                                {/* 申し送り事項（Attention） */}
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-red-700 mb-2">
                                        <AlertTriangle className="w-4 h-4" /> 申し送り事項
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="スタッフ間での注意事項"
                                        className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-red-800 placeholder-red-300 bg-white"
                                    />
                                </div>
                            </div>

                            {/* 送信ボタン */}
                            <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur py-4 border-t border-slate-50 -mx-6 px-6 -mb-6 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    {isSubmitting ? '処理中...' : editingAppointment ? '変更を保存' : '予約を確定'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
