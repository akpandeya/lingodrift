import { expect } from 'chai';
import { analyzeWordStyle, detectGender } from '../js/core/grammar.js';

describe('Grammar Module (js/core/grammar.js)', () => {

    describe('analyzeWordStyle', () => {
        it('should style Nouns with Der (Masc)', () => {
            const res = analyzeWordStyle('NOUN', 'Der Hund');
            expect(res).to.deep.equal({ type: 'noun', styleClass: 'style-masc', badgeText: 'Der' });
        });

        it('should style Nouns with Die (Fem)', () => {
            const res = analyzeWordStyle('noun', 'Die Frau');
            expect(res).to.deep.equal({ type: 'noun', styleClass: 'style-fem', badgeText: 'Die' });
        });

        it('should style Nouns with Das (Neut)', () => {
            const res = analyzeWordStyle('Noun', 'Das Auto');
            expect(res).to.deep.equal({ type: 'noun', styleClass: 'style-neut', badgeText: 'Das' });
        });

        it('should handle Nouns without known Article', () => {
            const res = analyzeWordStyle('NOUN', 'Leute');
            expect(res).to.deep.equal({ type: 'noun', styleClass: 'style-adv', badgeText: 'Noun' });
        });

        it('should style Verbs', () => {
            const res = analyzeWordStyle('VERB', 'laufen');
            expect(res).to.deep.equal({ type: 'verb', styleClass: 'style-verb', badgeText: 'Verb' });
        });

        it('should style Adjectives', () => {
            const res = analyzeWordStyle('ADJ', 'schnell');
            expect(res).to.deep.equal({ type: 'adj', styleClass: 'style-adj', badgeText: 'Adj' });
        });

        it('should default for unknown POS', () => {
            const res = analyzeWordStyle('XYZ', 'test');
            expect(res).to.deep.equal({ type: 'other', styleClass: 'style-adv', badgeText: 'XYZ' });
        });
    });

    describe('detectGender (Legacy Wrapper)', () => {
        it('should return gender-masc for Der', () => {
            expect(detectGender('Der Tisch')).to.equal('gender-masc');
        });
        it('should return gender-fem for Die', () => {
            expect(detectGender('Die Frau')).to.equal('gender-fem');
        });
        it('should return gender-neut for Das', () => {
            expect(detectGender('Das Auto')).to.equal('gender-neut');
        });
        it('should return null for others', () => {
            expect(detectGender('laufen')).to.be.null;
        });
    });

});
