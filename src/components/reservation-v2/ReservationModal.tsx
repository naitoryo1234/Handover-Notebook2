'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { scheduleAppointment, updateAppointmentAction } from '@/actions/appointmentActions';
import { format, addMinutes, parseISO, addDays, startOfHour } from 'date-fns';
import { Loader2, Search, User, Calendar, Clock, X, Check, AlertTriangle, AlertCircle, Edit3 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ja } from 'date-fns/locale';

interface Patient {
    id: string;
    name: string;
    kana: string;
    pId: number;
}

interface Staff {
    id: string;
    name: string;
}

// 編集時に渡される予約データ
export interface EditingAppointment {
    id: string;
    patientId: string;
    patientName: string;
    patientKana: string;
    pId?: number;
    visitDate: Date;
    duration: number;
    staffId?: string;
    memo?: string;
    adminMemo?: string;
}

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffList: Staff[];
    patients: Patient[]; // 全患者リスト (クライアント検索用)
    initialDate?: string; // yyyy-MM-dd
    editingAppointment?: EditingAppointment | null; // 編集時に渡す
}

const toKatakana = (str: string) => {
    return str.replace(/[\u3041-\u3096]/g, function (match) {
        const chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
    });
};

export function ReservationModal({
    isOpen,
    onClose,
    staffList,
    patients,
    initialDate,
    editingAppointment
}: ReservationModalProps) {
    const isEditMode = !!editingAppointment;
    const [step, setStep] = useState<'input' | 'confirm'>('input');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [visitDate, setVisitDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
    const [visitTime, setVisitTime] = useState('10:00');
    const [duration, setDuration] = useState('60');
    const [staffId, setStaffId] = useState('');
    const [memo, setMemo] = useState('');
    const [adminMemo, setAdminMemo] = useState('');

    // Patient Search State
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 300);

    // 検索結果のフィルタリング
    const filteredPatients = useMemo(() => {
        if (!debouncedQuery) return [];
        const q = debouncedQuery.toLowerCase();
        const qKana = toKatakana(q);
        return patients.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.kana.toLowerCase().includes(q) ||
            p.kana.includes(qKana) ||
            p.pId.toString().includes(q)
        ).slice(0, 5); // 上位5件のみ表示（高さを抑えるため）
    }, [debouncedQuery, patients]);

    // Reset form when opened (新規/編集で分岐)
    useEffect(() => {
        if (isOpen) {
            setStep('input');
            setSearchQuery('');
            setIsSubmitting(false);
            setError('');

            if (editingAppointment) {
                // 編集モード: 既存データをセット
                setSelectedPatient({
                    id: editingAppointment.patientId,
                    name: editingAppointment.patientName,
                    kana: editingAppointment.patientKana,
                    pId: editingAppointment.pId || 0
                });
                setVisitDate(format(new Date(editingAppointment.visitDate), 'yyyy-MM-dd'));
                setVisitTime(format(new Date(editingAppointment.visitDate), 'HH:mm'));
                setDuration(String(editingAppointment.duration || 60));
                setStaffId(editingAppointment.staffId || '');
                setMemo(editingAppointment.memo || '');
                setAdminMemo(editingAppointment.adminMemo || '');
            } else {
                // 新規モード: リセット
                setSelectedPatient(null);
                setVisitDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
                const now = new Date();
                const nextHour = startOfHour(addMinutes(now, 60));
                setVisitTime(format(nextHour, 'HH:mm'));
                setDuration('60');
                setMemo('');
                setAdminMemo('');
                setStaffId('');
            }
        }
    }, [isOpen, initialDate, editingAppointment]);

    // 日付操作ヘルパー
    const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
        const today = new Date();
        if (type === 'today') setVisitDate(format(today, 'yyyy-MM-dd'));
        if (type === 'tomorrow') setVisitDate(format(addDays(today, 1), 'yyyy-MM-dd'));
        if (type === 'nextWeek') setVisitDate(format(addDays(today, 7), 'yyyy-MM-dd'));
    };

    // 時間操作ヘルパー
    const addTime = (minutes: number) => {
        const dateStr = `${visitDate}T${visitTime}`;
        const current = new Date(dateStr);
        if (isNaN(current.getTime())) return;
        const next = addMinutes(current, minutes);
        setVisitTime(format(next, 'HH:mm'));
    };

    const handleSubmit = async () => {
        if (!selectedPatient) return;

        setIsSubmitting(true);
        setError('');

        const formData = new FormData();
        formData.append('visitDate', visitDate);
        formData.append('visitTime', visitTime);
        formData.append('duration', duration);
        // staffIdが空文字の場合も送信（未割り当てに更新するため）
        formData.append('staffId', staffId);
        formData.append('memo', memo);
        formData.append('adminMemo', adminMemo);

        try {
            let result;
            if (isEditMode && editingAppointment) {
                // 編集モード
                formData.append('id', editingAppointment.id);
                result = await updateAppointmentAction(formData);
            } else {
                // 新規作成モード
                formData.append('patientId', selectedPatient.id);
                result = await scheduleAppointment(formData);
            }

            if (result.success) {
                onClose();
            } else {
                setError(result.message || (isEditMode ? '予約の更新に失敗しました' : '予約の作成に失敗しました'));
            }
        } catch (err) {
            setError('エラーが発生しました');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStaffName = (id: string) => staffList.find(s => s.id === id)?.name || '未定';

    // 確認画面へ進む前のバリデーション
    const handleConfirmCheck = () => {
        if (!selectedPatient) {
            setError('お客様を選択してください');
            return;
        }
        if (!visitDate || !visitTime) {
            setError('日時を入力してください');
            return;
        }
        setError('');
        setStep('confirm');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            {/*
                FIX: DialogContentのデフォルトスタイル(中央配置)が固定されているため、モバイルフルスクリーン時は
                top-0 left-0 translate-x-0 translate-y-0 で明示的にリセットする必要があります。
                デスクトップ(md)ではデフォルトの中央配置に戻します。
            */}
            <DialogContent
                showCloseButton={false}
                className="
                    fixed z-50 bg-white gap-0 p-0 duration-200
                    flex flex-col overflow-hidden
                    
                    /* Mobile: Fullscreen & Reset Positioning */
                    inset-0 w-full h-full max-w-none rounded-none border-0
                    top-0 left-0 translate-x-0 translate-y-0
                    data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0
                    data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100

                    /* Desktop: Restore Centered Modal */
                    md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]
                    md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh] 
                    md:rounded-xl md:border md:shadow-lg
                    md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-1/2
                    md:data-[state=open]:zoom-in-95
                "
            >
                {/* ヘッダー */}
                <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex-none bg-white z-10 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        {editingAppointment ? '予約情報の詳細・編集' : '新規予約の作成'}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* スクロール可能なコンテンツエリア */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain">
                    {error && (
                        <div className="mb-4 text-sm font-medium text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {step === 'input' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 md:pb-0">
                            {/* 左カラム: 必須情報 */}
                            <div className="space-y-6">
                                {/* 1. お客様検索 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" /> お客様
                                    </label>

                                    {!selectedPatient ? (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                            <Input
                                                placeholder="名前、カナ、No.で検索..."
                                                className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-emerald-500 focus:border-emerald-500 text-base md:text-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            {/* 検索結果ドロップダウン */}
                                            {searchQuery && filteredPatients.length > 0 && (
                                                <div className="absolute top-12 left-0 right-0 md:left-auto md:right-0 md:w-[320px] bg-white shadow-xl rounded-lg border border-slate-100 z-[100] overflow-hidden">
                                                    {filteredPatients.map(patient => (
                                                        <button
                                                            key={patient.id}
                                                            onClick={() => {
                                                                setSelectedPatient(patient);
                                                                setSearchQuery('');
                                                            }}
                                                            className="w-full text-right p-3 hover:bg-emerald-50 border-b last:border-0 border-slate-50 transition-colors flex flex-row-reverse justify-between items-center group"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-slate-800">{patient.name}</div>
                                                                <div className="text-xs text-slate-500 flex justify-end gap-2">
                                                                    <span className="bg-slate-100 px-1.5 rounded text-slate-600">No.{patient.pId}</span>
                                                                    <span>{patient.kana}</span>
                                                                </div>
                                                            </div>
                                                            <User className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-green-100 p-2 rounded-full text-green-700 flex-shrink-0">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded whitespace-nowrap">選択済み</span>
                                                        <span className="text-xs text-green-600 truncate">No.{selectedPatient.pId}</span>
                                                    </div>
                                                    <div className="font-bold text-lg text-slate-800 truncate">{selectedPatient.name}</div>
                                                    <div className="text-sm text-slate-500 truncate">{selectedPatient.kana}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedPatient(null)}
                                                className="p-2 hover:bg-green-100 rounded-full text-green-600 transition-colors flex-shrink-0"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. 日時・時間 */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-500" /> 日時・時間
                                    </label>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-500 focus:border-emerald-500 text-base md:text-sm"
                                                value={visitDate}
                                                onChange={(e) => setVisitDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="time"
                                                className="h-11 bg-white border-slate-200 flex-1 focus-visible:ring-emerald-500 focus:border-emerald-500 text-base md:text-sm"
                                                value={visitTime}
                                                onChange={(e) => setVisitTime(e.target.value)}
                                            />
                                            <select
                                                className="h-11 px-3 border border-slate-200 rounded-md bg-white text-slate-800 min-w-[100px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-base md:text-sm"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                            >
                                                <option value="30">30分</option>
                                                <option value="60">60分</option>
                                                <option value="90">90分</option>
                                                <option value="120">120分</option>
                                            </select>
                                        </div>

                                        {/* クイックアクション */}
                                        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setQuickDate('today')}>今日</Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setQuickDate('tomorrow')}>明日</Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setQuickDate('nextWeek')}>来週</Button>
                                            </div>
                                            <div className="w-px h-4 bg-slate-200 mx-1 flex-shrink-0"></div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100" onClick={() => addTime(15)}>+15分</Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100" onClick={() => addTime(30)}>+30分</Button>
                                                <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100" onClick={() => addTime(60)}>+60分</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 担当者 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">担当者</label>
                                    <select
                                        className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-base md:text-sm"
                                        value={staffId}
                                        onChange={(e) => setStaffId(e.target.value)}
                                    >
                                        <option value="">担当者 (未定)</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 右カラム: メモ・オプション */}
                            <div className="space-y-6">
                                {/* 受付メモ */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-sm font-bold text-slate-700">受付メモ</label>
                                        <span className="text-xs text-slate-400">※1-2行程度の簡単な内容</span>
                                    </div>
                                    <Textarea
                                        placeholder="患者様からの要望など"
                                        className="min-h-[100px] bg-white border-slate-200 resize-none focus-visible:ring-emerald-500 focus:border-emerald-500 text-base md:text-sm"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                    />
                                </div>

                                {/* 申し送り事項 */}
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                                    <label className="text-sm font-bold text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> 申し送り事項
                                    </label>
                                    <span className="text-xs text-red-400 block -mt-2">スタッフ共有事項を入力（タイムライン強調表示）</span>

                                    <Textarea
                                        placeholder="例: 前回施術後に赤みが出たため注意"
                                        className="min-h-[80px] bg-white border-red-100 focus:border-red-300 resize-none placeholder:text-red-200 text-red-800 focus-visible:ring-red-300 text-base md:text-sm"
                                        value={adminMemo}
                                        onChange={(e) => setAdminMemo(e.target.value)}
                                    />
                                </div>

                                {/* アクションボタン (右カラム下部) */}
                                <div className="pt-4 mt-auto flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm p-4 -mx-4 -mb-4 border-t border-slate-100 md:static md:bg-transparent md:p-0 md:border-0">
                                    <Button variant="ghost" onClick={onClose} className="font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">キャンセル</Button>
                                    <Button
                                        onClick={handleConfirmCheck}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md shadow-emerald-200"
                                    >
                                        確認画面へ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 確認画面
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                            {/* 左カラム: 確認情報 */}
                            <div className="space-y-6">
                                {/* 1. お客様 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" /> お客様
                                    </label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-200 p-2 rounded-full text-slate-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">No.{selectedPatient?.pId}</span>
                                                </div>
                                                <div className="font-bold text-lg text-slate-800">{selectedPatient?.name} 様</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. 日時 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-500" /> 日時・時間
                                    </label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-4 items-center">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="font-bold text-slate-800">{format(parseISO(visitDate), 'yyyy-MM-dd (eee)', { locale: ja })}</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-300"></div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="font-bold text-slate-800">{visitTime}</span>
                                            <span className="text-xs text-slate-500">({duration}分)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 担当者 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">担当者</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-800">
                                        {getStaffName(staffId)}
                                    </div>
                                </div>
                            </div>

                            {/* 右カラム: メモ・ボタン */}
                            <div className="space-y-6 flex flex-col">
                                {/* 受付メモ */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">受付メモ</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[100px] text-sm text-slate-700 whitespace-pre-wrap">
                                        {memo || <span className="text-slate-400">なし</span>}
                                    </div>
                                </div>

                                {/* 申し送り事項 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-red-600 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> 申し送り事項
                                    </label>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 min-h-[80px] text-sm text-red-800 whitespace-pre-wrap">
                                        {adminMemo || <span className="text-red-300">なし</span>}
                                    </div>
                                </div>

                                {/* アクションボタン (確認画面) */}
                                <div className="pt-4 mt-auto flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setStep('input')} disabled={isSubmitting} className="font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                                        戻って修正
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md shadow-emerald-200"
                                    >
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        確定する
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
