/**
 * Grammar Utilities
 * Handles language-specific logic like gender detection.
 */

/**
 * Analyzes a word to determine its visual style based on POS and Gender.
 * @param {string} pos - Part of Speech (e.g., 'NOUN', 'VERB').
 * @param {string} wordText - The German word/phrase (e.g., "Der Tisch").
 * @returns {Object} { type, styleClass, badgeText }
 */
export function analyzeWordStyle(pos, wordText) {
    const p = (pos || '').toUpperCase();
    const text = (wordText || '');

    if (p.includes('NOUN')) {
        if (text.startsWith('Der ')) return { type: 'noun', styleClass: 'style-masc', badgeText: 'Der' };
        if (text.startsWith('Die ')) return { type: 'noun', styleClass: 'style-fem', badgeText: 'Die' };
        if (text.startsWith('Das ')) return { type: 'noun', styleClass: 'style-neut', badgeText: 'Das' };
        return { type: 'noun', styleClass: 'style-adv', badgeText: 'Noun' };
    }

    if (p.includes('VERB')) return { type: 'verb', styleClass: 'style-verb', badgeText: 'Verb' };
    if (p.includes('ADJ')) return { type: 'adj', styleClass: 'style-adj', badgeText: 'Adj' };
    if (p.includes('ADV')) return { type: 'adv', styleClass: 'style-adv', badgeText: 'Adv' };

    return { type: 'other', styleClass: 'style-adv', badgeText: pos || 'Other' };
}

/**
 * Legacy wrapper if needed, or we just rely on new logic.
 * Keeping for backward compat if tests rely on it, but simpler to redirect.
 */
export function detectGender(text) {
    const res = analyzeWordStyle('NOUN', text);
    if (res.styleClass === 'style-masc') return 'gender-masc';
    if (res.styleClass === 'style-fem') return 'gender-fem';
    if (res.styleClass === 'style-neut') return 'gender-neut';
    return null;
}
