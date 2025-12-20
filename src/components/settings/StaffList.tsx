'use client';

import { useState, useTransition } from 'react';
import { Staff } from '@prisma/client';
import { Plus, Edit2, ToggleLeft, ToggleRight, Loader2, User } from 'lucide-react';
import { toggleStaffStatus, createStaff, updateStaff } from '@/actions/staffActions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface StaffListProps {
    staff: Staff[];
    onStaffChange: (staff: Staff[]) => void;
}

interface StaffFormData {
    name: string;
    role: string;
}

export function StaffList({ staff, onStaffChange }: StaffListProps) {
    const [isPending, startTransition] = useTransition();
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState<StaffFormData>({ name: '', role: 'Director' });
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const roles = [
        { value: 'Director', label: '院長' },
        { value: 'Therapist', label: '施術者' },
        { value: 'Receptionist', label: '受付' },
        { value: 'Assistant', label: 'アシスタント' },
    ];

    const handleToggleStatus = async (staffMember: Staff) => {
        setTogglingId(staffMember.id);
        startTransition(async () => {
            const result = await toggleStaffStatus(staffMember.id, staffMember.active);
            if (result.success) {
                onStaffChange(
                    staff.map(s =>
                        s.id === staffMember.id
                            ? { ...s, active: !s.active }
                            : s
                    )
                );
            }
            setTogglingId(null);
        });
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('role', formData.role);

        startTransition(async () => {
            const result = await createStaff(fd);
            if (result.success) {
                setIsAddModalOpen(false);
                setFormData({ name: '', role: 'Director' });
                // ページをリロードして最新データを取得
                window.location.reload();
            }
        });
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;

        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('role', formData.role);

        startTransition(async () => {
            const result = await updateStaff(editingStaff.id, fd);
            if (result.success) {
                onStaffChange(
                    staff.map(s =>
                        s.id === editingStaff.id
                            ? { ...s, name: formData.name, role: formData.role }
                            : s
                    )
                );
                setEditingStaff(null);
            }
        });
    };

    const openEditModal = (staffMember: Staff) => {
        setFormData({ name: staffMember.name, role: staffMember.role });
        setEditingStaff(staffMember);
    };

    const getRoleLabel = (role: string) => {
        return roles.find(r => r.value === role)?.label || role;
    };

    return (
        <div>
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-500" />
                    <h2 className="font-semibold text-slate-800">スタッフ一覧</h2>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {staff.filter(s => s.active).length}名 有効
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={() => {
                        setFormData({ name: '', role: 'Director' });
                        setIsAddModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    追加
                </Button>
            </div>

            {/* 一覧 */}
            <div className="divide-y divide-slate-100">
                {staff.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        スタッフが登録されていません
                    </div>
                ) : (
                    staff.map((member) => (
                        <div
                            key={member.id}
                            className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${!member.active ? 'opacity-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.active ? 'bg-indigo-500' : 'bg-slate-400'
                                    }`}>
                                    {member.name[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{member.name}</p>
                                    <p className="text-xs text-slate-500">{getRoleLabel(member.role)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditModal(member)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="編集"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(member)}
                                    disabled={togglingId === member.id}
                                    className={`p-2 rounded-lg transition-colors ${member.active
                                            ? 'text-emerald-600 hover:bg-emerald-50'
                                            : 'text-slate-400 hover:bg-slate-100'
                                        }`}
                                    title={member.active ? '無効化' : '有効化'}
                                >
                                    {togglingId === member.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : member.active ? (
                                        <ToggleRight className="w-5 h-5" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 追加モーダル */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>スタッフを追加</DialogTitle>
                        <DialogDescription>
                            新しいスタッフを登録します
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStaff} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                名前
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="山田 太郎"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                役職
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    '追加'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 編集モーダル */}
            <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>スタッフを編集</DialogTitle>
                        <DialogDescription>
                            スタッフ情報を編集します
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStaff} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                名前
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                役職
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingStaff(null)}
                            >
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    '更新'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
