import { TERMS, APP_TYPE } from './labels';

// =========================================
// 記録フィールド設定（DBカラム ↔ UIラベル マッピング）
// =========================================
// DBカラム名は固定（subjective, objective, assessment, plan）
// UIラベルは業態プリセット（TERMS）に応じて変化

export type RecordFieldKey = 'subjective' | 'objective' | 'assessment' | 'plan';

export interface RecordFieldConfig {
    /** DBカラム名（固定） */
    dbColumn: RecordFieldKey;
    /** 短縮ラベル（例: "S"） */
    shortLabel: string;
    /** 表示用ラベル（例: "S (主訴)"） */
    displayLabel: string;
    /** ラベルの色（Tailwindクラス用） */
    colorClass: string;
    /** プレースホルダー */
    placeholder: string;
    /** textareaの行数 */
    rows: number;
}

// =========================================
// GENERICプリセットのフィールド定義
// =========================================
const GENERIC_FIELDS: RecordFieldConfig[] = [
    {
        dbColumn: 'subjective',
        shortLabel: 'S',
        displayLabel: 'S (お話)',
        colorClass: 'text-red-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'objective',
        shortLabel: 'O',
        displayLabel: 'O (観察)',
        colorClass: 'text-blue-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'assessment',
        shortLabel: 'A',
        displayLabel: 'A (対応)',
        colorClass: 'text-green-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'plan',
        shortLabel: 'P',
        displayLabel: 'P (次回)',
        colorClass: 'text-purple-400',
        placeholder: '',
        rows: 2,
    },
];

// =========================================
// CLINICプリセットのフィールド定義
// =========================================
const CLINIC_FIELDS: RecordFieldConfig[] = [
    {
        dbColumn: 'subjective',
        shortLabel: 'S',
        displayLabel: 'S (主訴)',
        colorClass: 'text-red-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'objective',
        shortLabel: 'O',
        displayLabel: 'O (所見)',
        colorClass: 'text-blue-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'assessment',
        shortLabel: 'A',
        displayLabel: 'A (施術・評価)',
        colorClass: 'text-green-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'plan',
        shortLabel: 'P',
        displayLabel: 'P (計画)',
        colorClass: 'text-purple-400',
        placeholder: '',
        rows: 2,
    },
];

// =========================================
// SALONプリセットのフィールド定義
// =========================================
const SALON_FIELDS: RecordFieldConfig[] = [
    {
        dbColumn: 'subjective',
        shortLabel: 'S',
        displayLabel: 'S (ご要望)',
        colorClass: 'text-red-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'objective',
        shortLabel: 'O',
        displayLabel: 'O (状態)',
        colorClass: 'text-blue-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'assessment',
        shortLabel: 'A',
        displayLabel: 'A (施術内容)',
        colorClass: 'text-green-400',
        placeholder: '',
        rows: 4,
    },
    {
        dbColumn: 'plan',
        shortLabel: 'P',
        displayLabel: 'P (次回のご提案)',
        colorClass: 'text-purple-400',
        placeholder: '',
        rows: 2,
    },
];

// =========================================
// プリセット別フィールド定義マップ
// =========================================
const FIELD_PRESETS = {
    GENERIC: GENERIC_FIELDS,
    CLINIC: CLINIC_FIELDS,
    SALON: SALON_FIELDS,
} as const;

// プレースホルダーをTERMSから設定
function applyPlaceholders(fields: RecordFieldConfig[]): RecordFieldConfig[] {
    return fields.map(field => {
        let placeholder = '';
        switch (field.dbColumn) {
            case 'subjective':
                placeholder = TERMS.RECORD_EXAMPLE_S;
                break;
            case 'objective':
                placeholder = TERMS.RECORD_EXAMPLE_O;
                break;
            case 'assessment':
                placeholder = TERMS.RECORD_EXAMPLE_A;
                break;
            case 'plan':
                placeholder = TERMS.RECORD_EXAMPLE_P;
                break;
        }
        return { ...field, placeholder };
    });
}

/**
 * 現在の業態プリセットに応じた記録フィールド設定を取得
 */
export function getRecordFields(): RecordFieldConfig[] {
    // APP_TYPE を直接使用してプリセットを取得
    const baseFields = FIELD_PRESETS[APP_TYPE];
    return applyPlaceholders(baseFields);
}

/**
 * エクスポート: 現在のプリセットのフィールド設定
 * コンポーネントから直接使用可能
 */
export const RECORD_FIELDS = getRecordFields();

/**
 * フィールド名の配列（バリデーション等で使用）
 */
export const RECORD_FIELD_KEYS: RecordFieldKey[] = ['subjective', 'objective', 'assessment', 'plan'];
