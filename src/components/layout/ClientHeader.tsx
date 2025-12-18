'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlobalNavigation } from '@/components/GlobalNavigation';

export function ClientHeader() {
    const pathname = usePathname();

    // ヘッダーを非表示にするパス
    const isHeaderHidden = pathname?.startsWith('/reservation-v2');

    if (isHeaderHidden) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 flex-none glass-header transition-all duration-300 isolate">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                >
                    <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-indigo-50 text-indigo-600 p-1.5 shadow-sm ring-1 ring-indigo-100 group-hover:scale-105 transition-transform duration-200">
                        <span className="text-lg lg:text-2xl">📓</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg lg:text-2xl tracking-tight text-slate-900 leading-none">
                            <span className="font-medium text-slate-700">Business</span>
                            <span className="font-extrabold text-slate-900 ml-1">Notebook</span>
                        </span>
                    </div>
                </Link>
                <GlobalNavigation />
            </div>
        </header>
    );
}
