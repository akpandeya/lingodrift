import { calculateNextState, Grades } from '../js/core/srs.js';

describe('SM2 Algorithm (js/core/srs.js)', () => {

    // Access chai lazily to ensure it loads
    const expect = window.chai ? window.chai.expect : null;

    before(function () {
        if (!window.chai) throw new Error("Chai not loaded");
    });

    it('should initialize a new card correctly on GOOD rating', () => {
        const result = calculateNextState(null, Grades.GOOD);
        expect(result.repetition).to.equal(1);
        expect(result.interval).to.equal(1);
        expect(result.easeFactor).to.equal(2.5);
    });

    it('should increase interval to 6 on second successful review', () => {
        const current = { interval: 1, repetition: 1, easeFactor: 2.5 };
        const result = calculateNextState(current, Grades.GOOD);
        expect(result.repetition).to.equal(2);
        expect(result.interval).to.equal(6);
    });

    it('should resets repetition and interval on AGAIN (fail)', () => {
        const current = { interval: 10, repetition: 5, easeFactor: 2.6 };
        const result = calculateNextState(current, Grades.AGAIN);
        expect(result.repetition).to.equal(0);
        expect(result.interval).to.equal(1);
        // EF should decrease
        expect(result.easeFactor).to.be.lessThan(2.6);
    });

    it('should increase EF for EASY rating', () => {
        const current = { interval: 1, repetition: 1, easeFactor: 2.5 };
        const result = calculateNextState(current, Grades.EASY);
        expect(result.easeFactor).to.be.greaterThan(2.5);
    });

    it('should not let EF drop below 1.3', () => {
        // Force EF down
        let state = { interval: 1, repetition: 1, easeFactor: 1.3 };
        const result = calculateNextState(state, Grades.HARD); // Hard decreases EF
        expect(result.easeFactor).to.be.at.least(1.3);
    });

    it('should calculate a future due date', () => {
        const result = calculateNextState(null, Grades.GOOD);
        expect(result.dueDate).to.be.greaterThan(Date.now());
    });

});
