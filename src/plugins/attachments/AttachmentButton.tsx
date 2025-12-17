'use client';

import { Camera } from 'lucide-react';

interface AttachmentButtonProps {
    onClick: () => void;
    className?: string;
}

/**
 * A simple button to trigger the attachment modal.
 * Should only be rendered when features.plugins.attachments.enabled is true.
 */
export function AttachmentButton({ onClick, className = '' }: AttachmentButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors ${className}`}
            title="画像を追加"
        >
            <Camera className="w-4 h-4" />
        </button>
    );
}
