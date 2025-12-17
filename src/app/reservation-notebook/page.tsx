import { getTodaysAppointments } from '@/services/appointmentService';
import { getPatients } from '@/services/patientService';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { ReservationNotebookClient } from './ReservationNotebookClient';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getNow } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export default async function ReservationNotebookPage() {
    const now = getNow();
    const todaysAppointments = await getTodaysAppointments(now);
    const patients = await getPatients('');

    // 予約がある患者をフィルタリング
    const activeAppointments = todaysAppointments.filter(a => a.status !== 'cancelled');

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
                        {format(now, 'yyyy年M月d日（E）', { locale: ja })}
                    </p>
                </div>
            </div>

            {/* 今日の予約一覧 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">今日の予約</h2>
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
                    currentDate={now.toISOString()}
                />
            </div>
        </div>
    );
}
