import { LABELS, TERMS } from './labels';
import { RECORD_FIELDS } from './recordFields';

// Config-Driven Form Definitions

export const PatientFormConfig = [
    { name: 'name', label: LABELS.PATIENT_FORM.NAME, type: 'text', required: true, placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_NAME },
    { name: 'kana', label: LABELS.PATIENT_FORM.KANA, type: 'text', required: true, placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_KANA },
    { name: 'phone', label: LABELS.PATIENT_FORM.PHONE, type: 'tel', placeholder: LABELS.PATIENT_FORM.PLACEHOLDER_PHONE },
    { name: 'birthDate', label: LABELS.PATIENT_FORM.BIRTHDATE, type: 'date' },
    {
        name: 'gender', label: LABELS.PATIENT_FORM.GENDER, type: 'select', options: [
            LABELS.PATIENT_FORM.GENDER_OPTIONS.MALE,
            LABELS.PATIENT_FORM.GENDER_OPTIONS.FEMALE,
            LABELS.PATIENT_FORM.GENDER_OPTIONS.OTHER
        ]
    },
    { name: 'memo', label: LABELS.PATIENT_FORM.MEMO, type: 'textarea', rows: 3 },
    {
        name: 'tags',
        label: LABELS.PATIENT_FORM.TAGS,
        type: 'tags',
        placeholder: LABELS.PATIENT_FORM.TAGS_PLACEHOLDER,
        options: []
    }
];

// 記録フォーム設定（RECORD_FIELDSから動的生成）
export const RecordFormConfig = [
    { name: 'visitDate', label: `${TERMS.VISIT}日時`, type: 'datetime-local', required: true },
    // SOAPフィールドは recordFields.ts から動的に生成
    ...RECORD_FIELDS.map(field => ({
        name: field.dbColumn,
        label: field.displayLabel,
        type: 'textarea' as const,
        rows: field.rows,
        placeholder: field.placeholder,
    })),
    {
        name: 'tags',
        label: 'タグ',
        type: 'tags',
        placeholder: `例: ${TERMS.TAG_EXAMPLE}`,
        options: TERMS.TAG_OPTIONS as unknown as string[]
    },
];

