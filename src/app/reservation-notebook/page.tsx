import { getTodaysAppointments } from '@/services/appointmentServiceV2';
import { getPatients } from '@/services/patientService';
import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReservationNotebookClient } from './ReservationNotebookClient';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getNow } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function ReservationNotebookPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const now = getNow();

    // URLパラメータから日付を取得、なければ今日
    let targetDate: Date;
    if (params.date) {
        try {
            targetDate = parseISO(params.date);
        } catch {
            targetDate = now;
        }
    } else {
        targetDate = now;
    }

    const todaysAppointments = await getTodaysAppointments(targetDate);
    const patients = await getPatients('');

    // 予約がある患者をフィルタリング
    const activeAppointments = todaysAppointments.filter(a => a.status !== 'cancelled');

    // ナビゲーション用の日付
    const prevDate = format(subDays(targetDate, 1), 'yyyy-MM-dd');
    const nextDate = format(addDays(targetDate, 1), 'yyyy-MM-dd');
    const todayStr = format(now, 'yyyy-MM-dd');
    const isTodaySelected = isToday(targetDate);

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Reservation Notebook</h1>
                    <p className="text-sm text-slate-500">
                        {format(targetDate, 'yyyy年M月d日（E）', { locale: ja })}
                        {isTodaySelected && <span className="ml-2 text-emerald-600 font-bold">今日</span>}
                    </p>
                </div>
            </div>

            {/* 日付ナビゲーション */}
            <div className="flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
                <Link
                    href={`/reservation-notebook?date=${prevDate}`}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    前日
                </Link>

                {!isTodaySelected && (
                    <Link
                        href={`/reservation-notebook?date=${todayStr}`}
                        className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg transition-colors"
                    >
                        今日に戻る
                    </Link>
                )}

                <Link
                    href={`/reservation-notebook?date=${nextDate}`}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                    翌日
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* 予約一覧 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {isTodaySelected ? '今日の予約' : format(targetDate, 'M月d日', { locale: ja }) + 'の予約'}
                            </h2>
                            <p className="text-xs text-slate-500">{activeAppointments.length}件</p>
                        </div>
                    </div>
                </div>

                <ReservationNotebookClient
                    initialAppointments={todaysAppointments}
                    patients={patients.map(p => ({
                        id: p.id,
                        name: p.name,
                        kana: p.kana,
                        pId: p.pId
                    }))}
                    currentDate={targetDate.toISOString()}
                />
            </div>
        </div>
    );
}
