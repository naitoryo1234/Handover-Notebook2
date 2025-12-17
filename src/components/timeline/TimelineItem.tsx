'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FileText, CheckCircle2, StickyNote, AlertCircle, Flag, Pencil, X, Save, Image as ImageIcon, Trash2, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateTimelineEntry } from '@/actions/patientActions';
import { toast } from 'sonner';

// Types for Timeline Data
export type TimelineEntry = {
    id: string;
    date: Date;
    type: 'appointment' | 'record' | 'memo' | 'image';
    content: string;
    subContent?: string; // e.g. menu name or tags
    status?: string; // for appointments
    flags?: string[]; // Added flags
    images?: string[]; // Attached image paths
};



interface TimelineItemProps {
    entry: TimelineEntry;
    isLast: boolean;
    patientId: string;
    onDelete?: () => void;
    onUpdate?: (content: string, flags?: string[]) => void;
}

export function TimelineItem({ entry, isLast, patientId, onDelete, onUpdate }: TimelineItemProps) {
    const isAppointment = entry.type === 'appointment';
    const isMemo = entry.type === 'memo';
    const isImage = entry.type === 'image';

    const flags = entry.flags || [];
    const isImportant = flags.includes('important');
    const isHandover = flags.includes('handover');

    // 長文判定 (100文字以上 または 4行以上)
    const lineCount = entry.content.split('\n').length;
    const isLongContent = entry.content.length > 100 || lineCount > 4;
    const [isExpanded, setIsExpanded] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(entry.content);
    const [editFlags, setEditFlags] = useState<string[]>(flags);
    const [isSaving, setIsSaving] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSave = async () => {
        if (!editText.trim()) return;
        setIsSaving(true);
        try {
            const result = await updateTimelineEntry(entry.id, entry.type, editText, patientId, editFlags);
            if (result.success) {
                toast.success('更新しました');
                setIsEditing(false);
                onUpdate?.(editText, editFlags); // Notify parent
            } else {
                toast.error(result.error || '更新に失敗しました');
            }
        } catch (error) {
            toast.error('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex gap-3 group hover:bg-slate-50 transition-colors p-4 -mx-4 rounded-xl">
            {/* Left: Date & Time */}
            <div className="w-[70px] flex-shrink-0 text-right pt-1">
                <div className="text-[10px] text-slate-400 font-mono leading-none mb-0.5">
                    {format(entry.date, 'yyyy')}
                </div>
                <div className="text-sm font-bold text-slate-700 font-mono tracking-tight leading-none">
                    {format(entry.date, 'MM.dd')}
                </div>
                <div className="text-xs text-slate-400 mt-1.5 font-mono">
                    {format(entry.date, 'HH:mm')}
                </div>
            </div>

            {/* Center: Indicator Line/Dot */}
            <div className="relative flex-shrink-0 flex flex-col items-center px-1">
                <div className={clsx(
                    "w-3.5 h-3.5 rounded-full mt-1.5 ring-4 ring-white z-10 shadow-sm transition-colors",
                    isImportant ? "bg-red-500 ring-red-50" :
                        isHandover ? "bg-orange-500 ring-orange-50" :
                            isAppointment ? "bg-indigo-500" :
                                isMemo ? "bg-amber-400" :
                                    "bg-slate-400"
                )} />
                {/* Connector Line */}
                {!isLast && (
                    <div className="w-0.5 h-full bg-slate-100 absolute top-4 -z-0" />
                )}
            </div>

            {/* Right: Content Card */}
            <div className={clsx(
                "flex-grow min-w-0 transition-all duration-200 rounded-xl group/card relative",
                (isImportant || isHandover) && "-m-2 p-3 mt-0 mb-0",
                isImportant ? "bg-red-50/40 ring-1 ring-red-100" :
                    isHandover ? "bg-orange-50/40 ring-1 ring-orange-100" : ""
            )}>
                {/* Menu Trigger (Top Right) */}
                {!isEditing && (onDelete || onUpdate) && (
                    <div className="absolute top-2 right-2 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className={clsx(
                                "h-7 w-7 flex items-center justify-center rounded-full text-slate-400 transition-all",
                                isMenuOpen ? "opacity-100 bg-slate-100/80 text-slate-600" : "opacity-0 group-hover:opacity-100 hover:bg-slate-100/50 hover:text-slate-600"
                            )}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {isMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

                                {/* Menu */}
                                <div className="absolute right-0 top-8 w-28 bg-white rounded-lg shadow-lg border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    {onUpdate && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditText(entry.content);
                                                setEditFlags(entry.flags || []);
                                                setIsEditing(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            編集
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onDelete();
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            削除
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Header Badge */}
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className={clsx(
                                "text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1",
                                isAppointment ? "bg-indigo-50 text-indigo-600" :
                                    isMemo ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                        isImage ? "bg-sky-50 text-sky-600 border border-sky-100" :
                                            "bg-slate-100 text-slate-600"
                            )}>
                                {isAppointment && <Calendar className="w-3 h-3" />}
                                {isMemo && <StickyNote className="w-3 h-3" />}
                                {isImage && <ImageIcon className="w-3 h-3" />}
                                {!isAppointment && !isMemo && !isImage && <FileText className="w-3 h-3" />}
                                {isAppointment ? 'Appointment' : isMemo ? 'Memo' : isImage ? 'Image' : 'Record'}
                            </span>

                            {/* Flags (Display Mode) */}
                            {!isEditing && isImportant && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-white px-2 py-0.5 rounded-full border border-red-200 shadow-sm">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>重要</span>
                                </span>
                            )}
                            {!isEditing && isHandover && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200 shadow-sm">
                                    <Flag className="w-3 h-3" />
                                    <span>申し送り</span>
                                </span>
                            )}

                            {/* Appointment Status */}
                            {isAppointment && entry.status === 'completed' && (
                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>来店済</span>
                                </span>
                            )}
                        </div>

                        {/* Main Content */}
                        {isEditing ? (
                            <div className="mt-2 space-y-3">
                                <Textarea
                                    value={editText}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                                    className="min-h-[100px] text-sm bg-white"
                                />

                                {/* Edit Flags Layout - Same as CustomerDetailClient.tsx */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditFlags(prev =>
                                            prev.includes('important') ? prev.filter(f => f !== 'important') : [...prev, 'important']
                                        )}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                            editFlags.includes('important')
                                                ? "bg-red-50 text-red-600 border-red-200 shadow-sm ring-1 ring-red-100"
                                                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                                        )}
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        重要
                                    </button>
                                    <button
                                        onClick={() => setEditFlags(prev =>
                                            prev.includes('handover') ? prev.filter(f => f !== 'handover') : [...prev, 'handover']
                                        )}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                            editFlags.includes('handover')
                                                ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm ring-1 ring-orange-100"
                                                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                                        )}
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                        申し送り
                                    </button>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                        className="h-8 text-xs"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        キャンセル
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaving || !editText.trim()}
                                        className="h-8 text-xs"
                                    >
                                        <Save className="w-3.5 h-3.5 mr-1" />
                                        {isSaving ? '保存中...' : '保存'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={isLongContent ? () => setIsExpanded(!isExpanded) : undefined}
                                className={isLongContent ? 'cursor-pointer' : ''}
                            >
                                <div className={clsx(
                                    "text-sm leading-relaxed whitespace-pre-wrap break-words",
                                    isAppointment ? "font-bold text-slate-800 text-base" : "text-slate-600",
                                    !isExpanded && isLongContent && "line-clamp-3",
                                    isImportant && "font-medium text-slate-900"
                                )}>
                                    {entry.content}
                                </div>
                                {isLongContent && (
                                    <button
                                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1 hover:underline focus:outline-none"
                                    >
                                        {isExpanded ? '閉じる' : 'もっと見る'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Images */}
                        {entry.images && entry.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {entry.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img}
                                            alt="添付画像"
                                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sub Content (e.g. Menu) */}
                        {entry.subContent && (
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                {entry.subContent}
                            </p>
                        )}
                    </div>

                    {/* Right Icon Visual Removed */}
                </div>
            </div>
        </div>
    );
}
