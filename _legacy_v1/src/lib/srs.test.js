import { describe, it, expect } from 'vitest';
import { calculateNextState, Grades } from './srs.js';

describe('SRS Logic (SuperMemo-2)', () => {

    describe('New Cards (First Review)', () => {
        it('should cycle a new card continuously if graded AGAIN (0)', () => {
            const next = calculateNextState(null, Grades.AGAIN);
            expect(next.interval).toBe(1);
            expect(next.repetition).toBe(0);
        });

        it('should schedule a new card for 1 day if graded GOOD (4)', () => {
            const next = calculateNextState(null, Grades.GOOD);
            expect(next.interval).toBe(1);
            expect(next.repetition).toBe(1);
            expect(next.easeFactor).toBe(2.5); // Default start
        });
    });

    describe('Reviewing Cards (Subsequent Reviews)', () => {
        it('should increase interval for correct answers (Graduation)', () => {
            // Case: User has reviewed once (rep=1), updated again
            const current = { interval: 1, repetition: 1, easeFactor: 2.5 };
            const next = calculateNextState(current, Grades.GOOD);

            expect(next.repetition).toBe(2);
            expect(next.interval).toBe(6); // SM-2 rule: 1 -> 6
        });

        it('should apply ease factor for 3rd review onwards', () => {
            // Case: 2nd review done (rep=2), interval=6
            const current = { interval: 6, repetition: 2, easeFactor: 2.5 };
            const next = calculateNextState(current, Grades.GOOD);

            expect(next.repetition).toBe(3);
            expect(next.interval).toBe(15); // 6 * 2.5 = 15
        });

        it('should reset progress on incorrect answer (FAIL)', () => {
            const current = { interval: 15, repetition: 3, easeFactor: 2.5 };
            const next = calculateNextState(current, Grades.AGAIN);

            expect(next.repetition).toBe(0); // Reset count
            expect(next.interval).toBe(1);   // Back to 1 day
        });
    });

    describe('Ease Factor Adjustments', () => {
        it('should decrease EF on HARD (3) answer', () => {
            const current = { interval: 10, repetition: 2, easeFactor: 2.5 };
            const next = calculateNextState(current, Grades.HARD);

            // Formula: EF' = EF + (0.1 - (5-3)*(0.08 + (5-3)*0.02))
            // EF' = 2.5 + (0.1 - 2 * (0.08 + 0.04))
            // EF' = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
            expect(next.easeFactor).toBeCloseTo(2.36);
        });

        it('should never drop EF below 1.3', () => {
            const current = { interval: 10, repetition: 5, easeFactor: 1.3 };
            const next = calculateNextState(current, Grades.HARD); // Should lower it
            expect(next.easeFactor).toBe(1.3); // Clamped
        });
    });
});
