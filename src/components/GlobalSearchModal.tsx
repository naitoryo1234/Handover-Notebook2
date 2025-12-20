'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, FileText, Phone, StickyNote, Clock, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { searchPatientsGlobal, GlobalSearchResult } from '@/actions/patientActions';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentCustomers, setRecentCustomers] = useState<Array<{ id: string; name: string; kana: string }>>([]);

    // Load recent customers from localStorage
    useEffect(() => {
        if (isOpen) {
            try {
                const saved = localStorage.getItem('recent_customers');
                if (saved) {
                    setRecentCustomers(JSON.parse(saved));
                }
            } catch {
                // ignore
            }
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await searchPatientsGlobal(query);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Navigate to customer detail
    const handleSelectCustomer = useCallback((customerId: string, customer: { id: string; name: string; kana: string }) => {
        // Save to recent customers
        try {
            const recent = JSON.parse(localStorage.getItem('recent_customers') || '[]');
            const filtered = recent.filter((c: { id: string }) => c.id !== customerId);
            const updated = [{ id: customerId, name: customer.name, kana: customer.kana }, ...filtered].slice(0, 10);
            localStorage.setItem('recent_customers', JSON.stringify(updated));
        } catch {
            // ignore
        }

        onClose();
        router.push(`/customers/${customerId}`);
    }, [onClose, router]);

    // Get icon for hit field
    const getHitIcon = (field: string) => {
        switch (field) {
            case 'name':
            case 'kana':
                return <User className="w-3 h-3" />;
            case 'phone':
                return <Phone className="w-3 h-3" />;
            case 'memo':
                return <StickyNote className="w-3 h-3" />;
            case 'record':
                return <FileText className="w-3 h-3" />;
            default:
                return null;
        }
    };

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] lg:pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden max-h-[70vh] flex flex-col">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="顧客名、電話番号、メモ内容で検索..."
                        className="flex-1 text-base outline-none placeholder:text-slate-400"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                    >
                        キャンセル
                    </button>
                </div>

                {/* Results / Recent */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                        </div>
                    )}

                    {/* Search Results */}
                    {!isLoading && query.length >= 2 && (
                        <div className="p-2">
                            {results.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>「{query}」に一致する顧客が見つかりません</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {results.map((result) => (
                                        <button
                                            key={result.patient.id}
                                            onClick={() => handleSelectCustomer(result.patient.id, {
                                                id: result.patient.id,
                                                name: result.patient.name,
                                                kana: result.patient.kana
                                            })}
                                            className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {result.patient.name}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {result.patient.kana}
                                                    {result.patient.phone && ` • ${result.patient.phone}`}
                                                </div>
                                            </div>
                                            {/* Hits */}
                                            <div className="mt-2 space-y-1">
                                                {result.hits.slice(0, 3).map((hit, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={clsx(
                                                            "flex items-start gap-2 text-xs",
                                                            hit.field === 'record' ? "text-emerald-600" : "text-slate-500"
                                                        )}
                                                    >
                                                        <span className="mt-0.5">{getHitIcon(hit.field)}</span>
                                                        <span className="truncate">
                                                            {hit.date && (
                                                                <span className="text-slate-400 mr-1">[{hit.date}]</span>
                                                            )}
                                                            {hit.preview}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Customers (when no query) */}
                    {!isLoading && query.length < 2 && recentCustomers.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
                                <Clock className="w-3.5 h-3.5" />
                                最近の顧客
                            </div>
                            <div className="space-y-1">
                                {recentCustomers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleSelectCustomer(customer.id, customer)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="font-medium text-slate-900">{customer.name}</div>
                                        <div className="text-xs text-slate-400">{customer.kana}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state (no query, no recent) */}
                    {!isLoading && query.length < 2 && recentCustomers.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>2文字以上で検索を開始します</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
