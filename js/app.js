/**
 * LingoFlow Core Logic (Modular)
 */
import * as Storage from './storage.js';
import * as SRS from './srs.js';
import * as Games from './games.js';
import * as Dict from './dictionary.js';

let sessionQueue = [];
let currentIndex = 0;
let isFlipped = false;
let cachedTags = null; // Optimization cache

// --- INIT ---
Storage.load();
// DB Migration: Ensure settings exist
const db = Storage.getDB();
if (!db.settings) db.settings = { activeFilter: [] };
// Ensure array
if (db.settings.activeFilter && !Array.isArray(db.settings.activeFilter)) {
    db.settings.activeFilter = [db.settings.activeFilter];
} else if (!db.settings.activeFilter) {
    db.settings.activeFilter = [];
}
refreshTagCache(); // Initial cache build
// Listeners for Tag Input
const input = document.getElementById('focus-input');
if (input) {
    input.addEventListener('input', (e) => app.handleFocusInput(e.target.value));
    input.addEventListener('focus', (e) => app.handleFocusInput(e.target.value));
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tag-input-container')) {
            document.getElementById('focus-suggestions').classList.add('hidden');
        }
    });
}
updateDashboard();
// Auto-fetch logic could be here, or triggered by UI
fetchCentralVocabulary(false);

// --- UI HELPERS ---
function showToast(msg, icon = '✨') {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toast-msg').innerText = msg;
    const iconEl = document.querySelector('.toast-icon');
    if (iconEl) iconEl.innerText = icon;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3000);
}


function updateDashboard() {
    const db = Storage.getDB();
    const total = db.words.length;
    const filterTags = db.settings.activeFilter || [];

    // "Due" calculation based on SRS AND Filter
    const now = Date.now();
    const dueCount = db.words.filter(w => {
        // Filter Check (OR Logic)
        if (filterTags.length > 0) {
            if (!w.tags) return false;
            // Check if word has AT LEAST ONE of the active tags
            const hasTag = filterTags.some(t => w.tags.includes(t));
            if (!hasTag) return false;
        }

        const p = db.progress[w.id];
        if (!p) return true; // New words are due
        return p.dueDate <= now;
    }).length;

    // Update Focus UI
    renderFocusWidget();

    document.getElementById('due-val').innerText = dueCount;

    // Progress: Known words (Repetition > 0)
    const learned = db.words.filter(w => db.progress[w.id] && db.progress[w.id].repetition > 0).length;
    const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
    const progBar = document.getElementById('total-progress');
    if (progBar) progBar.style.width = `${pct}%`;
    const progText = document.getElementById('progress-text');
    if (progText) progText.innerText = `${pct}%`;

    // Streak Logic
    if (!db.stats) db.stats = { streak: 0, lastReviewDate: null };
    let displayStreak = db.stats.streak;

    if (db.stats.lastReviewDate) {
        const last = new Date(db.stats.lastReviewDate);
        last.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = (today - last) / (1000 * 60 * 60 * 24);

        if (diff > 1) {
            displayStreak = 0; // Streak broken
        }
    }
    const streakEl = document.getElementById('streak-val');
    if (streakEl) streakEl.innerText = displayStreak;

    // Start Button state
    const btn = document.getElementById('btn-start');
    if (dueCount === 0 && total > 0) {
        // Optional: Allow review ahead? For now, stick to SRS.
        btn.innerHTML = `<span>🎉</span> All Caught Up`;
        btn.disabled = true;
        btn.classList.add('finished');
    } else if (total === 0) {
        btn.disabled = true;
        btn.innerHTML = `Add words to start`;
    } else {
        btn.disabled = false;
        btn.classList.remove('finished');
        if (filterTags.length > 0) {
            const label = filterTags.length === 1 ? filterTags[0] : `${filterTags.length} Tags`;
            btn.innerHTML = `<span>▶</span> Review '${label}'`;
        } else {
            btn.innerHTML = `<span>▶</span> Start Daily Session`;
        }
    }

    if (window.getUniqueTags) updateTagList();
    else updateTagList();
}

function renderFocusWidget() {
    const db = Storage.getDB();
    const container = document.getElementById('active-tags-list');
    if (!container) return; // Guard

    const activeTags = db.settings.activeFilter || [];

    container.innerHTML = '';
    activeTags.forEach(t => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `${t} <span onclick="app.removeFocusTag('${t}')">×</span>`;
        container.appendChild(chip);
    });
}

