'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MemoData {
    id: string;
    date: Date;
    content: string;
    type: 'memo' | 'record' | 'image';
}

interface MemosClientProps {
    memos: MemoData[];
}

type FilterType = 'all' | 'memo' | 'record';

export function MemosClient({ memos }: MemosClientProps) {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredMemos = filter === 'all'
        ? memos
        : memos.filter(m => m.type === filter);

    const memoCount = memos.filter(m => m.type === 'memo').length;
    const recordCount = memos.filter(m => m.type === 'record').length;

    return (
        <div>
            {/* フィルター */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    すべて ({memos.length})
                </button>
                <button
                    onClick={() => setFilter('memo')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'memo'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    メモ ({memoCount})
                </button>
                <button
                    onClick={() => setFilter('record')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'record'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    記録 ({recordCount})
                </button>
            </div>

            {/* メモ一覧 */}
            {filteredMemos.length > 0 ? (
                <div className="space-y-4">
                    {filteredMemos.map((memo) => (
                        <div key={memo.id} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="text-xs text-slate-400 mb-2">
                                {format(new Date(memo.date), 'yyyy年M月d日 HH:mm', { locale: ja })}
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {memo.content}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">該当する履歴がありません</p>
                </div>
            )}
        </div>
    );
}
