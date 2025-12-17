import { getPatients, getPatientById } from '@/services/patientService';
import Link from 'next/link';
import { ArrowLeft, Search, Users, ArrowUpRight } from 'lucide-react';
import { CustomerNotebookClient } from './CustomerNotebookClient';

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
                    <form className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="顧客を検索..."
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        />
                        {selectedId && <input type="hidden" name="id" value={selectedId} />}
                    </form>

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
                                        className={`group flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${selectedId === patient.id ? 'bg-indigo-50/60 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'
                                            }`}
                                    >
                                        <Link
                                            href={`/customer-notebook?id=${patient.id}${query ? `&q=${query}` : ''}`}
                                            className="flex-1 min-w-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={`font-medium ${selectedId === patient.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                        {patient.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{patient.kana}</p>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            href={`/customers/${patient.id}`}
                                            className="ml-2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="詳細ページを開く"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                    顧客が見つかりません
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
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center h-full flex flex-col justify-center items-center text-slate-500">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-700 mb-2">顧客を選択してください</h3>
                            <p className="text-sm">
                                左の一覧から顧客を選択すると、<br />ノートを表示・編集できます
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
