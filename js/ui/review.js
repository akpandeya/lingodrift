/**
 * Review UI Module
 * Handles the Flashcard Session (SRS Logic, Render, Interaction).
 */
import { store } from '../state.js';
import * as SRS from '../core/srs.js';
import { analyzeWordStyle } from '../core/grammar.js';

let sessionQueue = [];
let currentIndex = 0;
let isFlipped = false;

// We might need a callback to return to home
let onSessionUnmount = null;

export function init(unmountCallback) {
    onSessionUnmount = unmountCallback;
}

export function startSession() {
    const state = store.state;
    // We read the active filter from the store
    const filterTags = state.settings.activeFilter || [];
    const now = Date.now();

    // SRS Logic: 
    // 1. Due Today (p.dueDate <= now)
    // 2. New words (no progress)
    // 3. RESPECT GLOBAL FILTER (Level/Topics) - Handled by filteredCards getter

    const candidateWords = store.filteredCards;

    sessionQueue = candidateWords.filter(w => {
        // We already filtered by Level/Topic in store.filteredCards
        // Now just check SRS status

        const p = state.progress[w.id];
        let isDue = false;
        if (!p) isDue = true; // New
        else if (p.dueDate <= now) isDue = true; // Due

        return isDue;
    });

    if (sessionQueue.length === 0) {
        // We need a way to show Toast. 
        // For now, let's assume a global 'showToast' or we import a Utils module.
        // Or simpler: just return false and let Caller handle message.
        // But for direct migration, let's assume we can trigger UI.
        alert("No cards due!"); // Temporary fallback
        return false;
    }

    // Shuffle
    for (let i = sessionQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sessionQueue[i], sessionQueue[j]] = [sessionQueue[j], sessionQueue[i]];
    }

    currentIndex = 0;
    isFlipped = false;

    // Switch View
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('dictionary-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');

    renderCard();

    // Attach Keyboard Listener
    document.removeEventListener('keydown', onKeyDown);
    document.addEventListener('keydown', onKeyDown);
    return true;
}

function onKeyDown(e) {
    if (document.getElementById('review-screen').classList.contains('hidden')) return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) flip();
    } else if (isFlipped) {
        if (['1', '2', '3', '4'].includes(e.key)) {
            answer(parseInt(e.key));
        }
    }
}

// State for hints
let hintStage = 0;

