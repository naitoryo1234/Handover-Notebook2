'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Patient } from '@prisma/client';
import { updatePatientMemo, addTimelineMemo, loadMoreTimeline, deleteTimelineEntry } from '@/actions/patientActions';
import { uploadImage } from '@/actions/uploadActions';
import { formatVoiceText, FormattedTextResult } from '@/actions/geminiActions';
import { transcribeAudio } from '@/actions/groqActions';
import { clsx } from 'clsx';
import { Edit3, Phone, Cake, Plus, ChevronDown, ChevronUp, Mic, FileText, StickyNote, AlertCircle, Flag, Trash2, Filter, ChevronRight, Sparkles, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TimelineItem, TimelineEntry } from '@/components/timeline/TimelineItem';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MobileVoiceInput } from '@/components/mobile/MobileVoiceInput';

interface CustomerDetailClientProps {
    patient: Patient;
    initialTimeline: TimelineEntry[];
    initialHasMore: boolean;
    initialTotal: number;
}

type FilterType = 'all' | 'appointment' | 'memo' | 'record';
type FlagFilter = 'none' | 'important' | 'handover';

// Speech types removed as we are moving to Groq/MediaRecorder

export function CustomerDetailClient({ patient, initialTimeline, initialHasMore, initialTotal }: CustomerDetailClientProps) {
    const router = useRouter();

    // Pinned Note States
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteContent, setNoteContent] = useState(patient.memo || '');
    const [isSavingNote, setIsSavingNote] = useState(false);

    // New Timeline Memo States
    const [isAddingMemo, setIsAddingMemo] = useState(false);
    const [newMemoContent, setNewMemoContent] = useState('');
    const [isSavingMemo, setIsSavingMemo] = useState(false);

    // Enhanced Input States
    const [recordType, setRecordType] = useState<'memo' | 'record'>('memo');
    const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

    // Voice Input (Groq) States
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Timeline States
    const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [total, setTotal] = useState(initialTotal);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Display Settings (persisted in localStorage)
    const [displayLimit, setDisplayLimit] = useState(50);

    // Load display limit from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('timeline_display_limit');
        if (saved) {
            const limit = parseInt(saved, 10);
            if ([20, 50, 100, 200].includes(limit)) {
                setDisplayLimit(limit);
            }
        }
    }, []);

    // Save display limit to localStorage
    const handleDisplayLimitChange = (limit: number) => {
        setDisplayLimit(limit);
        localStorage.setItem('timeline_display_limit', limit.toString());
    };

    // Filter States
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [flagFilter, setFlagFilter] = useState<FlagFilter>('none');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Delete States
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'memo' | 'record' } | null>(null);

    // AI Formatting States
    const [isFormatting, setIsFormatting] = useState(false);
    const [formattedResult, setFormattedResult] = useState<FormattedTextResult | null>(null);
    const [showFormattedResult, setShowFormattedResult] = useState(false);
    // AI Format Options
    const [appendExtractedData, setAppendExtractedData] = useState(true);
    const [autoSetHandover, setAutoSetHandover] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // ... (skipped)

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', patient.id);

        const toastId = toast.loading('アップロード中...');

        try {
            const result = await uploadImage(formData);
            if (result.success) {
                toast.dismiss(toastId);
                toast.success('画像をアップロードしました');

                // Reload timeline to show new image
                const loadResult = await loadMoreTimeline(patient.id, 0, displayLimit, searchQuery);
                if (loadResult.success && loadResult.entries) {
                    const parsed = loadResult.entries.map(e => ({
                        ...e,
                        date: new Date(e.date),
                        type: e.type as 'appointment' | 'record' | 'memo' | 'image'
                    }));
                    setTimeline(parsed);
                    setHasMore(loadResult.hasMore ?? false);
                    setTotal(loadResult.total ?? 0);
                }
            } else {
                toast.dismiss(toastId);
                toast.error(result.error || 'アップロードに失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.dismiss(toastId);
            toast.error('アップロードエラー');
        }
        // Reset input
        e.target.value = '';
    };

    // Handlers for Pinned Note
    const handleSaveNote = async () => {
        setIsSavingNote(true);
        try {
            const result = await updatePatientMemo(patient.id, noteContent);
            if (result.success) {
                setIsEditingNote(false);
                router.refresh();
                toast.success('Pinned Noteを更新しました');
            } else {
                toast.error('保存に失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.error('エラーが発生しました');
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleCancelNote = () => {
        setNoteContent(patient.memo || '');
        setIsEditingNote(false);
    };

    // Toggle Note Accordion
    const toggleNote = () => {
        if (isEditingNote) return; // Prevent closing while editing
        setIsNoteOpen(!isNoteOpen);
    };

    // Start Editing (force open)
    const startEditingNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsNoteOpen(true);
        setIsEditingNote(true);
    };

    // Groq Voice Input Handlers
    // ------------------------------------------------------------------------
    const startRecording = async () => {
        // Safe check for secure context
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('マイクを使用できません。HTTPSまたはローカルホスト環境が必要です。');
            console.error('navigator.mediaDevices is undefined. Secure Context required.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer for recording duration
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('マイクのアクセス許可が必要です');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = async () => {
                // Clear timer
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsTranscribing(true); // Start processing UI

                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');

                    const result = await transcribeAudio(formData);
                    if (result.success && result.text) {
                        setNewMemoContent(prev => {
                            const prefix = prev ? prev + '\n' : '';
                            return prefix + result.text;
                        });
                        toast.success('音声を入力しました');
                    } else {
                        toast.error(result.error || '文字起こしに失敗しました');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('サーバー通信エラーが発生しました');
                } finally {
                    setIsTranscribing(false);
                    // Stop tracks
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleVoiceInput = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handlers for Timeline Memo
    const handleAddMemo = async () => {
        if (!newMemoContent.trim()) return;

        // Stop speech recognition if active
        // mediaRecorderRef.current.stop() handled in stopRecording but we can force cleanup if needed
        if (isRecording) stopRecording();

        setIsSavingMemo(true);
        try {
            const result = await addTimelineMemo(patient.id, newMemoContent, recordType, selectedFlags);
            if (result.success) {
                // Add new entry to local timeline immediately
                const newEntry: TimelineEntry = {
                    id: `temp-${Date.now()}`, // Temporary ID, will be replaced on next refresh
                    date: new Date(),
                    type: recordType,
                    content: newMemoContent,
                    subContent: recordType === 'record' ? '施術記録' : undefined,
                    flags: selectedFlags
                };
                setTimeline(prev => [newEntry, ...prev]);
                setTotal(prev => prev + 1);

                setIsAddingMemo(false);
                setNewMemoContent('');
                setRecordType('memo');
                setSelectedFlags([]);
                setRecordType('memo');
                setSelectedFlags([]);
                // setInterimText(''); removed
                toast.success('記録を追加しました');
            } else {
                toast.error(result.error || '保存に失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.error('エラーが発生しました');
        } finally {
            setIsSavingMemo(false);
        }
    };

    // AI Format handler
    const handleAIFormat = async () => {
        if (!newMemoContent.trim()) {
            toast.error('テキストを入力してください');
            return;
        }

        setIsFormatting(true);
        try {
            const result = await formatVoiceText(newMemoContent);
            if (result.success && result.data) {
                setFormattedResult(result.data);

                // Auto-enable options if data extracted
                const requests = result.data.extracted_data.requests;
                const hasExtracted = !!requests && requests.length > 0;
                setAppendExtractedData(hasExtracted || !!result.data.summary);
                setAutoSetHandover(hasExtracted);

                setShowFormattedResult(true);
            } else {
                toast.error(result.error || 'AI整形に失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.error('AI処理中にエラーが発生しました');
        } finally {
            setIsFormatting(false);
        }
    };

    // Apply formatted text
    const applyFormattedText = () => {
        if (formattedResult) {
            let finalContent = formattedResult.formatted_text;

            // Append Extracted Data
            if (appendExtractedData) {
                const parts = [];

                // Summary is excluded for brevity (kept for display only)
                // if (formattedResult.summary) { ... }

                if (formattedResult.extracted_data.requests && formattedResult.extracted_data.requests.length > 0) {
                    parts.push(`【重要事項】\n${formattedResult.extracted_data.requests.map(r => `・${r}`).join('\n')}`);
                }

                if (parts.length > 0) {
                    finalContent += `\n\n---\n\n${parts.join('\n\n')}`;
                }
            }

            setNewMemoContent(finalContent);

            // Auto Set Flag
            const requests = formattedResult.extracted_data.requests;
            const hasRequests = !!requests && requests.length > 0;

            if (autoSetHandover && hasRequests) {
                setSelectedFlags(prev => {
                    if (!prev.includes('handover')) {
                        return [...prev, 'handover'];
                    }
                    return prev;
                });
                toast.success('適用・申し送りフラグを設定しました');
            } else {
                toast.success('整形テキストを適用しました');
            }

            setShowFormattedResult(false);
            setFormattedResult(null);
        }
    };

    // Search Handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingMore(true);
        try {
            // Reset offset to 0 and load with query
            const result = await loadMoreTimeline(patient.id, 0, displayLimit, searchQuery);
            if (result.success && result.entries) {
                const parsed = result.entries.map(e => ({
                    ...e,
                    date: new Date(e.date),
                    type: e.type as 'appointment' | 'record' | 'memo'
                }));
                setTimeline(parsed);
                setHasMore(result.hasMore);
                setTotal(result.total ?? 0);
            } else {
                setTimeline([]);
                setHasMore(false);
                setTotal(0);
            }
        } catch (e) {
            console.error(e);
            toast.error('検索に失敗しました');
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Load more timeline entries
    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        try {
            const result = await loadMoreTimeline(patient.id, timeline.length, displayLimit, searchQuery);
            if (result.success && result.entries) {
                const parsed = result.entries.map(e => ({
                    ...e,
                    date: new Date(e.date),
                    type: e.type as 'appointment' | 'record' | 'memo'
                }));
                setTimeline(prev => [...prev, ...parsed]);
                setHasMore(result.hasMore);
            }
        } catch (e) {
            console.error(e);
            toast.error('読み込みに失敗しました');
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Delete timeline entry
    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            const result = await deleteTimelineEntry(deleteTarget.id, deleteTarget.type, patient.id);
            if (result.success) {
                setTimeline(prev => prev.filter(e => e.id !== deleteTarget.id));
                setTotal(prev => prev - 1);
                toast.success('記録を削除しました');
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.error('エラーが発生しました');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Update timeline entry content locally
    const handleUpdateEntry = (id: string, content: string, flags?: string[]) => {
        setTimeline(prev => prev.map(e => e.id === id ? { ...e, content, flags: flags ?? e.flags } : e));
    };

    // Filtered timeline
    const filteredTimeline = timeline.filter(entry => {
        // Type filter
        if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

        // Flag filter
        if (flagFilter === 'important' && !entry.flags?.includes('important')) return false;
        if (flagFilter === 'handover' && !entry.flags?.includes('handover')) return false;

        return true;
    });

    const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (flagFilter !== 'none' ? 1 : 0);

    // Mobile Tab State
    const [activeTab, setActiveTab] = useState<'profile' | 'timeline'>('timeline');

    // Handle Mobile Voice Commit
    const handleMobileVoiceCommit = async (text: string) => {
        setIsAddingMemo(true);
        setNewMemoContent(text);
        // Automatically trigger AI formatting for mobile voice input
        setIsFormatting(true);
        try {
            const result = await formatVoiceText(text);
            if (result.success && result.data) {
                setFormattedResult(result.data);
                const requests = result.data.extracted_data.requests;
                const hasExtracted = !!requests && requests.length > 0;
                setAppendExtractedData(hasExtracted || !!result.data.summary);
                setAutoSetHandover(hasExtracted);
                setShowFormattedResult(true);
            }
        } catch (e) {
            console.error(e);
            toast.error('AI処理中にエラーが発生しました');
        } finally {
            setIsFormatting(false);
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto max-w-none pb-20 pt-1">
            {/* MOBILE VIEW (lg:hidden) */}
            <div className="lg:hidden flex flex-col gap-4">
                {/* Mobile Tab Navigation */}
                <div className="flex p-1 bg-slate-100 rounded-lg mb-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-md transition-all",
                            activeTab === 'profile' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        プロフィール
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={clsx(
                            "flex-1 py-2 text-sm font-bold rounded-md transition-all",
                            activeTab === 'timeline' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        タイムライン
                    </button>
                </div>

                {/* Mobile Content: Profile Tab */}
                <div className={clsx("flex flex-col gap-6", activeTab !== 'profile' && "hidden")}>
                    {/* Simplified Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <div className="text-center mb-4">
                            <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                            <p className="text-sm text-slate-400">{patient.kana}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {patient.phone && (
                                <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 justify-center text-slate-600">
                                    <Phone className="w-4 h-4" /> {patient.phone}
                                </div>
                            )}
                            {patient.birthDate && (
                                <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 justify-center text-slate-600">
                                    <Cake className="w-4 h-4" /> {format(new Date(patient.birthDate), 'yyyy.MM.dd')}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Mobile Pinned Note */}
                    <div className="bg-[#FFF9F5] rounded-xl border-l-[4px] border-[#E8A87C] p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold text-[#D6966B] uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#E8A87C] rounded-full"></span>
                                重要事項
                            </h2>
                            <button onClick={() => setIsNoteOpen(true)} className="text-[#E8A87C]">
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                            {patient.memo || <span className="text-slate-400 italic">メモなし</span>}
                        </div>
                    </div>
                </div>

                {/* Mobile Content: Timeline Tab */}
                <div className={clsx("flex flex-col gap-4", activeTab !== 'timeline' && "hidden")}>
                    {/* Mobile Filter & Add Buttons are handled in the shared Right Main section below, 
                       but we might need to adjust layout. For now, reusing the existing structure 
                       but checking activeTab for mobile visibility. */}
                </div>
            </div>

            {/* DESKTOP LAYOUT (lg:grid) & Shared Timeline Content */}
            <div className={clsx(
                "grid lg:grid-cols-[260px_1fr] gap-8",
                // On mobile, only show this container if timeline tab is active
                activeTab === 'timeline' ? "block" : "hidden lg:grid"
            )}>
                {/* LEFT SIDEBAR: Profile & Pinned Note (Hidden on Mobile, shown via Tab above) */}
                <div className="hidden lg:block lg:sticky lg:top-0 h-fit max-h-[calc(100vh-120px)] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-2">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h1 className="text-2xl font-bold text-[#1a1a1a] leading-tight tracking-tight mb-1">
                            {patient.name}
                        </h1>
                        <p className="text-sm text-slate-400 font-medium mb-6">
                            {patient.kana}
                        </p>

                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                            {patient.phone && (
                                <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{patient.phone}</span>
                                </div>
                            )}
                            {patient.birthDate && (
                                <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                    <Cake className="w-4 h-4 text-slate-400" />
                                    <span>{format(new Date(patient.birthDate), 'yyyy.MM.dd')}生</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PINNED NOTE: Accordion Style with Preview (Chira-mise) */}
                    <div>
                        <div
                            onClick={!isNoteOpen && !isEditingNote ? () => setIsNoteOpen(true) : undefined}
                            className={`
                                bg-[#FFF9F5] rounded-xl
                                border-l-[4px] border-[#E8A87C]
                                shadow-[0_2px_8px_rgba(0,0,0,0.02)]
                                transition-all duration-300 relative
                                ${isNoteOpen || isEditingNote ? 'p-5 min-h-[160px]' : 'p-4 cursor-pointer hover:bg-[#fff4eb]'}
                                ${isEditingNote ? 'ring-2 ring-indigo-500/20' : ''}
                            `}
                        >
                            {/* Header Label (Always visible) */}
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[11px] font-bold text-[#D6966B] uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="bg-[#E8A87C] w-1.5 h-1.5 rounded-full inline-block"></span>
                                    重要事項メモ
                                </h2>
                                {!isEditingNote && !isNoteOpen && <ChevronDown className="w-3.5 h-3.5 text-[#E8A87C]" />}
                            </div>

                            {/* Closed State (Preview 6 lines) */}
                            {!isNoteOpen && !isEditingNote && (
                                <div className="text-sm text-slate-700 font-medium leading-relaxed opacity-90 line-clamp-[6]">
                                    {patient.memo || <span className="text-slate-400 italic font-normal">メモはまだありません</span>}
                                </div>
                            )}

                            {/* Open State (Expanded) */}
                            {(isNoteOpen || isEditingNote) && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200 w-full">
                                    {/* Header Controls inside the expanded card */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {!isEditingNote && (
                                            <button
                                                onClick={startEditingNote}
                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                                title="編集"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsNoteOpen(false); }}
                                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                            title="閉じる"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content Area */}
                                    <div className="pt-0">
                                        {isEditingNote ? (
                                            <div className="flex flex-col gap-4">
                                                <textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-base leading-relaxed text-slate-800 placeholder:text-slate-300 resize-none min-h-[120px]"
                                                    placeholder="重要なメモを入力..."
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-3 pt-2 border-t border-[#E8A87C]/10">
                                                    <button
                                                        onClick={handleCancelNote}
                                                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-black/5 rounded-md transition-colors"
                                                        disabled={isSavingNote}
                                                    >
                                                        キャンセル
                                                    </button>
                                                    <button
                                                        onClick={handleSaveNote}
                                                        disabled={isSavingNote}
                                                        className="px-3 py-1.5 text-xs bg-[#E8A87C] hover:bg-[#D6966B] text-white font-medium rounded-md shadow-sm transition-colors flex items-center gap-2"
                                                    >
                                                        {isSavingNote ? '保存...' : '保存'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap pr-4">
                                                {patient.memo ? patient.memo : (
                                                    <span className="text-slate-400 italic">
                                                        メモはまだありません。
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT MAIN: Timeline History (Shared for both, visible depending on activeTab on mobile) */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-1 border-b border-slate-100 pb-2">
                        <h2 className="text-lg font-bold text-slate-700 tracking-tight flex items-center gap-2">
                            <span className="w-1 h-6 bg-slate-200 rounded-full"></span>
                            対応履歴
                            <span className="text-xs font-normal text-slate-400 ml-1">({total}件)</span>
                        </h2>

                        <div className="flex items-center gap-2">
                            {/* Filter Button */}
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={clsx(
                                    "px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors border",
                                    activeFilterCount > 0
                                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">検索・絞り込み</span>
                                <span className="sm:hidden">絞込</span>
                                {activeFilterCount > 0 && (
                                    <span className="bg-indigo-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {!isAddingMemo && (
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium px-3 sm:px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">画像</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAddingMemo(true);
                                            // Reset filters when adding a new record
                                            setTypeFilter('all');
                                            setFlagFilter('none');
                                            setIsFilterOpen(false);
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">記録を追加</span>
                                        <span className="sm:hidden">追加</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {isFilterOpen && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-6">
                                {/* Search Input */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">キーワード検索</label>
                                    <form onSubmit={handleSearch} className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="記録の内容を検索..."
                                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                        <div className="absolute left-3 top-2.5 text-slate-400">
                                            <Filter className="w-4 h-4" />
                                            {/* Using Filter icon as generic placeholder or maybe Search if imported */}
                                        </div>
                                        <button
                                            type="submit"
                                            className="absolute right-2 top-1.5 px-3 py-1 bg-slate-800 text-white text-xs rounded-md hover:bg-slate-700 transition-colors"
                                        >
                                            検索
                                        </button>
                                    </form>
                                </div>

                                <div className="flex flex-wrap gap-6">
                                    {/* Type Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">種別</label>
                                        <div className="flex gap-1">
                                            {(['all', 'appointment', 'memo', 'record'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setTypeFilter(typeFilter === type && type !== 'all' ? 'all' : type)}
                                                    className={clsx(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                                        typeFilter === type
                                                            ? "bg-slate-900 text-white"
                                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                                    )}
                                                >
                                                    {type === 'all' ? 'すべて' : type === 'appointment' ? '予約' : type === 'memo' ? 'メモ' : '記録'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Flag Filter */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">フラグ</label>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setFlagFilter('none')}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                                    flagFilter === 'none'
                                                        ? "bg-slate-900 text-white"
                                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                                )}
                                            >
                                                すべて
                                            </button>
                                            <button
                                                onClick={() => setFlagFilter(flagFilter === 'important' ? 'none' : 'important')}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                                                    flagFilter === 'important'
                                                        ? "bg-red-500 text-white"
                                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                                )}
                                            >
                                                <AlertCircle className="w-3 h-3" />
                                                重要
                                            </button>
                                            <button
                                                onClick={() => setFlagFilter(flagFilter === 'handover' ? 'none' : 'handover')}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                                                    flagFilter === 'handover'
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                                )}
                                            >
                                                <Flag className="w-3 h-3" />
                                                申し送り
                                            </button>
                                        </div>
                                    </div>

                                    {/* Display Limit */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">表示件数</label>
                                        <select
                                            value={displayLimit}
                                            onChange={(e) => handleDisplayLimitChange(parseInt(e.target.value, 10))}
                                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-600 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value={20}>20件</option>
                                            <option value={50}>50件</option>
                                            <option value={100}>100件</option>
                                            <option value={200}>200件</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">※次回読込時から適用</p>
                                    </div>
                                </div>
                            </div>

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { setTypeFilter('all'); setFlagFilter('none'); }}
                                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    フィルタをクリア
                                </button>
                            )}
                        </div>
                    )}

                    {/* Add Memo Form */}
                    {isAddingMemo && (
                        <div className="mb-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                            {/* Type Selector */}
                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recordType"
                                        value="memo"
                                        checked={recordType === 'memo'}
                                        onChange={() => setRecordType('memo')}
                                        className="hidden pair-radio"
                                    />
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                        recordType === 'memo'
                                            ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm"
                                            : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100"
                                    )}>
                                        <StickyNote className="w-3.5 h-3.5" />
                                        MEMO
                                    </div>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recordType"
                                        value="record"
                                        checked={recordType === 'record'}
                                        onChange={() => setRecordType('record')}
                                        className="hidden pair-radio"
                                    />
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                        recordType === 'record'
                                            ? "bg-slate-700 text-white border-slate-600 shadow-sm"
                                            : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100"
                                    )}>
                                        <FileText className="w-3.5 h-3.5" />
                                        RECORD
                                    </div>
                                </label>
                            </div>

                            {/* Flags Selector */}
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={() => setSelectedFlags(prev =>
                                        prev.includes('important') ? prev.filter(f => f !== 'important') : [...prev, 'important']
                                    )}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                        selectedFlags.includes('important')
                                            ? "bg-red-50 text-red-600 border-red-200 shadow-sm ring-1 ring-red-100"
                                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                                    )}
                                >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    重要
                                </button>
                                <button
                                    onClick={() => setSelectedFlags(prev =>
                                        prev.includes('handover') ? prev.filter(f => f !== 'handover') : [...prev, 'handover']
                                    )}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border",
                                        selectedFlags.includes('handover')
                                            ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm ring-1 ring-orange-100"
                                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                                    )}
                                >
                                    <Flag className="w-3.5 h-3.5" />
                                    申し送り
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={newMemoContent}
                                    onChange={(e) => {
                                        setNewMemoContent(e.target.value);
                                    }}
                                    className="w-full border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-4 text-base leading-relaxed text-slate-700 placeholder:text-slate-300 resize-none min-h-[160px] mb-4 pr-24"
                                    placeholder={recordType === 'memo' ? "履歴に残す新しいメモを入力..." : "施術内容や所見などの記録を入力..."}
                                    autoFocus
                                />

                                {isTranscribing && (
                                    <div className="absolute bottom-8 left-4 text-sm text-indigo-600 flex items-center gap-2 font-bold animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        AI文字起こし中...
                                    </div>
                                )}

                                {/* Speech Input Button with Timer */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <button
                                        onClick={toggleVoiceInput}
                                        disabled={isTranscribing}
                                        className={clsx(
                                            "transition-all duration-300 ease-out flex items-center gap-2",
                                            isRecording
                                                ? "bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 shadow-sm"
                                                : "p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                                            isTranscribing && "opacity-50 cursor-not-allowed"
                                        )}
                                        title={isRecording ? "音声入力を停止" : "音声入力(高精度)"}
                                    >
                                        {isRecording ? (
                                            <>
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                                </span>
                                                <span className="text-xs font-bold tracking-wide font-mono">{formatTime(recordingTime)}</span>
                                            </>
                                        ) : (
                                            <Mic className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-slate-50 pt-3 pb-16 sm:pb-3">
                                {/* Left: AI Format Button */}
                                <button
                                    onClick={handleAIFormat}
                                    disabled={!newMemoContent.trim() || isFormatting}
                                    className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium"
                                >
                                    {isFormatting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            AI処理中...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            AI整形
                                        </>
                                    )}
                                </button>

                                {/* Right: Cancel & Save Buttons */}
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => {
                                            setIsAddingMemo(false);
                                            setNewMemoContent('');
                                            setNewMemoContent('');
                                            if (isRecording) stopRecording();
                                            setShowFormattedResult(false);
                                            setFormattedResult(null);
                                        }}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleAddMemo}
                                        disabled={!newMemoContent.trim() || isSavingMemo}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        {isSavingMemo ? '保存中...' : '追加する'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Timeline List */}
                    <div className="space-y-0 pl-4 border-l border-slate-100 ml-1 pb-12">
                        {filteredTimeline.length > 0 ? (
                            <>
                                {filteredTimeline.map((entry, index) => (
                                    <div key={entry.id} className="group relative">
                                        <TimelineItem
                                            entry={entry}
                                            isLast={index === filteredTimeline.length - 1}
                                            patientId={patient.id}
                                            onDelete={(entry.type === 'memo' || entry.type === 'record' || entry.type === 'image') ?
                                                () => setDeleteTarget({ id: entry.id, type: entry.type as 'memo' | 'record' }) : undefined
                                            }
                                            onUpdate={(content, flags) => handleUpdateEntry(entry.id, content, flags)}
                                        />
                                    </div>
                                ))}

                                {/* Load More Button */}
                                {hasMore && typeFilter === 'all' && flagFilter === 'none' && (
                                    <div className="pt-6 pl-8">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                            className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isLoadingMore ? (
                                                '読み込み中...'
                                            ) : (
                                                <>
                                                    もっと見る
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 ml-[-20px]">
                                {activeFilterCount > 0 ? (
                                    <p className="text-sm">フィルタに一致する履歴がありません</p>
                                ) : (
                                    <p className="text-sm">履歴はまだありません</p>
                                )}
                            </div>
                        )}
                    </div>


                    {/* Delete Confirmation Modal */}
                    <ConfirmDialog
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                        onConfirm={handleDelete}
                        title="記録を削除"
                        description="この記録を削除してもよろしいですか？この操作は取り消せません。"
                        confirmLabel="削除する"
                        cancelLabel="キャンセル"
                        variant="danger"
                    />

                    {/* AI Formatted Result Modal */}
                    {showFormattedResult && formattedResult && (
                        <div
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setShowFormattedResult(false)}
                        >
                            <div
                                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex-none flex items-center gap-3">
                                    <Sparkles className="w-5 h-5" />
                                    <h3 className="font-bold text-base flex-1">AI整形結果</h3>
                                    <button
                                        onClick={() => setShowFormattedResult(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
                                    {/* Summary */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📝 申し送り要約</h4>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-slate-700">
                                            {formattedResult.summary}
                                        </div>
                                    </div>

                                    {/* Formatted Text */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">✨ 整形後テキスト</h4>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap">
                                            {formattedResult.formatted_text}
                                        </div>
                                    </div>

                                    {/* Extracted Data */}
                                    {(formattedResult.extracted_data.customer_name ||
                                        formattedResult.extracted_data.visit_date ||
                                        (formattedResult.extracted_data.requests && formattedResult.extracted_data.requests.length > 0)) && (
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🔍 抽出データ</h4>
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
                                                    {formattedResult.extracted_data.customer_name && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-medium text-slate-600">顧客名:</span>
                                                            <span className="text-slate-800">{formattedResult.extracted_data.customer_name}</span>
                                                        </div>
                                                    )}
                                                    {formattedResult.extracted_data.visit_date && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-medium text-slate-600">来店日:</span>
                                                            <span className="text-slate-800">{formattedResult.extracted_data.visit_date}</span>
                                                        </div>
                                                    )}
                                                    {formattedResult.extracted_data.requests && formattedResult.extracted_data.requests.length > 0 && (
                                                        <div className="text-sm">
                                                            <span className="font-medium text-slate-600">要望・注意点:</span>
                                                            <ul className="mt-1 list-disc list-inside text-slate-800">
                                                                {formattedResult.extracted_data.requests.map((req, i) => (
                                                                    <li key={i}>{req}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-slate-200 p-4 bg-slate-50">
                                    {/* Application Options */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-4 text-sm text-slate-700">
                                        {((formattedResult.extracted_data.requests?.length ?? 0) > 0 || formattedResult.summary) && (
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={appendExtractedData}
                                                    onChange={(e) => setAppendExtractedData(e.target.checked)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span>抽出・要約データを追記する</span>
                                            </label>
                                        )}

                                        {((formattedResult.extracted_data.requests?.length ?? 0) > 0) && (
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={autoSetHandover}
                                                    onChange={(e) => setAutoSetHandover(e.target.checked)}
                                                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                />
                                                <span>「申し送り」フラグをON</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setShowFormattedResult(false)}
                                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            閉じる
                                        </button>
                                        <button
                                            onClick={applyFormattedText}
                                            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            適用する
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Voice Input FAB - Hidden when memo form is open */}
            {!isAddingMemo && <MobileVoiceInput onCommit={handleMobileVoiceCommit} isProcessing={isFormatting} />}
        </div>
    );
}
