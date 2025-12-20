import { getTodaysAppointments, findAllAppointments } from '@/services/appointmentServiceV2';
import { prisma } from '@/lib/db';
import { ReservationV2Client } from './ReservationV2Client';
import { getNow } from '@/lib/dateUtils';

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function ReservationV2Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const dateParam = params.date;

    // 日付パラメータがあればその日、なければ今日
    const targetDate = dateParam ? new Date(dateParam) : getNow();

    // 今日の予約を取得
    const appointments = await getTodaysAppointments(targetDate);

    // 全予約も取得（過去含む場合用）
    const allAppointments = await findAllAppointments({ includePast: true, includeCancelled: true });

    // スタッフ一覧を取得
    const staffList = await prisma.staff.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // 患者一覧を取得（検索用）
    const patients = await prisma.patient.findMany({
        select: { id: true, name: true, kana: true, pId: true },
        orderBy: { kana: 'asc' }
    });

    // 統計情報
    const stats = {
        total: appointments.length,
        unassigned: appointments.filter(a => !a.staffId).length,
        unresolvedMemos: appointments.filter(a => a.adminMemo && !a.isMemoResolved).length
    };

    // DateオブジェクトをシリアライズしてClient Componentに渡す
    const initialAppointments = JSON.parse(JSON.stringify(appointments));
    const serializedAllAppointments = JSON.parse(JSON.stringify(allAppointments));

    return (
        <div className="h-full bg-slate-50">
            <ReservationV2Client
                initialAppointments={initialAppointments}
                allAppointments={serializedAllAppointments}
                staffList={staffList}
                patients={patients}
                currentDate={targetDate.toISOString()}
                stats={stats}
            />
        </div>
    );
}