function handleFocusInput(val) {
    const db = Storage.getDB();
    const dropdown = document.getElementById('focus-suggestions');
    if (!dropdown) return;

    if (!val && val !== "") {
        dropdown.classList.add('hidden');
        return;
    }

    const q = val.toLowerCase();

    // Use cached tags for performance
    if (!cachedTags) refreshTagCache();

    const activeTags = db.settings.activeFilter || [];

    // Filter suggestions: Match query AND not already active
    // Limit suggestions to 50 for rendering performance
    const suggestions = cachedTags.filter(t =>
        t.toLowerCase().includes(q) && !activeTags.includes(t)
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
        div.onclick = () => app.addFocusTag(t);
        dropdown.appendChild(div);
    });
    dropdown.classList.remove('hidden');
}

function addFocusTag(tag) {
    const db = Storage.getDB();
    let active = db.settings.activeFilter || [];
    if (!active.includes(tag)) {
        active.push(tag);
        // Ensure unique just in case
        active = [...new Set(active)];
        db.settings.activeFilter = active;
        Storage.save();

        // Clear input
        document.getElementById('focus-input').value = '';
        document.getElementById('focus-suggestions').classList.add('hidden');

        updateDashboard();
    }
}

function removeFocusTag(tag) {
    const db = Storage.getDB();
    let active = db.settings.activeFilter || [];
    active = active.filter(t => t !== tag);
    db.settings.activeFilter = active;
    Storage.save();
    updateDashboard();
}

function updateTagList() {
    const db = Storage.getDB();
    const tags = new Set();
    db.words.forEach(w => {
        if (w.tags) w.tags.forEach(t => tags.add(t));
    });
    const sortedTags = Array.from(tags).sort();

    const dl = document.getElementById('tag-suggestions');
    if (dl) {
        dl.innerHTML = '';
        sortedTags.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            dl.appendChild(opt);
        });
    }
}

// --- CORE ACTIONS ---

function startSession() {
    const db = Storage.getDB();
    const tagFilter = document.getElementById('tag-filter').value.trim();
    const now = Date.now();

    // SRS Logic: 
    // 1. Due Today (p.dueDate <= now)
    // 2. New words (no progress)
    // 3. RESPECT GLOBAL FILTER

    const filterTags = db.settings.activeFilter || [];

    sessionQueue = db.words.filter(w => {
        // 1. Check Filter (OR Logic)
        if (filterTags.length > 0) {
            if (!w.tags) return false;
            const hasTag = filterTags.some(t => w.tags.includes(t));
            if (!hasTag) return false;
        }

        const p = db.progress[w.id];
        let isDue = false;
        if (!p) isDue = true; // New
        else if (p.dueDate <= now) isDue = true; // Due

        return isDue;
    });

    if (sessionQueue.length === 0) {
        showToast("No cards due right now!", '✅');
        return;
    }

    // Sort: New words first? Or mixed? Or random?
    // Anki usually mixes. Let's shuffle for now.
    // If we want SRS strictness, maybe due date ascending?
    // Let's user random to keep it simple and fun.
    for (let i = sessionQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sessionQueue[i], sessionQueue[j]] = [sessionQueue[j], sessionQueue[i]];
    }

    currentIndex = 0;
    isFlipped = false;
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');
    renderCard();
}

function renderCard() {
    if (currentIndex >= sessionQueue.length) {
        showToast("Session Complete!", '🏆');
        goHome();
        return;
    }

    const card = sessionQueue[currentIndex];
    const cleanPos = (card.pos || '').split('#')[0];

    // Reset Flip
    isFlipped = false;
    document.getElementById('active-card').classList.remove('flipped');

    // Hide buttons, show "Show Answer"? 
    // Usually Anki shows "Show Answer" then the buttons.
    // Our existing UI flips on click. So we should show buttons ONLY after flip?
    // Let's assume buttons are visible but disabled or user knows to flip first?
    // Better: Hide buttons until flip.
    document.querySelector('.controls').style.opacity = '0';
    document.querySelector('.controls').style.pointerEvents = 'none';

    // Populate
    document.getElementById('card-word').innerText = card.word;
    document.getElementById('card-pos').innerText = cleanPos;

    // Back Side
    document.getElementById('card-def').innerText = card.def;
    document.getElementById('card-ex-de').innerText = card.ex_de;
    document.getElementById('card-ex-en').innerText = card.ex_en;

    // Progress
    document.getElementById('progress-indicator').innerText =
        `${currentIndex + 1} / ${sessionQueue.length}`;
}

