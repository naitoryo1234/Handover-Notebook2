import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, StickyNote } from 'lucide-react';
import { MemosClient } from './MemosClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomerMemosPage({ params }: PageProps) {
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
        where: { id },
        select: { id: true, name: true, kana: true }
    });

    if (!patient) {
        notFound();
    }

    // メモ記録を取得
    const records = await prisma.clinicalRecord.findMany({
        where: { patientId: id },
        orderBy: { visitDate: 'desc' },
        take: 100,
    });

    // メタデータからタイプを取得
    const memos = records.map(record => {
        let type: 'memo' | 'record' | 'image' = 'record';
        try {
            const meta = JSON.parse(record.metadata || '{}');
            if (meta.type === 'memo') type = 'memo';
            if (meta.type === 'image') type = 'image';
        } catch {
            // ignore
        }

        return {
            id: record.id,
            date: record.visitDate,
            content: record.subjective || '(内容なし)',
            type,
        };
    });

    return (
        <div className="max-w-3xl mx-auto py-6 px-4">
            {/* ヘッダー */}
            <div className="mb-6">
                <Link
                    href={`/customers/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {patient.name} 様のページに戻る
                </Link>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <StickyNote className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            メモ履歴
                        </h1>
                        <p className="text-sm text-slate-500">
                            {patient.name} 様
                        </p>
                    </div>
                </div>
            </div>

            {/* クライアントコンポーネント */}
            <MemosClient memos={memos} />
        </div>
    );
}
