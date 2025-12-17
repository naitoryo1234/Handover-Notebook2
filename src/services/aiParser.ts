// Basic AI Text Parser
// Parses text like:
// [S] 痛い
// [O] 腫れてる
// ...

export interface ParsedRecord {
    // Clinical Record Fields
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    tags: string[];
    visitDate?: string;

    // Patient Profile Fields (Optional)
    name?: string;
    kana?: string;
    birthDate?: string;
    phone?: string;
    gender?: string;
    memo?: string;
}

export function parseAiText(text: string): ParsedRecord {
    const result: ParsedRecord = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        tags: [],
        memo: '', // Initialize to prevent "undefined" string
    };

    const lines = text.split('\n');
    let currentSection: keyof ParsedRecord | null = 'subjective'; // Default to S if no header found first

    // Regex triggers for SOAP (existing)
    const triggers: Record<string, keyof ParsedRecord> = {
        'S': 'subjective', 's': 'subjective', 'Subjective': 'subjective', '主訴': 'subjective',
        'O': 'objective', 'o': 'objective', 'Objective': 'objective', '所見': 'objective',
        'A': 'assessment', 'a': 'assessment', 'Assessment': 'assessment', '評価': 'assessment', '施術': 'assessment',
        'P': 'plan', 'p': 'plan', 'Plan': 'plan', '計画': 'plan', '方針': 'plan',

        // Patient Profile Triggers
        'Memo': 'memo', 'メモ': 'memo', '備考': 'memo',
    };

    const tagTrigger = /^(Tags|タグ|Keywords)[:：]/i;
    const dateTrigger = /^(Date|Visit|日付|来院日)[:：]/i;

    // Patient Info Triggers (Inline key-value mostly)
    const nameTrigger = /^(Name|氏名|名前)[:：]/i;
    const kanaTrigger = /^(Kana|ふりがな|フリガナ|カナ|かな)[:：]/i; // Added 'かな'
    const birthTrigger = /^(Birth|BirthDate|生年月日|誕生日)[:：]/i;
    const phoneTrigger = /^(Phone|Tel|電話|携帯)[:：]/i;
    const genderTrigger = /^(Gender|Sex|性別)[:：]/i;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // --- Profile Fields (Inline checks) ---
        if (nameTrigger.test(trimmed)) {
            result.name = trimmed.replace(nameTrigger, '').trim();
            currentSection = null; continue;
        }
        if (kanaTrigger.test(trimmed)) {
            result.kana = trimmed.replace(kanaTrigger, '').trim();
            currentSection = null; continue;
        }
        if (birthTrigger.test(trimmed)) {
            const content = trimmed.replace(birthTrigger, '').trim();
            // Simple standardization to YYYY-MM-DD if possible, else keep as is
            const dateMatch = content.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
            if (dateMatch) {
                result.birthDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            } else {
                result.birthDate = content;
            }
            currentSection = null; continue;
        }
        if (phoneTrigger.test(trimmed)) {
            result.phone = trimmed.replace(phoneTrigger, '').trim();
            currentSection = null; continue;
        }
        if (genderTrigger.test(trimmed)) {
            const val = trimmed.replace(genderTrigger, '').trim();
            // Normalize
            result.gender = val.match(/男|Male/i) ? '男性' : val.match(/女|Female/i) ? '女性' : val;
            currentSection = null; continue;
        }
        // --------------------------------------

        // 1. Check for section headers
        // Regex fix: Use non-capturing group or alternative for multi-char headers like Memo
        // Matches: [S], [Memo], 【S】, 【メモ】, S:, Memo:

        // Bracket Match: [S], [Memo], [Subjective]
        const bracketMatch = trimmed.match(/^\[(SOAP|Memo|Subjective|Objective|Assessment|Plan|S|O|A|P|M)\]/i);

        // JP Bracket Match: 【S】, 【メモ】, 【主訴】
        const bracketJpMatch = trimmed.match(/^【(SOAP|Memo|主訴|所見|評価|施術|計画|方針|メモ|備考|S|O|A|P|M)】/i);

        // Colon Match: S:, Memo:, Subjective:
        const colonMatch = trimmed.match(/^(SOAP|Memo|Subjective|Objective|Assessment|Plan|S|O|A|P|M)\s*[:：\)\）]/i);

        // JP Keywords with various delimiters
        const jpKeyMatch = trimmed.match(/^(主訴|所見|評価|施術|計画|方針|メモ|備考)(\s*[:：\)\）]|\s+)/); // Added \s+ to allow "メモ 内容"

        // Complex CSV/Parenthesis Match: S (Subjective...), content
        // Matches: S (Subjective: ...), content OR S, content
        const complexHeaderMatch = trimmed.match(/^(S|O|A|P|M|Subjective|Objective|Assessment|Plan|Memo)\s*(?:\([^)]+\))?\s*[,:：]\s*/i);

        let foundKey: string | null = null;
        let contentStartRegex: RegExp | null = null;

        if (complexHeaderMatch) {
            foundKey = complexHeaderMatch[1];
            // Regex to strip the whole header including parenthesis and separator
            contentStartRegex = /^(S|O|A|P|M|Subjective|Objective|Assessment|Plan|Memo)\s*(?:\([^)]+\))?\s*[,:：]\s*/i;
        } else if (bracketMatch) {
            foundKey = bracketMatch[1];
            contentStartRegex = /^\[(SOAP|Memo|Subjective|Objective|Assessment|Plan|S|O|A|P|M)\]\s*/i;
        } else if (colonMatch) {
            foundKey = colonMatch[1];
            contentStartRegex = /^(SOAP|Memo|Subjective|Objective|Assessment|Plan|S|O|A|P|M)\s*[:：\)\）]\s*/i;
        } else if (bracketJpMatch) {
            foundKey = bracketJpMatch[1];
            contentStartRegex = /^【(SOAP|Memo|主訴|所見|評価|施術|計画|方針|メモ|備考|S|O|A|P|M)】\s*/i;
        }

        // Update triggers map for Single Char and Full words
        const extendedTriggers: Record<string, keyof ParsedRecord> = {
            ...triggers,
            'M': 'memo', 'm': 'memo',
            'Memo': 'memo', 'MEMO': 'memo',
            'Subjective': 'subjective', 'Objective': 'objective',
            'Assessment': 'assessment', 'Plan': 'plan',
        };

        if (foundKey) {
            // Check extendedTriggers
            // Normalize key: if 1 char, upper. If longer, keep as is or Title case matching?
            // Just check raw and Upper/Lower in map
            const key = foundKey;
            // Try direct match, Upper, Capitalized
            const targetSection: keyof ParsedRecord | undefined = extendedTriggers[key] || extendedTriggers[key.toUpperCase()] || extendedTriggers[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()];

            if (targetSection) {
                currentSection = targetSection;
                if (currentSection === 'tags' || currentSection === 'visitDate') continue;

                let content = trimmed;
                if (contentStartRegex) {
                    content = content.replace(contentStartRegex, '');
                }

                // Type guard to ensure currentSection is a string-appendable property
                if (currentSection === 'subjective' || currentSection === 'objective' || currentSection === 'assessment' || currentSection === 'plan' || currentSection === 'memo') {
                    if (content) {
                        result[currentSection] += (result[currentSection] ? '\n' : '') + content;
                    }
                }
                continue;
            }
        }

        // Reuse existing JP Key Match logic
        if (jpKeyMatch) {
            // jpKeyMatch[1] is the keyword
            const keyText = jpKeyMatch[1];
            if (keyText in triggers) {
                currentSection = triggers[keyText];
                if (currentSection === 'tags' || currentSection === 'visitDate') continue;

                // Remove header: "メモ:" "メモ " "【メモ】" etc.
                // Try strict regex replacement based on what we matched
                let content = trimmed.replace(/^(主訴|所見|評価|施術|計画|方針|メモ|備考)([:：\)\）]|\s+|【|】)/, '').trim();
                // Remove leading bracket if leftover (e.g. matched 【主訴】 in jpKeyMatch loosely)
                content = content.replace(/^[:：\)\）]/, '').trim();

                if (currentSection === 'subjective' || currentSection === 'objective' || currentSection === 'assessment' || currentSection === 'plan' || currentSection === 'memo') {
                    if (content) result[currentSection] += (result[currentSection] ? '\n' : '') + content;
                }
                continue;
            }
        }

        // 2. Check for Tags
        if (tagTrigger.test(trimmed)) {
            const content = trimmed.replace(tagTrigger, '').trim();
            result.tags = content.split(/[,、]/).map(t => t.trim()).filter(Boolean);
            currentSection = null; // Stop appending to SOAP
            continue;
        }

        // 3. Check for Date
        if (dateTrigger.test(trimmed)) {
            const content = trimmed.replace(dateTrigger, '').trim();
            // Try to keep it as string, UI will handle date parsing or user will fix it
            // Ideally validate YYYY-MM-DD
            const dateMatch = content.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
            if (dateMatch) {
                result.visitDate = dateMatch[1].replace(/\//g, '-');
            }
            currentSection = null;
            continue;
        }

        // 4. Append to current section
        if (currentSection && currentSection !== 'tags' && currentSection !== 'visitDate') {
            const target = currentSection as 'subjective' | 'objective' | 'assessment' | 'plan';
            result[target] += (result[target] ? '\n' : '') + trimmed;
        }
    }

    return result;
}
