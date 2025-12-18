'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Calendar, Menu, X, Search, LogOut, User } from 'lucide-react';
import { clsx } from 'clsx';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useSession, signOut } from 'next-auth/react';

export function GlobalNavigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // For portal - ensure we only render portal on client
    useEffect(() => {
        setMounted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navItems = [
        {
            name: 'ホーム',
            href: '/',
            icon: Home,
            colorClass: 'text-slate-600',
            activeClass: 'bg-slate-100 text-slate-900',
        },
        {
            name: 'Customer Notebook',
            href: '/customer-notebook',
            icon: FileText,
            colorClass: 'text-indigo-600',
            activeClass: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
        },
        {
            name: 'Reservation Notebook',
            href: '/reservation-v2',
            icon: Calendar,
            colorClass: 'text-emerald-600',
            activeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        },
    ];

    // Drawer content - will be portaled to body
    const drawerContent = isOpen && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden">
            {/* Backdrop - Fully opaque */}
            <div
                className="absolute inset-0 bg-black animate-in fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer Content */}
            <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-lg text-slate-900">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search in Drawer */}
                <button
                    onClick={() => {
                        setIsOpen(false);
                        setIsSearchOpen(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 transition-all duration-200 mb-3"
                >
                    <Search className="w-5 h-5 text-slate-400" />
                    <span>検索</span>
                </button>

                <nav className="flex flex-col gap-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                                    isActive
                                        ? item.activeClass
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", isActive ? "current-color" : item.colorClass)} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info in Drawer */}
                {session?.user && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600">
                            <User className="w-5 h-5 text-slate-400" />
                            <span className="font-medium">{session.user.name}</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut({ callbackUrl: '/login' });
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>ログアウト</span>
                        </button>
                    </div>
                )}

                <div className="mt-auto pt-8 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400">
                        &copy; Business Notebook
                    </p>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
                {/* Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 border border-slate-200 mr-4 min-w-[140px]"
                    title="検索 (Ctrl+K)"
                >
                    <Search className="w-4 h-4" />
                    <span className="text-slate-400">検索...</span>
                    <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded ml-auto">
                        ⌘K
                    </kbd>
                </button>

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent",
                                isActive
                                    ? item.activeClass
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon className={clsx("w-4 h-4", isActive ? "current-color" : item.colorClass)} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}

                {/* User Info & Logout */}
                {session?.user && (
                    <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{session.user.name}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            title="ログアウト"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden xl:inline">ログアウト</span>
                        </button>
                    </div>
                )}
            </nav>

            {/* Mobile Navigation - Search + Menu */}
            <div className="flex items-center gap-1 lg:hidden">
                {/* Mobile Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="検索"
                >
                    <Search className="w-6 h-6" />
                </button>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="メニューを開く"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Drawer - Rendered via Portal to body */}
            {drawerContent}

            {/* Global Search Modal */}
            <GlobalSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}

