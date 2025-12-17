// =========================================
// GENERICプリセット（ベース・デフォルト）
// =========================================
// すべての業態で共通して使える汎用的な表現
// 各業態プリセットはこれを継承して差分のみ上書きする
const GENERIC = {
    PATIENT: 'お客様',
    RECORD: '記録',
    APPOINTMENT: '予約',
    STAFF: '担当者',
    SHOP: '当店',
    VISIT: '来店',
    TAG_EXAMPLE: '常連',
    ROLE_DIRECTOR: '責任者',
    ROLE_THERAPIST: 'スタッフ',
    ROLE_CLERK: '受付',
    ROLE_OTHER: 'その他',
    // AI取込・フォームの例文
    RECORD_EXAMPLE_MEMO: '前回の内容を確認\n気になる点を聞き取り',
    RECORD_EXAMPLE_S: '今日の状態を確認',
    RECORD_EXAMPLE_O: '状態を観察',
    RECORD_EXAMPLE_A: 'サービスを提供',
    RECORD_EXAMPLE_P: '次回の予定を確認',
    PATIENT_EXAMPLE_MEMO: '紹介で来店',
    TAG_OPTIONS: ['常連', '新規', 'VIP', '要フォロー'],
} as const;

// =========================================
// 業態別プリセット（GENERICからの差分）
// =========================================
const PRESETS = {
    // 汎用（デフォルト）
    GENERIC: { ...GENERIC },

    // 鍼灸院・クリニック向け
    CLINIC: {
        ...GENERIC,
        PATIENT: '患者様',
        RECORD: 'カルテ',
        SHOP: '当院',
        VISIT: '来院',
        TAG_EXAMPLE: '腰痛',
        ROLE_DIRECTOR: '院長',
        ROLE_THERAPIST: '施術者',
        ROLE_CLERK: '受付・事務',
        RECORD_EXAMPLE_MEMO: '腰痛い、昨日重いもの持った\n右腰圧痛、前屈で増強\n腰鍼した、電気も',
        RECORD_EXAMPLE_S: '「腰が痛い」「昨晩から」',
        RECORD_EXAMPLE_O: '可動域制限あり...',
        RECORD_EXAMPLE_A: '鍼通電を実施',
        RECORD_EXAMPLE_P: '次回3日後',
        PATIENT_EXAMPLE_MEMO: '糖尿病の持病があります',
        TAG_OPTIONS: ['腰痛', '肩こり', '首の痛み', '膝痛', '頭痛', '初診', '再診', '鍼治療', '灸', 'マッサージ', '電気療法', '急性', '慢性'],
    },

    // サロン・美容室向け（例）
    SALON: {
        ...GENERIC,
        RECORD: '施術記録',
        ROLE_DIRECTOR: '店長',
        ROLE_THERAPIST: 'スタイリスト',
        ROLE_CLERK: 'レセプション',
        TAG_EXAMPLE: 'カットモデル',
        RECORD_EXAMPLE_MEMO: 'カット希望\n前回と同じスタイル',
        RECORD_EXAMPLE_S: 'ヘアスタイルの希望',
        RECORD_EXAMPLE_O: '髪質・状態を確認',
        RECORD_EXAMPLE_A: 'カット・カラーを実施',
        RECORD_EXAMPLE_P: '次回1ヶ月後',
        PATIENT_EXAMPLE_MEMO: 'アレルギー注意',
        TAG_OPTIONS: ['カット', 'カラー', 'パーマ', 'トリートメント', '新規', '常連', 'モデル'],
    },
} as const;

// =========================================
// ★設定: アプリ全体の用語セットを切り替え
// =========================================
// 'GENERIC' | 'CLINIC' | 'SALON' から選択
// 配布時にここを変更するか、将来的には環境変数での切り替えも可能
export type PresetKey = keyof typeof PRESETS;
export const APP_TYPE: PresetKey = 'GENERIC';

export const TERMS = PRESETS[APP_TYPE];