function flip() {
    isFlipped = !isFlipped;
    document.getElementById('active-card').classList.toggle('flipped');

    if (isFlipped) {
        document.querySelector('.controls').style.opacity = '1';
        document.querySelector('.controls').style.pointerEvents = 'auto';
    }
}

// Answer with Grade (0-5)
// Maps directly to SRS.Grades
function answer(grade) {
    if (!isFlipped) return; // Prevention

    const card = sessionQueue[currentIndex];
    const db = Storage.getDB();
    const currentProgress = db.progress[card.id];

    const nextState = SRS.calculateNextState(currentProgress, grade);
    Storage.updateProgress(card.id, nextState);
    updateStreak(); // Check and update streak

    // If grade is AGAIN (0), re-queue it?
    // Anki re-queues "Again" cards in the same session usually (learning steps).
    // Simple version: Grade 0 -> repetition 0 -> interval 1 day. 
    // It's considered "reviewed" but "failed".
    // If we want "Same Session" review, we push it to end of queue.
    if (grade === SRS.Grades.AGAIN) {
        sessionQueue.push(card);
        // Update total indicator?
        document.getElementById('progress-indicator').innerText =
            `${currentIndex + 1} / ${sessionQueue.length}`;
    }

    currentIndex++;
    setTimeout(() => renderCard(), 150);
}

function speak() {
    const word = sessionQueue[currentIndex].word;
    const ut = new SpeechSynthesisUtterance(word);
    ut.lang = 'de-DE';
    window.speechSynthesis.speak(ut);
}

function goHome() {
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('dictionary-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    updateDashboard();
}

function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const words = Storage.parseCSVData(evt.target.result);
        const res = Storage.mergeWords(words);
        if (res.added > 0) showToast(res.message, '📥');
        else showToast(res.message, 'Hz');

        refreshTagCache(); // Rebuild cache after import
        updateDashboard();
        e.target.value = '';
    };
    reader.readAsText(file);
}

function fetchCentralVocabulary(manual = false) {
    fetch('data/vocabulary.csv')
        .then(response => {
            if (!response.ok) throw new Error("CSV not found");
            return response.text();
        })
        .then(text => {
            const words = Storage.parseCSVData(text);
            if (manual) {
                const res = Storage.mergeWords(words);
                if (res.added > 0) showToast(res.message, '📥');
                else showToast(res.message, 'Hz');
                updateDashboard();
            } else {
                // Auto-load silent merge
                Storage.mergeWords(words, false);
                refreshTagCache(); // Rebuild cache after fetch
                updateDashboard();
            }
        })
        .catch(err => {
            console.error(err);
            if (manual) showToast("Update failed", '❌');
        });
}

// --- DETAIL MODAL LOGIC ---
let currentDetailId = null;
let currentDetailTags = [];
let currentDetailExamples = [];

// Global app object to expose functions to HTML


// Renamed original openDetail to _openDetailInternal to avoid conflict with app.openDetail
function _openDetailInternal(word) {
    if (!word) return;

    currentDetailId = word.id;

    // Migrate/Init fields
    currentDetailTags = [...(word.tags || [])];
    currentDetailExamples = word.examples ? [...word.examples] : [];

    // Migration: If no specific examples array, but old fields exist, import them
    if (currentDetailExamples.length === 0) {
        if (word.ex_de) currentDetailExamples.push(word.ex_de);
        // We could add English too, but usually examples are target language?
        // Let's add them as separate lines if meaningful
    }

    // Populate UI
    document.getElementById('detail-word').innerText = word.word;
    document.getElementById('detail-def').innerText = word.def;
    document.getElementById('detail-notes').value = word.notes || '';

    renderDetailTags();
    renderDetailExamples();

    // Show
    const m = document.getElementById('detail-modal');
    m.classList.remove('hidden'); // Just in case
    // Force reflow
    void m.offsetWidth;
    m.classList.add('visible');
}

function closeDetail() {
    const m = document.getElementById('detail-modal');
    m.classList.remove('visible');
    currentDetailId = null;
}

