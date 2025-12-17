'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMinutes, addDays, addWeeks } from 'date-fns';
import { Clock, User, Plus, Edit3, X, Ban, AlertTriangle, CheckCircle, LogIn, Trash2, Info } from 'lucide-react';
import { Appointment } from '@/services/appointmentServiceV2';
import { cancelAppointmentAction, scheduleAppointment, updateAppointmentAction, checkInAppointmentAction, completeAppointmentAction, undoAppointmentStatusAction } from '@/actions/appointmentActions';
import { CustomerSelector } from '@/components/appointment/CustomerSelector';
import { EmptyStateReservations } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

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

    // New States
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: '',
    });
    const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; appointmentId: string | null }>({
        isOpen: false,
        appointmentId: null,
    });

    const { showUndoToast } = useToast();
    const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);

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

    // モーダルが閉じたときに確認モードをリセット
    useEffect(() => {
        if (!isModalOpen) {
            setIsConfirming(false);
        }
    }, [isModalOpen]);

    const handleCheckIn = async (appointmentId: string) => {
        try {
            await checkInAppointmentAction(appointmentId);
            showUndoToast('チェックインしました', async () => {
                await undoAppointmentStatusAction(appointmentId, 'scheduled');
            });
            router.refresh();
        } catch (error) {
            console.error('Failed to check in:', error);
        }
    };

    const handleComplete = async (appointmentId: string) => {
        try {
            await completeAppointmentAction(appointmentId);
            showUndoToast('施術を完了しました', async () => {
                await undoAppointmentStatusAction(appointmentId, 'arrived');
            });
            router.refresh();
        } catch (error) {
            console.error('Failed to complete:', error);
        }
    };

    // Confirm Step (Local Validation)
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedPatientId) {
            setErrorDialog({ isOpen: true, title: '入力エラー', message: '顧客を選択してください' });
            return;
        }

        // 基本的なバリデーションを通過したら確認画面へ
        setIsConfirming(true);
    };

    // Actual Submission
    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const form = document.querySelector('form') as HTMLFormElement; // Re-grab form data from the DOM (hidden inputs or state usage needed if visual form is gone)
        // Wait, if the form is replaced by confirmation view, we can't grab it from DOM unless we kept the data in state or hidden fields.
        // We have state: selectedPatientId, formDate, formTime.
        // We lack: duration, staffId, memo, adminMemo.
        // Solution: Keep the form mounted but hidden? Or better, use FormData constructed from State references if we controlled everything.
        // Currently memos are uncontrolled. Let's make sure we capture them before switching to confirm view.
        // OR: Simpler approach, keep "isConfirming" logic inside the form rendering, so inputs are still there but readonly? No, layouts change.

        // Let's rely on controlled inputs for everything OR just hide the input fields with CSS instead of unmounting.
        // For simplicity and robustness with unmounting: Let's capture ALL form data into a Ref or State when `handleSubmit` runs.
        // Let's use State to hold draft data for "Confirmation View".
    };

    // Instead of complex refactoring to fully controlled components for memos, 
    // let's grab the data in handleSubmit and store it in a temporary state object `draftData`.
    const [draftData, setDraftData] = useState<any>(null);

    const handlePreSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (!selectedPatientId) {
            setErrorDialog({ isOpen: true, title: '入力エラー', message: '顧客を選択してください' });
            return;
        }

        const data = {
            patientId: selectedPatientId,
            visitDate: formDate,
            visitTime: formTime,
            duration: formData.get('duration'),
            staffId: formData.get('staffId'),
            memo: formData.get('memo'),
            adminMemo: formData.get('adminMemo'),
            id: editingAppointment?.id // for update
        };
        setDraftData(data);
        setIsConfirming(true);
    };

    const executeFinalSubmit = async () => {
        if (!draftData) return;
        setIsSubmitting(true);

        const formData = new FormData();
        Object.entries(draftData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.set(key, value as string);
            }
        });

        try {
            let result;
            if (editingAppointment) {
                result = await updateAppointmentAction(formData);
            } else {
                result = await scheduleAppointment(formData);
            }

            if (!result.success) {
                setErrorDialog({ isOpen: true, title: '予約保存エラー', message: result.message || '予約の保存に失敗しました' });
                setIsSubmitting(false);
                return;
            }

            setIsModalOpen(false);
            setEditingAppointment(null);
            setIsConfirming(false);
            setDraftData(null);
            setIsSubmitting(false);
            // router.refresh(); // Server Action handles revalidation
        } catch (error) {
            console.error('Failed to save appointment:', error);
            setErrorDialog({ isOpen: true, title: 'システムエラー', message: '予期せぬエラーが発生しました。' });
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = (appointmentId: string) => {
        setCancelDialog({ isOpen: true, appointmentId });
    };

    const executeCancel = async () => {
        if (!cancelDialog.appointmentId) return;
        try {
            await cancelAppointmentAction(cancelDialog.appointmentId);
            router.refresh(); // Server action usually revalidates, but we can keep this or rely on revalidatePath
        } catch (error) {
            console.error('Failed to cancel appointment:', error);
            setErrorDialog({ isOpen: true, title: 'キャンセルエラー', message: '予約のキャンセルに失敗しました' });
        }
    };

    const handleEdit = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
        setIsSubmitting(false);
    };

    const handleNewAppointment = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
        setIsSubmitting(false);
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

    // Helper to get staff name from ID (Hardcoded for demo mostly, but let's try to match)
    const getStaffName = (id: any) => {
        if (id === 'staff-001') return '高橋 院長';
        if (id === 'staff-002') return '佐々木 スタッフ';
        return '未定';
    };

    const getPatientName = (id: string) => {
        const p = patients.find(pat => pat.id === id);
        return p ? p.name : '未選択';
    };

    return (
        <>
            {/* Error Dialog */}
            <ConfirmDialog
                open={errorDialog.isOpen}
                onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, isOpen: open }))}
                title={errorDialog.title}
                description={errorDialog.message}
                confirmLabel="閉じる"
                variant="error"
                hideCancel={true}
                onConfirm={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Cancel Confirmation Dialog */}
            <ConfirmDialog
                open={cancelDialog.isOpen}
                onOpenChange={(open) => setCancelDialog(prev => ({ ...prev, isOpen: open }))}
                title="予約キャンセル"
                description="本当にこの予約をキャンセルしますか？この操作は取り消せません。"
                confirmLabel="キャンセルする"
                variant="danger"
                onConfirm={executeCancel}
            />

            {/* ... (Add New Appointment Button & List - Existing Code) */}

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
                            className="px-6 py-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                            onClick={() => setSelectedAppointmentForDetail(appointment)}
                        >
                            {/* ... Existing List Item ... */}
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

                                    {/* Action Buttons for Mobile/Quick Access */}
                                    <div className="flex items-center gap-3 mt-3">
                                        {appointment.status === 'scheduled' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCheckIn(appointment.id);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                チェックイン
                                            </button>
                                        )}
                                        {appointment.status === 'arrived' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleComplete(appointment.id);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                完了にする
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(appointment);
                                        }}
                                        className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                        title="編集"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelClick(appointment.id);
                                        }}
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg md:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">
                                {isConfirming
                                    ? '予約内容の確認'
                                    : (editingAppointment ? '予約を編集' : '新規予約を作成')
                                }
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingAppointment(null);
                                    setIsConfirming(false);
                                    setDraftData(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isConfirming ? (
                            // --- 入力フォーム ---
                            <form onSubmit={handlePreSubmit} className="p-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
                                    {/* 左カラム: 顧客・日時 */}
                                    <div className="space-y-6">
                                        {/* 顧客選択 */}
                                        <div className="space-y-2">
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
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <Clock className="w-4 h-4" /> 日時・時間
                                            </label>
                                            <div className="grid grid-cols-[1.5fr,1fr,1fr] gap-2">
                                                <input
                                                    type="date"
                                                    name="visitDate"
                                                    required
                                                    value={formDate}
                                                    onChange={(e) => setFormDate(e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 text-sm"
                                                />
                                                <input
                                                    type="time"
                                                    name="visitTime"
                                                    required
                                                    value={formTime}
                                                    onChange={(e) => setFormTime(e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 text-sm"
                                                />
                                                <select
                                                    name="duration"
                                                    defaultValue={editingAppointment?.duration || 60}
                                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 text-sm bg-white"
                                                >
                                                    <option value="30">30分</option>
                                                    <option value="60">60分</option>
                                                    <option value="90">90分</option>
                                                    <option value="120">120分</option>
                                                </select>
                                            </div>
                                            {/* クイックボタン */}
                                            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button type="button" onClick={() => setQuickDate('today')} className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors">今日</button>
                                                    <button type="button" onClick={() => setQuickDate('tomorrow')} className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors">明日</button>
                                                    <button type="button" onClick={() => setQuickDate('nextWeek')} className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors">来週</button>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button type="button" onClick={() => addTime(15)} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-md border border-indigo-100 transition-colors">+15分</button>
                                                    <button type="button" onClick={() => addTime(30)} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-md border border-indigo-100 transition-colors">+30分</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 担当者 */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">担当者</label>
                                            <select
                                                name="staffId"
                                                defaultValue={editingAppointment?.staffId || ''}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm"
                                            >
                                                <option value="">担当者 (未定)</option>
                                                <option value="staff-001">高橋 院長</option>
                                                <option value="staff-002">佐々木 スタッフ</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 右カラム: メモ・申し送り・アクションボタン */}
                                    <div className="space-y-6 flex flex-col h-full">
                                        {/* 受付メモ */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                                受付メモ
                                            </label>
                                            <p className="text-[10px] text-slate-400 mb-1">※1-2行程度の簡単な内容</p>
                                            <textarea
                                                name="memo"
                                                rows={2}
                                                defaultValue={editingAppointment?.memo || ''}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                                                placeholder="患者様からの要望など"
                                            />
                                        </div>

                                        {/* 申し送り事項 */}
                                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 h-fit flex-grow">
                                            <label className="flex items-center gap-2 text-sm font-bold text-red-700 mb-1">
                                                <AlertTriangle className="w-4 h-4" /> 申し送り事項
                                            </label>
                                            <p className="text-[10px] text-red-400 mb-2 leading-tight">
                                                スタッフ共有事項を入力 (タイムライン強調表示)
                                            </p>
                                            <textarea
                                                name="adminMemo"
                                                rows={2}
                                                defaultValue={editingAppointment?.adminMemo || ''}
                                                placeholder="例: 前回施術後に赤みが出たため注意"
                                                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-red-800 placeholder-red-300 bg-white resize-none text-sm"
                                            />
                                        </div>

                                        {/* PC用アクションボタン（右カラム下部） */}
                                        <div className="hidden md:flex items-center justify-end gap-3 mt-auto pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors text-sm"
                                            >
                                                キャンセル
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md shadow-indigo-100 text-sm"
                                            >
                                                確認画面へ
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* モバイル用アクションボタン（下部固定） */}
                                <div className="md:hidden mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur -mx-6 px-6 -mb-6 pb-6 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        確認画面へ
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // --- 確認画面 (Read-only + Confirm) ---
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="space-y-8">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                                        <h4 className="text-indigo-900 font-bold text-sm mb-1">
                                            以下の内容で予約を確定しますか？
                                        </h4>
                                        <p className="text-indigo-600 text-xs">
                                            内容に間違いがないかご確認ください。
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1">お客様</label>
                                                <div className="text-lg font-bold text-slate-900">
                                                    {getPatientName(selectedPatientId)} 様
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1">予約日</label>
                                                    <div className="text-lg font-bold text-slate-900 font-mono">
                                                        {draftData?.visitDate}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-1">時間</label>
                                                    <div className="text-lg font-bold text-slate-900 font-mono flex items-baseline gap-2">
                                                        {draftData?.visitTime}
                                                        <span className="text-sm text-slate-500 font-normal">
                                                            ({draftData?.duration}分)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1">担当者</label>
                                                <div className="text-base font-medium text-slate-900">
                                                    {getStaffName(draftData?.staffId)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1">受付メモ</label>
                                                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 min-h-[60px]">
                                                    {draftData?.memo || <span className="text-slate-400 italic">なし</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-red-300 mb-1">申し送り事項</label>
                                                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800 border border-red-100 min-h-[60px]">
                                                    {draftData?.adminMemo || <span className="text-red-300 italic">なし</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur -mx-6 px-6 -mb-6 pb-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirming(false)}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        戻って修正
                                    </button>
                                    <button
                                        type="button"
                                        onClick={executeFinalSubmit}
                                        disabled={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        {isSubmitting ? '処理中...' : '確定する'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div >
                </div >
            )}

            {/* Same BottomSheet code... */}
            <BottomSheet
                isOpen={!!selectedAppointmentForDetail}
                onClose={() => setSelectedAppointmentForDetail(null)}
                title="予約詳細"
            >
                {/* ... (Existing BottomSheet Content) ... */}
                {selectedAppointmentForDetail && (
                    <div className="space-y-6 pb-6">
                        {/* 顧客情報 */}
                        <div className="space-y-1">
                            <div className="text-sm text-slate-500 font-bold">お客様</div>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold text-slate-900">
                                    {selectedAppointmentForDetail.patientName} <span className="text-sm font-normal text-slate-500">様</span>
                                </div>
                                <Link
                                    href={`/customers/${selectedAppointmentForDetail.patientId}`}
                                    className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    カルテを開く <User className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">ID: {selectedAppointmentForDetail.patientId}</div>
                        </div>

                        {/* 予約情報 */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <div className="text-xs text-slate-500 font-bold mb-1">日時</div>
                                <div className="font-bold text-slate-800 text-lg">
                                    {format(new Date(selectedAppointmentForDetail.visitDate), 'MM/dd')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-bold mb-1">時間</div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="font-bold text-slate-800 text-lg font-mono">
                                        {format(new Date(selectedAppointmentForDetail.visitDate), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        ({selectedAppointmentForDetail.duration}min)
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-xs text-slate-500 font-bold mb-1">現在のステータス</div>
                                <div>{getStatusBadge(selectedAppointmentForDetail.status)}</div>
                            </div>
                        </div>

                        {/* メモ */}
                        {selectedAppointmentForDetail.memo && (
                            <div className="space-y-1">
                                <div className="text-sm text-slate-500 font-bold">受付メモ</div>
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-slate-700 text-sm">
                                    {selectedAppointmentForDetail.memo}
                                </div>
                            </div>
                        )}

                        {/* アクション */}
                        <div className="pt-4 space-y-3">
                            {selectedAppointmentForDetail.status === 'scheduled' && (
                                <button
                                    onClick={() => {
                                        handleCheckIn(selectedAppointmentForDetail.id);
                                        setSelectedAppointmentForDetail(null);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                                >
                                    <LogIn className="w-5 h-5" />
                                    チェックインする
                                </button>
                            )}
                            {selectedAppointmentForDetail.status === 'arrived' && (
                                <button
                                    onClick={() => {
                                        handleComplete(selectedAppointmentForDetail.id);
                                        setSelectedAppointmentForDetail(null);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    施術を完了する
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        handleEdit(selectedAppointmentForDetail);
                                        setSelectedAppointmentForDetail(null);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" /> 編集
                                </button>
                                <button
                                    onClick={() => {
                                        handleCancelClick(selectedAppointmentForDetail.id);
                                        setSelectedAppointmentForDetail(null);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
                                >
                                    <Ban className="w-4 h-4" /> キャンセル
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </>
    );
}
