'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ListTodo, Home } from 'lucide-react';

interface SidebarContainerProps {
    children?: React.ReactNode;
    calendarContent: React.ReactNode;
    todayListContent?: React.ReactNode;
}

export function SidebarContainer({ calendarContent, todayListContent }: SidebarContainerProps) {
    const [activeTab, setActiveTab] = useState<'calendar' | 'today'>('calendar');

    return (
        <div className="flex flex-col h-full">
            {/* サイドバーヘッダー (ロゴ & ナビゲーション) */}
            <div className="flex-none p-4 border-b border-slate-200">
                <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity group mb-4"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 p-1.5 shadow-sm ring-1 ring-indigo-100 group-hover:scale-105 transition-transform duration-200">
                        <span className="text-lg">📓</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg tracking-tight text-slate-900 leading-none">
                            <span className="font-medium text-slate-700">Business</span>
                            <span className="font-extrabold text-slate-900 ml-1">Notebook</span>
                        </span>
                    </div>
                </Link>

                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-1"
                >
                    <Home className="w-4 h-4" />
                    <span>ホームに戻る</span>
                </Link>
            </div>

            {/* タブヘッダー */}
            <div className="flex items-center border-b border-slate-200 flex-none bg-white z-10">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                        ${activeTab === 'calendar' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                    `}
                >
                    <Calendar className="w-4 h-4" />
                    <span>カレンダー</span>
                    {activeTab === 'calendar' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('today')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                        ${activeTab === 'today' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                    `}
                >
                    <ListTodo className="w-4 h-4" />
                    <span>本日の予定</span>
                    {activeTab === 'today' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'calendar' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {calendarContent}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                        {todayListContent || (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <ListTodo className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">本日の予定リストは準備中です</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