export function renderCard() {
    if (currentIndex >= sessionQueue.length) {
        if (onSessionUnmount) onSessionUnmount();
        return;
    }

    const card = sessionQueue[currentIndex];
    // DEBUG: Check data integrity
    console.log("Rendering Card:", card.word, "Translation:", card.translation);

    const cleanPos = (card.pos || '').split('#')[0];

    // Reset State
    isFlipped = false;
    hintStage = 0; // Reset hint cycle

    const cardEl = document.getElementById('active-card');

    // Reset Desktop Hint
    const dHint = document.getElementById('desktop-flip-hint');
    if (dHint) dHint.style.opacity = '1';

    // ... [Rest of renderCard existing logic] ...
    if (cardEl) {
        cardEl.classList.remove('flipped');

        // Reset Visual Classes
        cardEl.className = 'card'; // Reset to base class

        // Analyze for Border (Use new JSON gender field if available, fallback to analysis)
        if (card.grammar && card.grammar.gender) {
            const g = card.grammar.gender.toLowerCase();
            if (g === 'masc') cardEl.classList.add('gender-masc-border');
            else if (g === 'fem') cardEl.classList.add('gender-fem-border');
            else if (g === 'neut') cardEl.classList.add('gender-neut-border');
        } else {
            // Fallback legacy analysis
            const style = analyzeWordStyle(card.pos, card.word);
            if (style.type === 'noun') {
                if (style.badgeText === 'Der') cardEl.classList.add('gender-masc-border');
                else if (style.badgeText === 'Die') cardEl.classList.add('gender-fem-border');
                else if (style.badgeText === 'Das') cardEl.classList.add('gender-neut-border');
            } else if (style.type === 'verb') {
                cardEl.classList.add('style-verb-border');
            }
        }
    }

    // Controls hidden
    const ctrls = document.querySelector('.controls');
    if (ctrls) {
        ctrls.style.opacity = '0';
        ctrls.style.pointerEvents = 'none';
    }

    // Populate Front
    const wordEl = document.getElementById('card-word');
    if (wordEl) wordEl.innerText = card.word;

    const emojiEl = document.getElementById('card-emoji');
    if (emojiEl) emojiEl.innerText = card.emoji || '✨';

    const phoneticsEl = document.getElementById('card-phonetics');
    if (phoneticsEl) phoneticsEl.innerText = card.phonetics || '';

    // Hint Button Visibility
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        // Always show, because we fallback to example or message
        hintBtn.style.display = 'block';
    }

    const posEl = document.getElementById('card-pos');
    // POS from grammar object or root
    const pos = (card.grammar && card.grammar.pos) ? card.grammar.pos : (card.pos || '');
    if (posEl) posEl.innerText = pos;

    // Back Side - Definition
    const defEl = document.getElementById('card-def');
    // Map translation or def
    const definition = card.translation || card.def || "No definition found";
    if (defEl) defEl.innerText = definition;

    // Rich Info Section (Synonyms, Antonyms, Grammar details)
    const infoContainer = document.getElementById('card-rich-info');
    if (infoContainer) {
        infoContainer.innerHTML = ''; // Clear previous

        if (card.learning) {
            if (card.learning.synonyms && card.learning.synonyms.length > 0) {
                const synDiv = document.createElement('div');
                synDiv.className = 'info-row';
                synDiv.innerHTML = `<span class="info-label">Synonyms:</span> <span>${card.learning.synonyms.join(', ')}</span>`;
                infoContainer.appendChild(synDiv);
            }
            if (card.learning.antonyms && card.learning.antonyms.length > 0) {
                const antDiv = document.createElement('div');
                antDiv.className = 'info-row';
                antDiv.innerHTML = `<span class="info-label">Antonyms:</span> <span>${card.learning.antonyms.join(', ')}</span>`;
                infoContainer.appendChild(antDiv);
            }
        }

        // Grammar Gender
        if (card.grammar && card.grammar.gender && card.grammar.gender !== 'unknown') {
            const genderDiv = document.createElement('div');
            genderDiv.className = 'info-row';
            genderDiv.innerHTML = `<span class="info-label">Gender:</span> <span style="text-transform:capitalize">${card.grammar.gender}</span>`;
            infoContainer.appendChild(genderDiv);
        }

        // Mnemonic (Added per user request)
        if (card.learning && card.learning.mnemonic) {
            const mnemDiv = document.createElement('div');
            mnemDiv.className = 'info-row';
            mnemDiv.style.marginTop = '8px'; // Add a little separation
            mnemDiv.innerHTML = `<span class="info-label">💡 Mnemonic:</span> <span style="font-style:italic; color: #e2e8f0;">${card.learning.mnemonic}</span>`;
            infoContainer.appendChild(mnemDiv);
        }
    }

    // Examples
    const exDeEl = document.getElementById('card-ex-de');
    const exEnEl = document.getElementById('card-ex-en');

    // Handle Array of Examples
    if (card.examples && card.examples.length > 0) {
        if (exDeEl) exDeEl.innerText = card.examples[0].de;
        if (exEnEl) exEnEl.innerText = card.examples[0].en;
    } else {
        if (exDeEl) exDeEl.innerText = card.ex_de || 'No example available';
        if (exEnEl) exEnEl.innerText = card.ex_en || '';
    }

    // Progress
    const progEl = document.getElementById('progress-indicator');
    if (progEl) progEl.innerText = `${currentIndex + 1} / ${sessionQueue.length}`;
}

