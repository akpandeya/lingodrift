/**
 * State Manager
 * The single source of truth for the application.
 */
import { loadFromLocalStorage, saveToLocalStorage } from './core/storage.js';

// Default State Schema
const defaultState = {
    words: [],      // Array of Word objects
    progress: {},   // { [id]: { interval, repetition, easeFactor, dueDate } }
    stats: {
        streak: 0,
        lastReviewDate: null
    },
    settings: {
        activeFilter: [] // Array of tag strings (Deprecating in favor of filter.topics)
    },
    filter: {
        level: null, // 'A1', 'A2', etc.
        topics: []   // ['Food', 'Travel']
    }
};

class StateManager {
    constructor() {
        this.state = JSON.parse(JSON.stringify(defaultState)); // Deep copy
    }

    /**
     * Load state from storage or initialize defaults
     */
    load() {
        const stored = loadFromLocalStorage();
        if (stored) {
            this.state = { ...defaultState, ...stored };

            // Migrations / Safety Checks
            if (!this.state.words) this.state.words = [];

            // CRITICAL FIX: Check if loaded words are stale (missing translation)
            // If the first word in the list is missing 'translation', we assume the whole list is stale.
            if (this.state.words.length > 0 && !this.state.words[0].translation) {
                console.warn("Detected stale data (missing translation). Clearing words to force re-fetch.");
                this.state.words = []; // Clear to trigger reload
                this.state.filter.level = null; // Reset filters just in case
            }

            if (!this.state.progress) this.state.progress = {};
            if (!this.state.stats) this.state.stats = defaultState.stats;
            if (!this.state.settings) this.state.settings = defaultState.settings;

            // Migration: Ensure activeFilter is array
            if (this.state.settings.activeFilter && !Array.isArray(this.state.settings.activeFilter)) {
                this.state.settings.activeFilter = [this.state.settings.activeFilter];
            }

            // Init filters if missing (new feature)
            if (!this.state.filter) {
                this.state.filter = { level: null, topics: [] };
            }
        }
    }

    save() {
        saveToLocalStorage(this.state);
    }

    /**
     * Merge new words into the database.
     * @param {Array} newWords 
     * @returns {Object} { added: number }
     */
    addWords(newWords) {
        let added = 0;
        const existingIds = new Set(this.state.words.map(w => w.id));

        newWords.forEach(w => {
            if (!existingIds.has(w.id)) {
                this.state.words.push(w);
                existingIds.add(w.id);
                added++;
            }
        });

        if (added > 0) this.save();
        return { added };
    }

    /**
     * Update progress for a specific word
     * @param {string} id 
     * @param {Object} progressData 
     */
    updateWordProgress(id, progressData) {
        this.state.progress[id] = progressData;
        this.save();
    }

    updateStats(statsUpdate) {
        this.state.stats = { ...this.state.stats, ...statsUpdate };
        this.save();
    }

    updateSettings(settingsUpdate) {
        this.state.settings = { ...this.state.settings, ...settingsUpdate };
        this.save();
    }

    get words() { return this.state.words; }
    get progress() { return this.state.progress; }
    get settings() { return this.state.settings; }
    get stats() { return this.state.stats; }
    get filter() { return this.state.filter; }

    get filteredCards() {
        return this.state.words.filter(w => {
            // Level Check (Check both 'level' prop and 'tags')
            if (this.state.filter.level) {
                const lvl = this.state.filter.level;
                const dateLevel = w.level || '';
                const hasTag = w.tags && w.tags.includes(lvl);
                if (dateLevel !== lvl && !hasTag) return false;
            }
            // Topic Check (AND Logic)
            if (this.state.filter.topics.length > 0) {
                if (!w.tags) return false;
                // Every selected topic must be present in word tags
                const matchesAll = this.state.filter.topics.every(t => w.tags.includes(t));
                if (!matchesAll) return false;
            }
            return true;
        });
    }

    get availableLevels() {
        const levelRegex = /^(A[12]|B[12]|C[12])$/;
        const levels = new Set();
        this.state.words.forEach(w => {
            if (w.level && levelRegex.test(w.level)) levels.add(w.level);
            if (w.tags) w.tags.forEach(t => {
                if (levelRegex.test(t)) levels.add(t);
            });
        });
        return Array.from(levels).sort();
    }

    get availableTopics() {
        const levelRegex = /^(A[12]|B[12]|C[12])$/;
        const topics = new Set();
        this.state.words.forEach(w => {
            if (w.tags) w.tags.forEach(t => {
                if (!levelRegex.test(t)) topics.add(t);
            });
        });
        return Array.from(topics).sort();
    }

    // --- Filter Actions ---
    setFilterLevel(level) {
        this.state.filter.level = level;
        this.save();
    }

    addFilterTopic(topic) {
        if (!this.state.filter.topics.includes(topic)) {
            this.state.filter.topics.push(topic);
            this.save();
        }
    }

    removeFilterTopic(topic) {
        this.state.filter.topics = this.state.filter.topics.filter(t => t !== topic);
        this.save();
    }

    clearFilters() {
        this.state.filter.level = null;
        this.state.filter.topics = [];
        this.save();
    }

    async loadDeck(deckConfig) {
        try {
            console.log("Loading deck:", deckConfig.title);
            // Cache Busting: Ensure we get fresh data
            const url = `${deckConfig.file}?t=${Date.now()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${deckConfig.file}`);

            const data = await response.json();
            this.state.words = data;

            // Apply Deck Default Filters
            if (deckConfig.filter) {
                this.state.filter = { ...this.state.filter, ...deckConfig.filter };
            } else {
                // Reset if no specific filter (optional, but good for "Complete" deck)
                this.state.filter.level = null;
            }

            // Save active deck ID
            localStorage.setItem('active_deck', deckConfig.id);
            this.save();

            return { success: true, count: data.length };
        } catch (e) {
            console.error("Deck Load Error:", e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Hard Reset: Wipes all data
     */
    clear() {
        this.state = JSON.parse(JSON.stringify(defaultState));
        this.save();
    }
}

// Export Singleton
export const store = new StateManager();
