'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
    const [isVisible, setIsVisible] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Delay hiding for animation
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Content */}
            <div
                ref={contentRef}
                className={`relative w-full max-w-lg bg-white shadow-2xl pointer-events-auto flex flex-col max-h-[80vh] sm:max-h-[90vh] sm:my-auto mb-0 mt-auto transition-transform duration-300 ease-out sm:rounded-2xl rounded-t-2xl ${isOpen ? 'translate-y-0 sm:scale-100 opacity-100' : 'translate-y-full sm:scale-95 opacity-0'
                    }`}
            >
                {/* Drag Handle (Mobile only) */}
                <div className="sm:hidden w-full pt-3 pb-2 flex justify-center flex-shrink-0" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div>
                        {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="overflow-y-auto overscroll-contain p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
