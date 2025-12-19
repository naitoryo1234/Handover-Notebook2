'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { QuickRecordModal } from '@/components/customer/QuickRecordModal';

export function CustomerNotebookToolbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
                <Mic className="w-5 h-5" />
                <span className="hidden sm:inline">クイック記録</span>
                <span className="sm:hidden">記録</span>
            </button>

            <QuickRecordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
