/**
 * SuperMemo 2 (SM-2) Algorithm Implementation
 * Pure Logic Module
 */

export const Grades = {
    AGAIN: 0,
    HARD: 3,
    GOOD: 4,
    EASY: 5
};

/**
 * Calculates the next state of a card.
 * @param {Object} current - Current state { interval, repetition, easeFactor } or null
 * @param {number} grade (0-5)
 * @returns {Object} { interval, repetition, easeFactor, dueDate }
 */
export function calculateNextState(current, grade) {
    let { interval, repetition, easeFactor } = current || {
        interval: 0,
        repetition: 0,
        easeFactor: 2.5
    };

    if (grade >= 3) {
        // Correct response
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
    } else {
        // Incorrect response
        repetition = 0;
        interval = 1;
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

    // Min EF is 1.3
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate Due Date
    // Date.now() is impure, but acceptable for this level of abstraction.
    const dueDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

    return {
        interval,
        repetition,
        easeFactor,
        dueDate
    };
}
