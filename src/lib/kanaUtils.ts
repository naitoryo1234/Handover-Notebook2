/**
 * Japanese text conversion utilities
 */

/**
 * Convert hiragana to katakana
 * ひらがな → カタカナ
 */
export function toKatakana(str: string): string {
    return str.replace(/[\u3041-\u3096]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) + 0x60)
    );
}

/**
 * Convert katakana to hiragana
 * カタカナ → ひらがな
 */
export function toHiragana(str: string): string {
    return str.replace(/[\u30A1-\u30F6]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
}

/**
 * Get both hiragana and katakana versions of a string
 * Returns an array of unique versions (may be same if no kana present)
 */
export function getKanaVariants(str: string): string[] {
    const hiragana = toHiragana(str);
    const katakana = toKatakana(str);

    // Return unique values only
    const variants = new Set([str, hiragana, katakana]);
    return Array.from(variants);
}
