import { describe, it, expect } from 'vitest';
import { parseCSV } from './importer.js';

describe('Importer Logic', () => {

    describe('parseCSV (Pipe Delimited)', () => {
        it('should parse simple pipe-delimited rows', () => {
            const input = `German|English\nHund|Dog\nKatze|Cat`;
            const result = parseCSV(input);
            expect(result).toEqual([
                { German: 'Hund', English: 'Dog' },
                { German: 'Katze', English: 'Cat' }
            ]);
        });

        it('should handle quoted fields containing delimiters', () => {
            const input = `Word|Context\n"Ende|Gut"|All good`;
            const result = parseCSV(input);
            expect(result[0]).toEqual({
                Word: 'Ende|Gut',
                Context: 'All good'
            });
        });

        it('should trim whitespace from values', () => {
            const input = ` Key | Value \n  A  |  1  `;
            const result = parseCSV(input);
            expect(result[0]).toEqual({ Key: 'A', Value: '1' });
        });

        it('should ignore empty lines', () => {
            const input = `A|B\n\n1|2\n`;
            const result = parseCSV(input);
            expect(result.length).toBe(1);
        });

        it('should allow custom delimiters', () => {
            const input = `A,B\n1,2`;
            const result = parseCSV(input, ',');
            expect(result[0]).toEqual({ A: '1', B: '2' });
        });
    });

});
