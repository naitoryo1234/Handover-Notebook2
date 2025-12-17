import { getPatients, getPatientById } from '@/services/patientService';
import Link from 'next/link';
import { Users, FileText } from 'lucide-react';
import { CustomerNotebookClient } from './CustomerNotebookClient';
import { CustomerNotebookSearch } from './CustomerNotebookSearch';
import { EmptyState, EmptyStateSearch } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ id?: string; q?: string }>;
}

export default async function CustomerNotebookPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = params.q || '';
    const selectedId = params.id;

    const patients = await getPatients(query);
    const selectedPatient = selectedId ? await getPatientById(selectedId) : null;

    return (
        <div className="space-y-6">


            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左カラム: 顧客検索・一覧 */}
                {/* モバイル: 顧客選択時は非表示 (PCは常に表示) */}
                <div className={`lg:col-span-1 space-y-4 ${selectedId ? 'hidden lg:block' : 'block'}`}>
                    {/* 検索 */}
                    <CustomerNotebookSearch />

                    {/* 顧客一覧 */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">顧客一覧</span>
                            <span className="text-xs text-slate-400 ml-auto">{patients.length}名</span>
                        </div>
                        <div className="max-h-[calc(100vh-280px)] lg:max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                            {patients.length > 0 ? (
                                patients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className={`group flex items-center justify-between pl-4 pr-2 py-2 hover:bg-slate-50 transition-colors ${selectedId === patient.id ? 'bg-indigo-50/60 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'
                                            }`}
                                    >
                                        <Link
                                            href={`/customers/${patient.id}`}
                                            className="flex-1 min-w-0 py-1"
                                        >
                                            <div>
                                                <p className={`font-medium ${selectedId === patient.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                    {patient.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{patient.kana}</p>
                                            </div>
                                        </Link>

                                        <Link
                                            href={`/customer-notebook?id=${patient.id}${query ? `&q=${query}` : ''}`}
                                            className={`p-2 rounded-lg transition-colors ${selectedId === patient.id
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                            title="ノートを開く"
                                        >
                                            <FileText className="w-5 h-5" />
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2">
                                    <EmptyStateSearch theme="indigo" query={query || undefined} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 右カラム: Pinned Note */}
                {/* モバイル: 顧客未選択時は非表示 (PCは常に表示) */}
                <div className={`lg:col-span-2 ${!selectedId ? 'hidden lg:block' : 'block'}`}>
                    {selectedPatient ? (
                        <CustomerNotebookClient patient={selectedPatient} />
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 h-full flex items-center justify-center min-h-[300px]">
                            <EmptyState
                                icon={<Users className="w-full h-full" />}
                                title="顧客を選択してください"
                                description="左の一覧から顧客を選択すると、ノートを表示・編集できます"
                                theme="indigo"
                                size="lg"
                            />
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
