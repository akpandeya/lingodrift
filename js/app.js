/**
 * LingoFlow Main Controller
 * Orchestrates the app by wiring modules together.
 */
import { store } from './state.js';
import * as Dashboard from './ui/dashboard.js';
import * as Dictionary from './ui/dictionary.js';
import * as Review from './ui/review.js';
import * as Library from './ui/library.js';

import * as Memory from './games/memory.js';
import * as Raindrop from './games/raindrop.js';
import * as Crossword from './games/crossword.js';

// --- Global App Object (for HTML events) ---
window.app = {
    // Dashboard / Filter
    handleTopicInput: Dashboard.handleTopicInput,
    setLevel: (lvl) => {
        store.setFilterLevel(lvl);
        Dashboard.update();
    },

    // Review Session
    startSession: () => {
        if (Review.startSession()) {
            // Session started successfully
        }
    },
    // Games
    startMemoryGame: () => Memory.startGame(window.app.goHome),
    endMemoryGame: () => Memory.endGame(), // Fix: Expose Exit
    startRaindropGame: () => Raindrop.startGame(),
    startCrosswordGame: () => Crossword.startGame(),
    endRaindropGame: () => Raindrop.endGame(), // Helper if needed logic calls it
    endCrosswordGame: () => Crossword.endGame(),

    // Board Games Helpers (if inline events use them)
    // Memory uses local click handlers attached in module

    // Dictionary / Detail Modal
    answer: Review.answer,
    speak: Review.speak,
    flip: Review.flip, // Expose flip
    showHint: Review.showHint, // Expose hint

    // Dictionary / Detail Modal
    openDetail: Dictionary.openDetail,
    closeDetail: Dictionary.closeDetail,
    saveDetail: Dictionary.saveDetail,
    addDetailTag: Dictionary.addDetailTag,
    removeDetailTag: Dictionary.removeDetailTag,
    updateDetailExample: Dictionary.updateDetailExample,
    addDetailExample: Dictionary.addDetailExample,
    removeDetailExample: Dictionary.removeDetailExample,

    // Global/Router
    openDictionary: () => {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('review-screen').classList.add('hidden');
        document.getElementById('dictionary-screen').classList.remove('hidden');
        Dictionary.open();
    },
    openLibrary: () => {
        localStorage.removeItem('active_deck');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('review-screen').classList.add('hidden');
        document.getElementById('dictionary-screen').classList.add('hidden');
        document.getElementById('library-screen').classList.remove('hidden');
        Library.render();
    },
    goHome: () => {
        document.getElementById('library-screen').classList.add('hidden');
        document.getElementById('review-screen').classList.add('hidden');
        document.getElementById('dictionary-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        Dashboard.update();
    },

    // Reset
    // Reset & Backup
    backup: () => {
        const data = {
            state: store.state,
            timestamp: Date.now()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lingoflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    hardReset: () => {
        if (confirm("HARD RESET: This will BACKUP your data and then WIPE everything. Continue?")) {
            // Auto-backup first
            window.app.backup();

            // Give it a moment to start download, then wipe
            setTimeout(() => {
                if (confirm("Backup started. Proceed to wipe data?")) {
                    store.clear();
                    localStorage.clear(); // Wipe everything including active_deck

                    // Force reload to Library (Home)
                    location.reload();
                }
            }, 1000);
        }
    },

    // Deck Management
    loadDeck: async (deckId) => {
        try {
            // Cache Busting: Append timestamp to force fresh fetch
            const ts = Date.now();
            const resp = await fetch(`data/decks.json?t=${ts}`);
            const decks = await resp.json();
            const deck = decks.find(d => d.id === deckId);
            if (!deck) throw new Error("Deck not found");

            // Also bust cache for the deck file
            // We need to modify the file path in the deck object or handle it in store
            // Let's handle it here by modifying the file path before passing to store
            if (deck.file) {
                deck.file = `${deck.file}?t=${ts}`;
            }

            await store.loadDeck(deck);

            // Switch to Dashboard
            window.app.goHome();
            Dashboard.update();
        } catch (e) {
            console.error("Failed to load deck", e);
            alert("Could not load deck: " + e.message);
        }
    }
};

// --- Initialization ---

// TEMPORARY: Unregister SW to fix aggressive caching issues during refactor
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
            console.log("Service Worker Unregistered to force update.");
        }
    });
}
/* 
// Re-enable this later when stable
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('SW Registration Failed:', err));
}
*/

// Review Module needs a callback to know when to exit
Review.init(() => {
    window.app.goHome();
    showToast("Session Complete!", '🏆');
});

Dictionary.init();
Dashboard.init();

// Initialize Store and App
(async function initApp() {
    store.load();

    // Check for active deck
    const activeDeckId = localStorage.getItem('active_deck');
    if (activeDeckId) {
        // Auto-load
        await window.app.loadDeck(activeDeckId);
    } else {
        // No deck? Show Library (We will implement this routing next)
        // For now, if Library code exists, we show it. 
        // If not, we might stay on empty dashboard or show alert.
        if (window.app.openLibrary) window.app.openLibrary();
    }

    // Initial Render
    Dashboard.update();
})();


// --- Helpers ---

function showToast(msg, icon = '✨') {
    const t = document.getElementById('toast');
    if (!t) return;
    const msgEl = document.getElementById('toast-msg');
    if (msgEl) msgEl.innerText = msg;
    const iconEl = document.querySelector('.toast-icon');
    if (iconEl) iconEl.innerText = icon;

    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3000);
}
