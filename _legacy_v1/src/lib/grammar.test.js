import { describe, it, expect } from 'vitest';
import { analyzeWordStyle, detectGender } from './grammar.js';

describe('Grammar Logic', () => {

    describe('analyzeWordStyle', () => {
        it('should correctly identify Nouns and Gender based on prefix', () => {
            const masc = analyzeWordStyle('NOUN', 'Der Mann');
            expect(masc).toEqual({ type: 'noun', styleClass: 'style-masc', badgeText: 'Der' });

            const fem = analyzeWordStyle('noun', 'Die Frau');
            expect(fem).toEqual({ type: 'noun', styleClass: 'style-fem', badgeText: 'Die' });

            const neut = analyzeWordStyle('NOUN', 'Das Auto');
            expect(neut).toEqual({ type: 'noun', styleClass: 'style-neut', badgeText: 'Das' });
        });

        it('should handle nouns without articles', () => {
            const raw = analyzeWordStyle('NOUN', 'Mann');
            expect(raw).toEqual({ type: 'noun', styleClass: 'style-adv', badgeText: 'Noun' });
        });

        it('should identify Verbs', () => {
            const verb = analyzeWordStyle('VERB', 'laufen');
            expect(verb.type).toBe('verb');
            expect(verb.styleClass).toBe('style-verb');
        });

        it('should identify Adjectives/Adverbs', () => {
            const adj = analyzeWordStyle('ADJ', 'schön');
            expect(adj.styleClass).toBe('style-adj');

            const adv = analyzeWordStyle('ADV', 'heute');
            expect(adv.styleClass).toBe('style-adv');
        });

        it('should handle missing inputs gracefully', () => {
            const safe = analyzeWordStyle(null, null);
            expect(safe.type).toBe('other');
        });
    });

    describe('detectGender (Legacy)', () => {
        it('should return correct gender class string', () => {
            expect(detectGender('Der Tisch')).toBe('gender-masc');
            expect(detectGender('Die Tür')).toBe('gender-fem');
            expect(detectGender('Das Buch')).toBe('gender-neut');
        });

        it('should return null for non-gendered words', () => {
            expect(detectGender('Rot')).toBe(null);
        });
    });

});
