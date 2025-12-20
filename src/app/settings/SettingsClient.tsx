'use client';

import { useState } from 'react';
import { Staff } from '@prisma/client';
import { Settings, Users, Cpu, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { StaffList } from '@/components/settings/StaffList';
import { PresetSelector } from '@/components/settings/PresetSelector';

interface SettingsClientProps {
    initialStaff: Staff[];
    initialPreset: string;
}

type TabType = 'staff' | 'system';

export function SettingsClient({ initialStaff, initialPreset }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('staff');
    const [staff, setStaff] = useState(initialStaff);

    const tabs = [
        { id: 'staff' as const, label: 'スタッフ管理', icon: Users },
        { id: 'system' as const, label: 'システム設定', icon: Cpu },
    ];

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Settings className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">設定</h1>
                        <p className="text-sm text-slate-500">スタッフ管理・システム設定</p>
                    </div>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <Home className="w-4 h-4" />
                    ホーム
                </Link>
            </div>

            {/* タブ */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* タブコンテンツ */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === 'staff' && (
                    <StaffList staff={staff} onStaffChange={setStaff} />
                )}
                {activeTab === 'system' && (
                    <PresetSelector initialPreset={initialPreset} />
                )}
            </div>
        </div>
    );
}
