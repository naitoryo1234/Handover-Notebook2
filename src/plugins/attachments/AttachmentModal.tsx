'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { uploadAttachmentAction } from './attachmentActions';
import { useToast } from '@/components/ui/Toast';
import { features } from '@/config/features';

interface AttachmentModalProps {
    recordId: string;
    patientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AttachmentModal({ recordId, patientId, isOpen, onClose, onSuccess }: AttachmentModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const config = features.plugins.attachments;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
            showToast('対応していないファイル形式です（JPEG, PNG, WebPのみ）', 'error');
            return;
        }

        // Validate file size
        if (file.size > config.maxFileSizeMB * 1024 * 1024) {
            showToast(`ファイルサイズが大きすぎます（${config.maxFileSizeMB}MB以下）`, 'error');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('recordId', recordId);
            formData.append('patientId', patientId);
            formData.append('file', selectedFile);

            const result = await uploadAttachmentAction(formData);

            if (result.success) {
                showToast('画像を追加しました', 'success');
                handleClose();
                onSuccess?.();
            } else {
                showToast(result.message || 'アップロードに失敗しました', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('エラーが発生しました', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setPreview(null);
        setSelectedFile(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-indigo-600" />
                        画像を追加
                    </DialogTitle>
                    <DialogDescription>
                        この記録に画像を添付します
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Preview Area */}
                    {preview ? (
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-48 object-contain bg-slate-100 rounded-lg"
                            />
                            <button
                                onClick={() => {
                                    setPreview(null);
                                    setSelectedFile(null);
                                }}
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                            <Upload className="w-10 h-10 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">クリックして画像を選択</p>
                            <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP（{config.maxFileSizeMB}MB以下）</p>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={config.allowedTypes.join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    アップロード中...
                                </>
                            ) : (
                                '追加する'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
