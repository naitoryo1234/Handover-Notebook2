import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { CustomerDetailClient } from './CustomerDetailClient';
import { TimelineEntry } from '@/components/timeline/TimelineItem';
import { ClinicalRecord } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getPatient(id: string) {
    const patient = await prisma.patient.findUnique({
        where: { id },
    });
    return patient;
}

async function getTimeline(patientId: string): Promise<{ entries: TimelineEntry[], hasMore: boolean, total: number }> {
    const [appointments, records] = await Promise.all([
        prisma.appointment.findMany({
            where: { patientId },
            orderBy: { startAt: 'desc' },
            include: { staff: true }
        }),
        prisma.clinicalRecord.findMany({
            where: { patientId },
            orderBy: { visitDate: 'desc' },
            include: { attachments: true }
        })
    ]);

    const timeline: TimelineEntry[] = [
        ...appointments.map(a => ({
            id: a.id,
            date: a.startAt,
            type: 'appointment' as const,
            content: `アポイントメント: ${getStatusText(a.status)}`,
            subContent: a.memo || undefined,
            status: a.status,
            adminMemo: a.adminMemo || undefined,
            staffName: a.staff?.name || undefined,
            duration: a.duration
        })),
        ...records.map(r => {
            // Check metadata for 'memo' type
            let type: 'record' | 'memo' | 'image' = 'record';
            let flags: string[] = [];
            try {
                const meta = JSON.parse(r.metadata || '{}');
                if (meta.type === 'memo') type = 'memo';
                if (meta.type === 'image') type = 'image';
                if (Array.isArray(meta.flags)) flags = meta.flags;
            } catch {
                // ignore
            }

            return {
                id: r.id,
                date: r.visitDate,
                type: type,
                content: r.subjective || toContent(r), // Use subjective or summarized content
                subContent: type === 'record' ? '施術記録' : undefined,
                flags: flags,
                images: r.attachments.map(a => a.storageKey)
            };
        })
    ];

    // Sort by date desc
    const sorted = timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
    const initialLimit = 50; // Default initial display count
    const initial = sorted.slice(0, initialLimit);

    return {
        entries: initial,
        hasMore: sorted.length > initialLimit,
        total: sorted.length
    };
}

function getStatusText(status: string) {
    switch (status) {
        case 'scheduled': return '予定';
        case 'completed': return '完了';
        case 'cancelled': return 'キャンセル';
        case 'arrived': return '来店中';
        default: return status;
    }
}

function toContent(record: ClinicalRecord) {
    // For normal records, summarize SOAP or use S
    if (record.subjective) return `主訴: ${record.subjective}`;
    if (record.assessment) return `施術: ${record.assessment}`;
    return '記録あり';
}

export default async function CustomerDetailPage({ params }: PageProps) {
    const { id } = await params;
    const patient = await getPatient(id);

    if (!patient) {
        notFound();
    }

    const timelineData = await getTimeline(id);

    return (
        <CustomerDetailClient
            patient={patient}
            initialTimeline={timelineData.entries}
            initialHasMore={timelineData.hasMore}
            initialTotal={timelineData.total}
        />
    );
}
