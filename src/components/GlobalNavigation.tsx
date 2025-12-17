'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Calendar, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export function GlobalNavigation() {
    const pathname = usePathname();

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
            href: '/reservation-notebook',
            icon: Calendar,
            colorClass: 'text-emerald-600',
            activeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        },
    ];

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
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
            </nav>

            {/* Mobile Navigation Toggle */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="メニューを開く"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Navigation Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in"
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

                        <div className="mt-auto pt-8 border-t border-slate-100">
                            <p className="text-xs text-center text-slate-400">
                                &copy; Business Notebook
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
