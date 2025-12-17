'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { transcribeAudio } from '@/actions/groqActions';

interface MobileVoiceInputProps {
    onCommit: (text: string) => void;
    isProcessing?: boolean;
}

export function MobileVoiceInput({ onCommit, isProcessing = false }: MobileVoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState(''); // Stores final text to edit if needed
    const [isOpen, setIsOpen] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        // Safe check for secure context (HTTPS/localhost)
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
            setIsOpen(true);
            setTranscript(''); // Clear previous
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('マイクへのアクセス許可が必要です');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox typical default
                await processAudio(audioBlob);

                // Stop all tracks to release mic
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            // Append file with explicit name and extension for server-side handling
            formData.append('audio', audioBlob, 'recording.webm');

            const result = await transcribeAudio(formData);

            if (result.success && result.text) {
                setTranscript(result.text);
            } else {
                toast.error(result.error || '文字起こしに失敗しました');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            toast.error('サーバー通信エラーが発生しました');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleClose = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
        setIsOpen(false);
        setTranscript('');
    };

    const handleCommit = () => {
        if (transcript.trim()) {
            onCommit(transcript);
            handleClose();
        }
    };

    // Global Floating Action Button (FAB)
    if (!isOpen) {
        return (
            <Button
                onClick={startRecording}
                disabled={isProcessing}
                className={cn(
                    "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center lg:hidden",
                    isProcessing && "opacity-70 cursor-not-allowed"
                )}
            >
                {isProcessing ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                    <Mic className="h-8 w-8 text-white" />
                )}
            </Button>
        );
    }

    // Modal Overlay
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl p-6 min-h-[50vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {isRecording ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                録音中...
                            </>
                        ) : isTranscribing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                AI処理中...
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4 text-slate-900" />
                                録音完了
                            </>
                        )}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-6 w-6 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 bg-slate-50 rounded-xl p-4 mb-6 overflow-y-auto border border-slate-100 shadow-inner">
                    {isTranscribing ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                            <p className="text-sm">音声をテキストに変換しています...</p>
                        </div>
                    ) : (
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder={isRecording ? "お話しください..." : "変換されたテキストがここに表示されます"}
                            className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-lg text-slate-700 leading-relaxed"
                            readOnly={isRecording}
                        />
                    )}
                </div>

                <div className="flex gap-4">
                    {isRecording ? (
                        <Button
                            variant="destructive"
                            onClick={stopRecording}
                            className="w-full h-14 text-base font-bold shadow-lg shadow-red-200"
                        >
                            <Square className="mr-2 h-5 w-5 fill-current" /> 録音停止して変換
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={startRecording}
                                disabled={isTranscribing}
                                className="flex-1 h-14 text-base font-bold border-slate-200"
                            >
                                <Mic className="mr-2 h-5 w-5" /> 再録音
                            </Button>
                            <Button
                                onClick={handleCommit}
                                disabled={!transcript.trim() || isTranscribing}
                                className="flex-1 h-14 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            >
                                <Send className="mr-2 h-5 w-5" /> 完了
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

