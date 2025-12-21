'use client';

import { useState, useRef } from 'react';
import { X, Mic, MicOff, Loader2, Search, Check, AlertCircle, Calendar, FileText } from 'lucide-react';
import { transcribeAudio } from '@/actions/groqActions';
import { formatVoiceText } from '@/actions/geminiActions';
import { addTimelineMemo, searchPatientsForSelect } from '@/actions/patientActions';
import { toast } from 'sonner';

interface QuickRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'input' | 'matching' | 'confirm' | 'saving';

interface MatchedPatient {
    id: string;
    name: string;
    kana: string;
    lastVisit: string | null;
    lastVisitType: 'appointment' | 'record' | null;
}

export function QuickRecordModal({ isOpen, onClose }: QuickRecordModalProps) {
    const [step, setStep] = useState<Step>('input');
    const [inputText, setInputText] = useState('');
    const [formattedText, setFormattedText] = useState('');
    const [extractedName, setExtractedName] = useState('');
    const [candidates, setCandidates] = useState<MatchedPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<MatchedPatient | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const reset = () => {
        setStep('input');
        setInputText('');
        setFormattedText('');
        setExtractedName('');
        setCandidates([]);
        setSelectedPatient(null);
        setIsRecording(false);
        setIsProcessing(false);
        setError('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // 音声録音開始
    const startRecording = async () => {
        if (!navigator.mediaDevices) {
            toast.error('マイクを使用できません。HTTPS環境が必要です。');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            toast.error('マイクのアクセス許可が必要です');
        }
    };

    // 音声録音停止 & 文字起こし
    const stopRecording = () => {
        if (!mediaRecorderRef.current || !isRecording) return;

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setIsProcessing(true);

            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                const result = await transcribeAudio(formData);

                if (result.success && result.text) {
                    setInputText(prev => prev ? prev + '\n' + result.text : result.text);
                    toast.success('音声を入力しました');
                } else {
                    toast.error(result.error || '文字起こしに失敗しました');
                }
            } catch {
                toast.error('エラーが発生しました');
            } finally {
                setIsProcessing(false);
                mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
            }
        };

        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    // AI解析 & 顧客マッチング
    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            toast.error('テキストを入力してください');
            return;
        }

        setIsProcessing(true);
        setError('');
        setStep('matching');

        try {
            // AI整形で顧客名を抽出
            const formatResult = await formatVoiceText(inputText);

            if (!formatResult.success || !formatResult.data) {
                setError('AI解析に失敗しました');
                setStep('input');
                return;
            }

            const customerName = formatResult.data.extracted_data.customer_name || '';
            setFormattedText(formatResult.data.formatted_text);
            setExtractedName(customerName);

            if (!customerName) {
                setError('顧客名を特定できませんでした。名前を含めて話してください。');
                setStep('input');
                return;
            }

            // 顧客検索
            const patients = await searchPatientsForSelect(customerName);

            if (patients.length === 0) {
                setError(`「${customerName}」に一致する顧客が見つかりませんでした`);
                setStep('input');
                return;
            }

            const mapped: MatchedPatient[] = patients.map(p => ({
                id: p.id,
                name: p.name,
                kana: p.kana,
                lastVisit: p.lastVisit,
                lastVisitType: p.lastVisitType
            }));

            setCandidates(mapped);

            if (patients.length === 1) {
                // 1件だけなら自動選択
                setSelectedPatient(mapped[0]);
                setStep('confirm');
            } else {
                // 複数候補 → 選択UI
                setStep('matching');
            }
        } catch (e: unknown) {
            console.error(e);
            setError('処理中にエラーが発生しました');
            setStep('input');
        } finally {
            setIsProcessing(false);
        }
    };

    // 顧客を選択
    const handleSelectPatient = (patient: MatchedPatient) => {
        setSelectedPatient(patient);
        setStep('confirm');
    };

    // 保存実行
    const handleSave = async () => {
        if (!selectedPatient) return;

        setStep('saving');

        try {
            const result = await addTimelineMemo(
                selectedPatient.id,
                formattedText || inputText,
                'memo',
                []
            );

            if (result.success) {
                toast.success(`${selectedPatient.name}さんの記録を追加しました`);
                handleClose();
            } else {
                toast.error(result.error || '保存に失敗しました');
                setStep('confirm');
            }
        } catch {
            toast.error('保存中にエラーが発生しました');
            setStep('confirm');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                        🎤 クイック記録
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step: Input */}
                    {step === 'input' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                顧客名を含めて話してください。例: 「今日来た山田さんは腰が痛いと言っていました」
                            </p>

                            <div className="relative">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    rows={5}
                                    placeholder="音声入力またはテキストを入力..."
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-base"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isProcessing}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isRecording
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {isRecording ? (
                                        <>
                                            <MicOff className="w-5 h-5" />
                                            録音停止
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="w-5 h-5" />
                                            音声入力
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={!inputText.trim() || isProcessing}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            解析中...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            顧客を検索
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Matching (複数候補) */}
                    {step === 'matching' && candidates.length > 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                「{extractedName}」に一致する顧客が{candidates.length}件見つかりました。選択してください。
                            </p>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {candidates.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => handleSelectPatient(patient)}
                                        className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shrink-0">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800">{patient.name}</p>
                                            <p className="text-sm text-slate-500">{patient.kana}</p>
                                        </div>
                                        {patient.lastVisit && (
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    {patient.lastVisitType === 'appointment' ? (
                                                        <Calendar className="w-3 h-3" />
                                                    ) : (
                                                        <FileText className="w-3 h-3" />
                                                    )}
                                                    <span>直近</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-600 tabular-nums">
                                                    {new Date(patient.lastVisit).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep('input')}
                                className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm"
                            >
                                ← 入力に戻る
                            </button>
                        </div>
                    )}

                    {/* Step: Confirm */}
                    {step === 'confirm' && selectedPatient && (
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl">
                                <p className="text-sm text-indigo-600 font-medium mb-1">記録先</p>
                                <p className="text-lg font-bold text-indigo-900">{selectedPatient.name} さん</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-slate-500 font-medium">記録内容（編集可能）</p>
                                <textarea
                                    value={formattedText || inputText}
                                    onChange={(e) => setFormattedText(e.target.value)}
                                    rows={8}
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm text-slate-700"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setStep(candidates.length > 1 ? 'matching' : 'input');
                                    }}
                                    className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                >
                                    戻る
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                                >
                                    <Check className="w-5 h-5" />
                                    保存する
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Saving */}
                    {step === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-600">保存中...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