function saveDetail() {
    if (!currentDetailId) return;
    const db = Storage.getDB();
    const word = db.words.find(w => w.id === currentDetailId);
    if (!word) return;

    // Update
    word.tags = [...currentDetailTags];
    word.examples = [...currentDetailExamples]; // Store array of strings
    word.notes = document.getElementById('detail-notes').value.trim();

    // Persist
    Storage.save();

    // Refresh parent view
    // updateDashboard() is global, maybe update dictionary list too?
    const searchVal = document.querySelector('.search-bar') ? document.querySelector('.search-bar').value : '';
    renderList(searchVal);
    updateDashboard();

    showToast("Changes saved!", '💾');
    closeDetail();
}

function renderDetailTags() {
    const container = document.getElementById('detail-tags');
    container.innerHTML = '';
    currentDetailTags.forEach((t, idx) => {
        const el = document.createElement('div');
        el.className = 'chip';
        el.innerHTML = `
            ${t}
    <span class="chip-del" onclick="app.removeDetailTag(${idx})">×</span>
    `;
        container.appendChild(el);
    });
}

function addDetailTag(val) {
    if (!val.trim()) return;
    const clean = val.trim();
    if (!currentDetailTags.includes(clean)) {
        currentDetailTags.push(clean);
        renderDetailTags();
    }
    document.getElementById('detail-tag-input').value = '';
}

function removeDetailTag(idx) {
    currentDetailTags.splice(idx, 1);
    renderDetailTags();
}

function renderDetailExamples() {
    const container = document.getElementById('detail-examples-list');
    container.innerHTML = '';
    currentDetailExamples.forEach((ex, idx) => {
        const row = document.createElement('div');
        row.className = 'example-item';
        row.innerHTML = `
        <div class="example-text" contenteditable="true"
    onblur="app.updateDetailExample(${idx}, this.innerText)">${ex}</div>
        <button class="btn-mini del" onclick="app.removeDetailExample(${idx})">🗑</button>
    `;
        container.appendChild(row);
    });
}

function addDetailExample() {
    currentDetailExamples.push("New example...");
    renderDetailExamples();
}

function updateDetailExample(idx, text) {
    currentDetailExamples[idx] = text.trim();
}

function removeDetailExample(idx) {
    currentDetailExamples.splice(idx, 1);
    renderDetailExamples();
}


// --- DICTIONARY ---
function openDictionary() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('dictionary-screen').classList.remove('hidden');
    renderList();
}

function renderList(query = "") {
    const db = Storage.getDB();
    const container = document.getElementById('word-list-container');
    container.innerHTML = "";

    const q = query.toLowerCase();
    const matches = db.words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.def.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">No words found</div>`;
        return;
    }

    // Limit render for performance?
    matches.slice(0, 100).forEach(w => {
        const el = document.createElement('div');
        el.className = 'list-item';
        // Make whole item clickable to open detail
        el.onclick = (e) => {
            // Prevent if clicking action buttons
            if (e.target.closest('button')) return;
            openDetail(w.id);
        };
        el.style.cursor = "pointer";

        // Progress Info
        const p = db.progress[w.id];
        let progBadge = '';
        if (p) {
            const nextDate = new Date(p.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const rep = p.repetition;
            progBadge = `<span style="font-size:0.7rem; color:var(--success); border:1px solid var(--success); padding:2px 6px; border-radius:4px; margin-left:8px;">Lvl ${rep} • ${nextDate}</span>`;
        } else {
            progBadge = `<span style="font-size:0.7rem; color:var(--text-muted); border:1px solid rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px; margin-left:8px;">New</span>`;
        }

        const tagHtml = w.tags && w.tags.length > 0
            ? `<br><span style="font-size:0.75rem; color:var(--primary); opacity:0.8;">🏷 ${w.tags.join(', ')}</span>`
            : '';

        el.innerHTML = `
        <div class="li-main">
                <div class="li-word">${w.word} <span style="font-size:0.8rem; opacity:0.6; font-weight:400; margin-left:8px;">${w.pos}</span>${progBadge}</div>
                <div class="li-def">${w.def}${tagHtml}</div>
            </div>
        <div class="li-actions">
            <button class="btn-mini" onclick="app.speakWord('${w.word}')" title="Pronounce">🔊</button>
            <button class="btn-mini del" onclick="app.deleteWord('${w.id}')" title="Delete">🗑</button>
        </div>
    `;
        container.appendChild(el);
    });
}