export function showHint() {
    const card = sessionQueue[currentIndex];
    let msg = null;
    let icon = "💡";

    // Cycle: Example -> Mnemonic -> Loop/Stay

    // Stage 0: Show Example
    if (hintStage === 0) {
        if (card.examples && card.examples.length > 0) {
            msg = "🇩🇪 " + card.examples[0].de;
            icon = "🇩🇪";
        } else if (card.ex_de) {
            msg = "🇩🇪 " + card.ex_de;
            icon = "🇩🇪";
        } else {
            // No example, auto-skip to mnemonic
            msg = null;
        }

        // If found, increment. If not found, we fall through to Mnemonic immediately
        if (msg) {
            hintStage = 1;
        }
    }

    // Stage 1: Mnemonic (or fallback if Example missing)
    if (!msg) { // If stage 1 OR stage 0 failed
        if (card.learning && card.learning.mnemonic) {
            msg = "💡 " + card.learning.mnemonic;
            icon = "💡";
        }
        hintStage = 0; // Reset loop (or stay at 1? Cycle is better)
    }

    // Fallback if neither
    if (!msg) {
        msg = "No hint available.";
        hintStage = 0;
    }

    const toast = document.getElementById('hint-toast');
    if (toast) {
        const msgEl = document.getElementById('hint-msg');
        if (msgEl) msgEl.innerText = msg;
        else toast.innerText = msg;

        // Reset animation to allow re-trigger
        toast.classList.remove('visible');
        void toast.offsetWidth; // force reflow
        toast.classList.add('visible');

        // Auto hide
        setTimeout(() => toast.classList.remove('visible'), 4000);
    } else {
        alert(msg);
    }
}

export function flip() {
    isFlipped = !isFlipped;

    const cardEl = document.getElementById('active-card');
    if (cardEl) {
        if (isFlipped) cardEl.classList.add('flipped');
        else cardEl.classList.remove('flipped');
    }

    const ctrls = document.querySelector('.controls');
    const dHint = document.getElementById('desktop-flip-hint');
    const hintBtn = document.getElementById('hint-btn');

    if (isFlipped) {
        // Show Controls
        if (ctrls) {
            ctrls.style.opacity = '1';
            ctrls.style.pointerEvents = 'auto';
        }
        // Hide Hints
        if (dHint) dHint.style.opacity = '0';
        if (hintBtn) hintBtn.style.display = 'none';

    } else {
        // Hide Controls
        if (ctrls) {
            ctrls.style.opacity = '0';
            ctrls.style.pointerEvents = 'none';
        }

        // Show Hints
        if (dHint) dHint.style.opacity = '1';
        if (hintBtn) hintBtn.style.display = 'block';
    }
}

export function answer(grade) {
    if (!isFlipped) return;

    const card = sessionQueue[currentIndex];

    // Get current progress from store
    const currentProgress = store.state.progress[card.id];

    // Calculate new state
    const nextState = SRS.calculateNextState(currentProgress, grade);

    // Update Store
    store.updateWordProgress(card.id, nextState);

    // Update Stats (Streak)
    const today = new Date().toISOString().split('T')[0];
    const lastRev = store.state.stats.lastReviewDate
        ? new Date(store.state.stats.lastReviewDate).toISOString().split('T')[0]
        : null;

    if (lastRev !== today) {
        // Increment streak if it's a new day (and continuous? Logic handled in Dashboard update basically)
        // Simple logic: If last review was yesterday, streak++. If today, ignore. If older, streak=1.
        // Actually SRS updateStreak logic in app.js was a bit more complex.
        // Let's implement basic streak increment here for now.
        const prevStreak = store.state.stats.streak || 0;
        // Basic check: did we already bump streak today? 
        // Actually let's just set lastReviewDate. Dashboard calculates display.
        // Ideally we increment streak if valid.

        let newStreak = prevStreak;
        if (!lastRev) newStreak = 1;
        else {
            const diff = (new Date(today) - new Date(lastRev)) / (1000 * 60 * 60 * 24);
            if (diff === 1) newStreak++;
            else if (diff > 1) newStreak = 1;
        }

        store.updateStats({
            lastReviewDate: Date.now(),
            streak: newStreak
        });
    } else {
        // Just update timestamp
        store.updateStats({ lastReviewDate: Date.now() });
    }

    // Re-queue if AGAIN (0)
    if (grade === SRS.Grades.AGAIN) {
        sessionQueue.push(card);
        const progEl = document.getElementById('progress-indicator');
        if (progEl) progEl.innerText = `${currentIndex + 1} / ${sessionQueue.length}`;
    }

    currentIndex++;
    setTimeout(() => renderCard(), 150);
}

export function speak() {
    const card = sessionQueue[currentIndex];
    if (card && card.word) {
        const ut = new SpeechSynthesisUtterance(card.word);
        ut.lang = 'de-DE'; // Hardcoded for now, could be dynamic
        window.speechSynthesis.speak(ut);
    }
}
