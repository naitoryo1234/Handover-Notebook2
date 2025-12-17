'use client';

import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { deleteAttachmentAction } from './attachmentActions';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Attachment {
    id: string;
    storageKey: string;
    fileType: string;
    createdAt: Date;
}

interface AttachmentGalleryProps {
    attachments: Attachment[];
    patientId: string;
    onDelete?: () => void;
}

export function AttachmentGallery({ attachments, patientId, onDelete }: AttachmentGalleryProps) {
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
    const { showToast } = useToast();

    if (attachments.length === 0) return null;

    const handleDelete = async () => {
        const result = await deleteAttachmentAction(deleteConfirm.id, patientId);
        if (result.success) {
            showToast('画像を削除しました', 'success');
            onDelete?.();
        } else {
            showToast(result.message || '削除に失敗しました', 'error');
        }
    };

    return (
        <>
            <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    📷 添付画像 ({attachments.length}枚)
                </div>
                <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative group w-16 h-16 rounded overflow-hidden border border-slate-200 hover:border-indigo-300 transition-colors"
                        >
                            <img
                                src={`/${attachment.storageKey}`}
                                alt="添付画像"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setViewingImage(`/${attachment.storageKey}`)}
                            />
                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                    onClick={() => setViewingImage(`/${attachment.storageKey}`)}
                                    className="p-1 bg-white rounded text-slate-700 hover:text-indigo-600"
                                    title="拡大"
                                >
                                    <Maximize2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm({ open: true, id: attachment.id })}
                                    className="p-1 bg-white rounded text-slate-700 hover:text-red-600"
                                    title="削除"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Full Image Viewer */}
            <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
                <DialogContent className="max-w-4xl p-2">
                    {viewingImage && (
                        <img
                            src={viewingImage}
                            alt="添付画像"
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
                title="画像を削除しますか？"
                description="この操作は取り消せません。"
                confirmLabel="削除"
                variant="danger"
                onConfirm={handleDelete}
            />
        </>
    );
}