export const LABELS = {
    // 汎用的なシステムメッセージのみ保持
    DIALOG: {
        DEFAULT_CONFIRM: '確認',
        DEFAULT_CANCEL: 'キャンセル',
    },
    COMMON: {
        NO_DATA: 'データがありません',
        LOADING: '読み込み中...',
        SEARCH: '検索',
        HISTORY: '履歴',
        ATTENTION: '要確認',
        RECENT: '最近見た',
        SEARCH_RESULT: '検索結果',
        MENU_EDIT: '編集',
        MENU_DELETE: '削除',
        UPDATE: '更新',
        CHANGE: '変更',
        NEW: '新規',
        PROCESSING: '処理中...',
        SAVE: '保存',
        UPDATING: '更新中...',
        ALL: 'すべて',
        TOTAL_COUNT: (count: number) => `全 ${count} 件`,
        CLEAR: '解除',
        NONE: 'なし',
        FULL_TEXT: '全文',
        OPERATION: '操作',
        CREATE: '作成',
        STATUS: '状態',
        NAV_PREV: '前日',
        NAV_NEXT: '翌日',
        NAV_TODAY: '今日',
        NAV_TOMORROW: '明日',
        NAV_WEEK: '+1週',
        NAV_ALL_PERIOD: '全期間',
    },
    FORM: {
        DATE_TIME: '日時・時間',
        SELECT_STAFF: (staffTerm: string) => `${staffTerm} (未定)`,
        MEMO_PLACEHOLDER: '例: 電話予約 抜糸希望',
        SUBMIT_CREATING: (term: string) => `${term}中...`,
        SUBMIT_CONFIRM: (term: string) => `${term}を確定`,
        DATE: '日付',
        TIME_DURATION: '時間 & 所要時間',
        UNSPECIFIED: '-- 指定なし (未定) --',
        MEMO_PATIENT: '受付メモ',
        MEMO_PATIENT_PLACEHOLDER: '患者様からの要望など',
        MEMO_ADMIN_PLACEHOLDER: 'スタッフ間での注意事項など（右カラムの要確認に表示されます）',
        RESOLVED_SUFFIX: ' (確認済)',
        RESOLVE_ACTION: '確認済みにする（アラート解除）',
        UNRESOLVE_ACTION: '未確認に戻す',
    },
    DASHBOARD: {
        TITLE: `本日の${TERMS.VISIT}予定`,
        SECTION_UPCOMING: 'これからの予定',
        SECTION_PAST: '完了・キャンセル',
        NO_APPOINTMENTS: '予定はありません',
        NO_UPCOMING_APPOINTMENTS: 'これからの予定はありません',
        UNASSIGNED_ALERT: (count: number) => `${TERMS.STAFF}未定の${TERMS.APPOINTMENT}が ${count} 件あります`,
        MEMO_ALERT: (count: number) => `未確認の申し送り: ${count}件`,
        MEMO_ALERT_ALL: (count: number) => `すべての未確認申し送り: ${count}件`,
        NO_ATTENTION: '要確認事項はありません',
        NO_HISTORY: '履歴はありません',
        NO_SEARCH_RESULT: (query: string) => query ? `該当する${TERMS.PATIENT}が見つかりません` : 'キーワードを入力して検索',
        SEARCH_PLACEHOLDER: `${TERMS.PATIENT}検索（氏名・ふりがな）`,
        PLEASE_SEARCH: '検索してください',
    },
    // Appointment用の特殊な文言は一旦保持（後でコンポーネント側に移動検討可だが、ロジック依存度が高いので維持）
    APPOINTMENT: {
        CANCEL_CONFIRM_TITLE: `この${TERMS.APPOINTMENT}をキャンセルしますか？`,
        CANCEL_CONFIRM_DESC: `キャンセルした${TERMS.APPOINTMENT}は${TERMS.APPOINTMENT}一覧に「キャンセル」と表示されます。`,
        CANCEL_EXECUTE: '予約を取り消す',
        CHECKIN_CONFIRM_TITLE: (name: string) => `${name}様の${TERMS.VISIT}を記録しますか？`,
        CHECKIN_EXECUTE: '記録する',
        MEMO_RESOLVE_TITLE: '申し送り事項を確認済みにしますか？',
        MEMO_UNRESOLVE_TITLE: '申し送り事項を未確認に戻しますか？',
        MEMO_RESOLVE_DESC: '確認済みにすると、この項目のアラート表示が解除されます。',
        MEMO_UNRESOLVE_DESC: '未確認に戻すと、再度アラート表示になります。',
        CHANGE_STATUS: '変更する',
        ADMIN_MEMO: '申し送り事項',
        ADMIN_MEMO_RESOLVED: '確認済',
        CLICK_TO_RESOLVE: 'クリックで確認済みにする',
        CLICK_TO_UNRESOLVE: 'クリックで未確認に戻す',
        ENTER_RECORD: (record: string) => `${record}記入`,
        CHECKIN_ACTION: '受付 (Check-in)',
        EDIT_TITLE: '予約日時の変更',
        FILTER_STAFF_ALL: '担当: 全員',
        FILTER_PAST: '過去含',
        FILTER_PAST_TOOLTIP: '過去の予約を表示するか切り替えます',
        MSG_NO_DISPLAY_DATA: '表示する予約はありません',
        ADMIN_MEMO_PREFIX: '事務用申し送り:',
        MEMO_TITLE: '予約メモ',
        MANAGER_TITLE: '予約管理',
        MANAGER_DESC: '全ての予約の確認・変更・キャンセルを行えます',
    },
    STAFF: {
        TITLE: 'スタッフ管理',
        DESC: (record: string, appointment: string) => `${record}や${appointment}に紐付ける担当者を管理します。ここで登録したスタッフは、${record}作成画面や${appointment}画面の選択肢として表示されます。`,
        NEW_TITLE: '新規スタッフ登録',
        EDIT_TITLE: 'スタッフ情報を編集',
        NAME: '氏名',
        ROLE: '役割',
        NAME_PLACEHOLDER: '例: 佐藤 花子',
        ADD: '追加する',
        CANCEL_EDIT: '編集をキャンセル',
        LIST_TITLE: '登録スタッフ一覧',
        ROLES: {
            DIRECTOR: TERMS.ROLE_DIRECTOR,
            THERAPIST: TERMS.ROLE_THERAPIST,
            CLERK: TERMS.ROLE_CLERK,
            OTHER: TERMS.ROLE_OTHER,
        },
        STATUS: {
            ACTIVE: '有効',
            INACTIVE: '無効',
        },
        ACTIONS: {
            ACTIVATE: '有効にする',
            DEACTIVATE: '無効にする',
            TOGGLE_CONFIRM_TITLE: (name: string, toActive: boolean) => `${name}さんを${toActive ? '有効' : '無効'}にしますか？`,
            TOGGLE_CONFIRM_DESC: (toActive: boolean) => toActive ? '有効にすると、担当者選択リストに再表示されます。' : '無効にすると、担当者選択リストから非表示になります。',
        },
        NO_DATA: 'スタッフが登録されていません',
    },
    STATUS: {
        SUCCESS: '保存しました',
        ERROR: 'エラーが発生しました',
        ARRIVED: `${TERMS.VISIT}済み`,
        CANCELLED: 'キャンセル',
        DONE: '完了', // 施術完了
        COMPLETED_ACTION: '完了してリストから消す', // 手動消込
        IN_PROGRESS: '対応中', // 来院済みだが完了していない
        UNASSIGNED: `${TERMS.STAFF}未定`,
        JUST_NOW: `${TERMS.VISIT}時刻`,
        COMING_SOON: (mins: number) => `あと${mins}分`,
        PAST: '【過去】',
        UNASSIGNED_SHORT: '担当未定',
        UNRESOLVED_SHORT: '未確認',
        COMPLETE_DESC: '完了すると、リストから非表示になります。',
        COMPLETE_EXECUTE: '完了する',
    },
    PATIENT_FORM: {
        NAME: '氏名',
        KANA: 'ふりがな',
        PHONE: '電話番号',
        BIRTHDATE: '生年月日',
        GENDER: '性別',
        MEMO: 'メモ (特徴など)',
        TAGS: 'タグ',
        TAGS_PLACEHOLDER: `Enterで追加 (例: ${TERMS.TAG_EXAMPLE})`,
        PLACEHOLDER_NAME: '山田 太郎',
        PLACEHOLDER_KANA: 'やまだ たろう',
        PLACEHOLDER_PHONE: '090-1234-5678',
        PLACEHOLDER_DATE: 'YYYY-MM-DD',
        GENDER_OPTIONS: {
            MALE: '男性',
            FEMALE: '女性',
            OTHER: 'その他',
            SELECT: '選択してください',
        },
        SUBMIT: '登録する',
        CONFIRM_CREATE_MODE: 'この内容でフォームを作成',
        BACK_TO_TEXT: 'テキストに戻る',
        MANUAL_MODE: '通常入力',
        AI_MODE_BTN: 'AI取込 (Beta)',
    },
    AI_MODE: {
        TITLE: 'データ自動解析',
        DESC: `既存の${TERMS.RECORD}やExcelなどから、以下の形式でテキストを貼り付けると自動入力できます。`,
        NOTE_EDITABLE: '※内容を直接修正できます',
        ANALYZE_BUTTON: '解析して確認',
        PLACEHOLDER: 'ここにテキストを貼り付けてください...',
        GUIDE: {
            TITLE: '新規登録用プロンプト',
            DESC: `LINEやメールでの問い合わせ文章から、${TERMS.PATIENT}登録データを抽出するためのプロンプトです。AIチャットツールに貼り付けてご使用ください。`,
            BUTTON: 'プロンプトをコピー',
        }
    },
    VALIDATION: {
        DUPLICATE_TITLE: `似ている${TERMS.PATIENT}が見つかりました`,
        DUPLICATE_DESC: `以下の${TERMS.PATIENT}は既に登録されています。同一人物の可能性があります。`,
        DUPLICATE_IGNORE: '※ 別人の場合は、そのまま新規登録を行ってください',
        NOT_THIS_PERSON: 'この人ではない（続行）',
    },
    // Phase 10 追加分
    FILTER: {
        CONDITION: '検索条件',
        RESULT: '結果',
        UNIT: '件',
        CLEAR: '条件をクリア',
        RESET_ALL: '条件をリセットしてすべて表示',
        NO_MATCH: `条件に一致する${TERMS.APPOINTMENT}は見つかりませんでした。`,
    },
    SETTINGS: {
        TITLE: 'データ管理',
        DESC: 'システムのデータを管理します。定期的にバックアップを取得することをお勧めします。',
        BACKUP_SECTION: 'データベースバックアップ',
        BACKUP_DESC: '現在のデータベースファイル (local.db) をダウンロードします。',
        BACKUP_BTN: 'バックアップを保存',
        SYSTEM_SETTINGS: 'システム設定',
    }
} as const;
