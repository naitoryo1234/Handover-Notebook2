import { z } from 'zod';

// Shared Schemas
export const PatientSchema = z.object({
    id: z.string().optional(), // for update
    name: z.string().min(1, '氏名は必須です'),
    kana: z.string().min(1, 'ふりがなは必須です'),
    phone: z.string().optional(),
    birthDate: z.string().optional(), // HTML Input type="date" returns string
    gender: z.string().optional(),
    address: z.string().optional(),
    memo: z.string().optional(),
});

export type PatientInput = z.infer<typeof PatientSchema>;

export const RecordSchema = z.object({
    id: z.string().optional(),
    patientId: z.string().min(1),
    visitDate: z.string().optional(), // DateTime
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
    tags: z.array(z.string()).optional(), // UI handles Array, DB stores JSON
    staffId: z.string().optional().or(z.literal('')),
}).refine(data => {
    // 少なくとも1つのフィールドに入力があることを確認
    const s = data.subjective?.trim() || '';
    const o = data.objective?.trim() || '';
    const a = data.assessment?.trim() || '';
    const p = data.plan?.trim() || '';
    return s.length > 0 || o.length > 0 || a.length > 0 || p.length > 0;
}, {
    message: "記録の内容が空です。いずれかのフィールドを入力してください。",
    path: ["subjective"] // エラーを表示するフィールド（代表）
});

export type RecordInput = z.infer<typeof RecordSchema>;

export const StaffSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, '氏名は必須です'),
    role: z.string().default('Director'),
    active: z.boolean().optional(),
});

export type StaffInput = z.infer<typeof StaffSchema>;

// Appointment Schema (予約)
export const AppointmentSchema = z.object({
    patientId: z.string().min(1, '顧客を選択してください'),
    visitDate: z.string().min(1, '日付を選択してください'),
    visitTime: z.string().min(1, '時間を選択してください'),
    duration: z.coerce.number().min(15, '15分以上を指定してください').max(480, '8時間以内を指定してください').optional().default(60),
    staffId: z.string().optional().or(z.literal('')),
    memo: z.string().optional(),
    adminMemo: z.string().optional(),
    operatorId: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof AppointmentSchema>;

// Timeline Memo Schema (タイムラインメモ)
export const TimelineMemoSchema = z.object({
    patientId: z.string().min(1, '顧客IDが必要です'),
    content: z.string().min(1, 'メモ内容を入力してください'),
    type: z.enum(['memo', 'record']).default('memo'),
    flags: z.array(z.string()).optional().default([]),
});

export type TimelineMemoInput = z.infer<typeof TimelineMemoSchema>;

