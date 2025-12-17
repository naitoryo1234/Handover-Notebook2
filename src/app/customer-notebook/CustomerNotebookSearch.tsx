'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, FormEvent, useRef, useEffect } from 'react';

export function CustomerNotebookSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync input with URL on mount and when URL changes externally
    useEffect(() => {
        if (inputRef.current) {
            const urlValue = searchParams.get('q') || '';
            if (inputRef.current.value !== urlValue) {
                inputRef.current.value = urlValue;
            }
        }
    }, [searchParams]);

    const handleInput = (e: FormEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the URL update
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (newValue) {
                params.set('q', newValue);
            } else {
                params.delete('q');
            }
            // Keep id param if present
            const id = searchParams.get('id');
            if (id) {
                params.set('id', id);
            }

            startTransition(() => {
                router.replace(`/customer-notebook?${params.toString()}`);
            });
        }, 300);
    };

    return (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                ref={inputRef}
                type="text"
                defaultValue={searchParams.get('q') || ''}
                onInput={handleInput}
                placeholder="顧客を検索..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-shadow"
            />
            {isPending && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}

