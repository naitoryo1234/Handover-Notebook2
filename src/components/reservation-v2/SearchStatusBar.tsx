'use client';

import { ViewMode } from '@/app/reservation-v2/ReservationV2Client';

interface Staff {
    id: string;
    name: string;
}

interface SearchStatusBarProps {
    searchQuery: string;
    selectedStaffId: string;
    staffList: Staff[];
    viewMode: ViewMode;
    showUnassignedOnly: boolean;
    showUnresolvedOnly: boolean;
    resultCount: number;
    onClear: () => void;
}

export function SearchStatusBar({
    searchQuery,
    selectedStaffId,
    staffList,
    viewMode,
    showUnassignedOnly,
    showUnresolvedOnly,
    resultCount,
    onClear
}: SearchStatusBarProps) {
    const getStaffName = (id: string) => {
        const staff = staffList.find(s => s.id === id);
        return staff?.name || id;
    };

    return (
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-emerald-800">
                    🔍 検索条件:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                    {viewMode === 'all' && (
                        <span className="px-2 py-1 bg-white text-emerald-700 text-xs font-medium rounded-md border border-emerald-200">
                            📅 全期間
                        </span>
                    )}
                    {searchQuery && (
                        <span className="px-2 py-1 bg-white text-emerald-700 text-xs font-medium rounded-md border border-emerald-200">
                            🔤 &quot;{searchQuery}&quot;
                        </span>
                    )}
                    {selectedStaffId !== 'all' && (
                        <span className="px-2 py-1 bg-white text-emerald-700 text-xs font-medium rounded-md border border-emerald-200">
                            👤 {getStaffName(selectedStaffId)}
                        </span>
                    )}
                    {showUnassignedOnly && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-md border border-amber-200">
                            担当未定のみ
                        </span>
                    )}
                    {showUnresolvedOnly && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md border border-red-200">
                            申し送りのみ
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-emerald-700">
                    📊 結果: <span className="font-bold">{resultCount}</span>件
                </span>
                <button
                    onClick={onClear}
                    className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline font-medium"
                >
                    条件をクリア
                </button>
            </div>
        </div>
    );
}
