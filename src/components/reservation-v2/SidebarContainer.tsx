'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ListTodo, Home, Users } from 'lucide-react';

interface SidebarContainerProps {
    children?: React.ReactNode;
    calendarContent: React.ReactNode;
    todayListContent?: React.ReactNode;
}

export function SidebarContainer({ calendarContent, todayListContent }: SidebarContainerProps) {
    const [activeTab, setActiveTab] = useState<'calendar' | 'today'>('calendar');

    return (
        <div className="flex flex-col h-full">


            {/* タブヘッダー */}
            <div className="flex items-center border-b border-slate-200 flex-none bg-white z-10">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                        ${activeTab === 'calendar' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                    `}
                >
                    <Calendar className="w-4 h-4" />
                    <span>カレンダー</span>
                    {activeTab === 'calendar' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('today')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                        ${activeTab === 'today' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                    `}
                >
                    <ListTodo className="w-4 h-4" />
                    <span>本日の予定</span>
                    {activeTab === 'today' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                    )}
                </button>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'calendar' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-4">
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
