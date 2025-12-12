/**
 * Dashboard UI Module
 * Handles rendering the main dashboard, stats, and focus widget.
 */
import { store } from '../state.js';

let cachedTags = null; // Optimization cache for tags (legacy check removal in progress)

export function init() {
    // Initial render
    update();

    // Bind Listeners
    const input = document.getElementById('focus-input');
    if (input) {
        input.addEventListener('input', (e) => handleTopicInput(e.target.value));
        input.addEventListener('focus', (e) => handleTopicInput(e.target.value));

        // Close dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tag-input-container')) {
                const dd = document.getElementById('focus-suggestions');
                if (dd) dd.classList.add('hidden');
            }
        });
    }
}

export function refreshTagCache() {
    cachedTags = null; // Invalidate
    // We could re-fetch available topics here if needed,
    // but the store getter 'availableTopics' computes it on the fly or memoizes it.
    // For now, simple invalidation is enough if we use it.
}

export function update() {
    const state = store.state;
    // We use filteredCards to drive the due count shown on the button
    // But for the stats dashboard "Due" count (top left), do we use filter?
    // Request says: "Start Session (23 Cards)" - implied filtered.
    // Let's make the Top "Due" count also reflect the filter to be consistent.

    const filtered = store.filteredCards;
    const totalFiltered = filtered.length;

    // Logic: Of the filtered cards, how many are due or new?
    const now = Date.now();
    const dueCount = filtered.filter(w => {
        const p = state.progress[w.id];
        if (!p) return true; // New
        return p.dueDate <= now;
    }).length;

    // Render Filters
    renderLevelSelector();
    renderFocusWidget();

    // Stats
    const dueEl = document.getElementById('due-val');
    if (dueEl) dueEl.innerText = dueCount;

    // Progress (Global or Filtered? usually global progress is better for "Total Learned")
    const totalDB = state.words.length;
    const learned = state.words.filter(w => state.progress[w.id] && state.progress[w.id].repetition > 0).length;
    const pct = totalDB > 0 ? Math.round((learned / totalDB) * 100) : 0;

    const progBar = document.getElementById('total-progress');
    if (progBar) progBar.style.width = `${pct}%`;
    const progText = document.getElementById('progress-text');
    if (progText) progText.innerText = `${pct}%`;

    // Streak
    const streakEl = document.getElementById('streak-val');
    if (streakEl) streakEl.innerText = state.stats.streak || 0;

    // Start Button
    updateStartButton(dueCount, totalFiltered, state.filter);
}

function renderLevelSelector() {
    const container = document.getElementById('level-filter-container');
    if (!container) return;

    // Available levels from DB (or hardcoded standard CEFR if empty DB)
    let levels = store.availableLevels;
    if (levels.length === 0) levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']; // Fallback

    const current = store.filter.level;

    let html = `<button class="level-btn ${current === null ? 'active' : ''}" onclick="window.app.setLevel(null)">All</button>`;

    levels.forEach(lvl => {
        const active = current === lvl ? 'active' : '';
        // We need to expose a handler or use a global one.
        // Let's assume window.app.setLevel is wired, or we construct elements.
        // Using onclick string for simplicity with existing pattern, will wire in app.js
        html += `<button class="level-btn ${active}" onclick="window.app.setLevel('${lvl}')">${lvl}</button>`;
    });

    container.innerHTML = html;
}

function renderFocusWidget() {
    const container = document.getElementById('active-tags-list');
    if (!container) return;

    const activeTopics = store.filter.topics || [];

    container.innerHTML = '';
    activeTopics.forEach(t => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `${t} <span class="remove-tag">×</span>`;
        chip.querySelector('.remove-tag').onclick = (e) => {
            e.stopPropagation();
            store.removeFilterTopic(t);
            update();
        };
        container.appendChild(chip);
    });
}

export function handleTopicInput(val) {
    const dropdown = document.getElementById('focus-suggestions');
    if (!dropdown) return;

    if (!val && val !== "") {
        dropdown.classList.add('hidden');
        return;
    }

    const q = val.toLowerCase();
    const available = store.availableTopics; // Cached in Store getter technically (calc on fly)
    const active = store.filter.topics;

    const suggestions = available.filter(t =>
        t.toLowerCase().includes(q) && !active.includes(t)
    ).slice(0, 50);

    if (suggestions.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    dropdown.innerHTML = '';
    suggestions.forEach(t => {
        const div = document.createElement('div');
        div.className = 'tag-option';
        div.innerText = t;
        div.onclick = () => {
            store.addFilterTopic(t);

            // Clear input
            const input = document.getElementById('focus-input');
            if (input) input.value = '';

            dropdown.classList.add('hidden');
            update();
        };
        dropdown.appendChild(div);
    });
    dropdown.classList.remove('hidden');
}

function updateStartButton(dueCount, totalFiltered, filter) {
    const btn = document.getElementById('btn-start');
    if (!btn) return;

    const activeFilter = filter.level || filter.topics.length > 0;

    if (totalFiltered === 0) {
        if (activeFilter) {
            btn.innerHTML = `No cards match filter`;
            btn.disabled = true;
        } else {
            btn.innerHTML = `Add words to start`;
            btn.disabled = true;
        }
        btn.classList.remove('finished');
        return;
    }

    // If caught up
    if (dueCount === 0) {
        if (activeFilter) {
            btn.innerHTML = `<span>🎉</span> Filter Complete`;
        } else {
            btn.innerHTML = `<span>🎉</span> All Caught Up`;
        }
        btn.disabled = true; // OR allow review of "ahead" cards? For now disable.
        btn.classList.add('finished');
        return;
    }

    // Ready to study
    btn.disabled = false;
    btn.classList.remove('finished');
    if (activeFilter) {
        btn.innerHTML = `<span>▶</span> Review (${dueCount})`; // Show count of filtered due words
    } else {
        btn.innerHTML = `<span>▶</span> Start Daily Session`;
    }
}