function search(val) {
    renderList(val);
}

function deleteWord(id) {
    if (!confirm("Delete this word permanently?")) return;

    // We need to manipulate DB directly or via Storage helper
    // Let's add delete helper properly, but for now:
    const db = Storage.getDB();
    db.words = db.words.filter(w => w.id !== id);
    delete db.progress[id];
    Storage.save();

    const searchVal = document.querySelector('.search-bar').value;
    renderList(searchVal);
    updateDashboard();
    showToast("Word deleted", '🗑');
}

function speakWord(text) {
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'de-DE';
    window.speechSynthesis.speak(ut);
}

function backup() {
    const db = Storage.getDB();
    const str = JSON.stringify(db);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingoflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.words && data.progress) {
                if (confirm("Replace current data with this backup?")) {
                    Storage.setDB(data);
                    updateDashboard();
                    showToast("Data restored!", '↺');
                }
            } else {
                alert("Invalid file format");
            }
        } catch (err) {
            alert("Error reading file");
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

function clearData() {
    if (confirm("⚠ Are you sure you want to delete all words and progress?")) {
        Storage.clearData();
        updateDashboard();
        showToast("Database wiped", '🗑');
    }
}

function installPWA() {
    // PWA Logic ... needs to be attached to window logic or re-implemented here
    // Deferred prompt is window level usually.
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((result) => {
            if (result.outcome === 'accepted') {
                document.getElementById('btn-install').classList.add('hidden');
            }
            window.deferredPrompt = null;
        });
    }
}

// Global PWA prompt handler
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    const btn = document.getElementById('btn-install');
    if (btn) btn.classList.remove('hidden');
});

function updateStreak() {
    const db = Storage.getDB();
    if (!db.stats) db.stats = { streak: 0, lastReviewDate: null };

    const now = new Date();
    const todayStr = now.toDateString();

    // Check logic
    const lastDate = db.stats.lastReviewDate ? new Date(db.stats.lastReviewDate) : null;
    const lastStr = lastDate ? lastDate.toDateString() : null;

    if (todayStr === lastStr) return; // Already reviewed today

    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastStr === yesterdayStr) {
        db.stats.streak++;
    } else {
        // Streak broken or first time
        // If it was null (first time ever) -> 1
        // If it was days ago -> 1
        db.stats.streak = 1;
    }

    db.stats.lastReviewDate = Date.now();
    Storage.save();
    updateDashboard();
}

window.addEventListener('load', () => {
    Storage.load();
    Dict.initDictionary();
    updateDashboard();
});

// EXPORT GLOBAL
const app = {
    startSession, handleCSV, backup, handleRestore,
    clearData, flip, answer, speak, goHome,
    search, deleteWord, speakWord: speak,
    fetchCentralVocabulary, installPWA,

    answerAgain: () => answer(0),
    answerHard: () => answer(3),
    answerGood: () => answer(4),
    answerEasy: () => answer(5),

    // Detail View
    openDetail: (id) => {
        const db = Storage.getDB();
        let card = db.words.find(w => w.id == id);
        if (card) _openDetailInternal(card);
    },
    closeDetail, saveDetail,
    addDetailTag, removeDetailTag,
    addDetailExample, removeDetailExample, updateDetailExample,

    // Dictionary
    openDictionary: () => {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('dictionary-screen').classList.remove('hidden');
        Dict.loadDictionary();
    },

    // Games
    startMemoryGame: Games.startMemoryGame,
    endMemoryGame: Games.endMemoryGame,
    startRaindropGame: Games.startRaindropGame,
    endRaindropGame: Games.endRaindropGame,
    startCrosswordGame: Games.startCrosswordGame,
    startCrosswordGame: Games.startCrosswordGame,
    endCrosswordGame: Games.endCrosswordGame,

    // Tag Input Logic
    handleFocusInput, addFocusTag, removeFocusTag, refreshTagCache
};

function refreshTagCache() {
    const db = Storage.getDB();
    const tags = new Set();
    // Optimization: iterate once
    for (let i = 0; i < db.words.length; i++) {
        const w = db.words[i];
        if (w.tags) {
            for (let j = 0; j < w.tags.length; j++) {
                tags.add(w.tags[j]);
            }
        }
    }
    cachedTags = Array.from(tags).sort();
}

window.app = app;


