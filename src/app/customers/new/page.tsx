'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { addPatientSimple } from '@/actions/patientActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function NewCustomerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await addPatientSimple({
                name: formData.get('name') as string,
                kana: formData.get('kana') as string,
                phone: formData.get('phone') as string || undefined,
                birthDate: formData.get('birthDate') as string || undefined,
                memo: formData.get('memo') as string || undefined,
            });

            if (result.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(result.error || '登録に失敗しました');
            }
        } catch {
            setError('登録中にエラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-8">
            {/* ヘッダー */}
            <div>
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    ダッシュボードに戻る
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">新規顧客の登録</h1>
                <p className="text-slate-600 mt-1 text-sm">基本情報を入力して顧客カルテを作成します</p>
            </div>

            {/* フォーム */}
            <Card className="overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 名前（必須） */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-slate-700">
                                    お名前 <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="例: 山田 太郎"
                                />
                            </div>

                            {/* カナ（必須） */}
                            <div className="space-y-2">
                                <label htmlFor="kana" className="text-sm font-bold text-slate-700">
                                    フリガナ <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    id="kana"
                                    name="kana"
                                    required
                                    placeholder="例: ヤマダ タロウ"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 電話番号 */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-bold text-slate-700">
                                    電話番号
                                </label>
                                <Input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="090-0000-0000"
                                />
                            </div>

                            {/* 生年月日 */}
                            <div className="space-y-2">
                                <label htmlFor="birthDate" className="text-sm font-bold text-slate-700">
                                    生年月日
                                </label>
                                <Input
                                    type="date"
                                    id="birthDate"
                                    name="birthDate"
                                />
                            </div>
                        </div>

                        {/* メモ */}
                        <div className="space-y-2">
                            <label htmlFor="memo" className="text-sm font-bold text-slate-700">
                                初期メモ
                                <span className="ml-2 text-xs font-normal text-slate-400">申し送り事項や特記事項があれば入力してください</span>
                            </label>
                            <Textarea
                                id="memo"
                                name="memo"
                                rows={4}
                                className="resize-y min-h-[100px]"
                                placeholder="来店動機や身体の状態など..."
                            />
                        </div>
                    </div>

                    {/* エラー表示 */}
                    {error && (
                        <div className="mx-8 mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    {/* アクションフッター */}
                    <div className="bg-slate-50 px-8 py-4 flex items-center justify-between border-t border-slate-200">
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            キャンセル
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="shadow-sm hover:shadow active:scale-95"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? '登録中...' : '登録する'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
