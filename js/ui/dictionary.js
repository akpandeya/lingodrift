/**
 * Dictionary UI Module
 * Handles word list rendering, searching, and the detail modal.
 */
import { store } from '../state.js';
import { analyzeWordStyle } from '../core/grammar.js';

let filteredWords = [];
const BATCH_SIZE = 50;
let renderLimit = BATCH_SIZE;

// Modal State
let currentDetailId = null;
let currentDetailTags = [];
let currentDetailExamples = [];


export function init() {
    // Bind Search Input
    const searchInput = document.getElementById('dict-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filter(e.target.value);
        });
    }

    // Infinite Scroll
    const scrollEl = document.getElementById('dict-left-pane') || document.getElementById('dictionary-screen');
    if (scrollEl) {
        scrollEl.addEventListener('scroll', () => {
            if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 100) {
                loadMore();
            }
        });
    }

    // Modal helpers (global binding usually needed for inline onClick, or we re-bind)
    // For now, we'll export helpers that can be attached or used by router.
}

export function open() {
    // Reset view
    const searchInput = document.getElementById('dict-search');
    if (searchInput) {
        searchInput.value = '';
        filter('');
    } else {
        refreshData();
        render();
    }
}

function refreshData() {
    const list = store.state.words;
    // Default: Sort by word opacity/alphabetical?
    filteredWords = [...list].sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    renderLimit = BATCH_SIZE;
}

export function filter(query) {
    const q = (query || '').toLowerCase().trim();
    const list = store.state.words;

    if (!q) {
        filteredWords = [...list];
    } else {
        filteredWords = list.filter(w => {
            if (!w) return false;
            const front = (w.word || '').toLowerCase();
            const back = (w.def || '').toLowerCase();
            const tags = (w.tags || []).join(' ').toLowerCase();
            return front.includes(q) || back.includes(q) || tags.includes(q);
        });
    }
    renderLimit = BATCH_SIZE;
    render();
}

function loadMore() {
    if (renderLimit < filteredWords.length) {
        renderLimit += BATCH_SIZE;
        render(true);
    }
}

export function render(append = false) {
    const listEl = document.getElementById('dict-list') || document.getElementById('word-list-container');
    if (!listEl) return;

    if (!append) listEl.innerHTML = '';

    const count = Math.min(renderLimit, filteredWords.length);
    let startIdx = 0;
    if (append) {
        startIdx = Math.max(0, renderLimit - BATCH_SIZE);
    }

    if (filteredWords.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #94a3b8;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
                <p>No words found.</p>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = startIdx; i < count; i++) {
        try {
            const w = filteredWords[i];
            if (!w) continue;

            const card = document.createElement('div');
            // Check analyzeWordStyle availability (safety)
            const style = (typeof analyzeWordStyle === 'function')
                ? analyzeWordStyle(w.pos || '', w.word || '')
                : { type: 'other', styleClass: 'style-adv', badgeText: 'Other' };

            card.className = `dict-card ${style.styleClass}`; // removed undefined style-card-border

            card.onclick = (e) => {
                if (e.target.closest('.chip-del') || e.target.closest('button')) return;
                openDetail(w.id);
            };

            // Force border color via inline variable or direct style
            let stripeColor = 'var(--color-adv)';
            if (style.type === 'noun') {
                if (style.badgeText === 'Der') stripeColor = 'var(--color-masc)';
                else if (style.badgeText === 'Die') stripeColor = 'var(--color-fem)';
                else if (style.badgeText === 'Das') stripeColor = 'var(--color-neut)';
            } else if (style.type === 'verb') stripeColor = 'var(--color-verb)';
            else if (style.type === 'adj') stripeColor = 'var(--color-adj)';

            card.style.borderLeftColor = stripeColor;

            // Tags
            const tagsHtml = (w.tags || []).slice(0, 3).map(t =>
                `<span class="dict-tag">${t}</span>`
            ).join('');

            // Badge Logic
            let badgeHtml = '';
            if (style.type === 'noun') {
                badgeHtml = `<span class="badge-pill ${style.styleClass}-bg">${style.badgeText}</span>`;
            } else {
                badgeHtml = `<span class="badge-outline ${style.styleClass}">${style.badgeText}</span>`;
            }

            // Clean word
            let displayWord = w.word || '???';
            if (style.type === 'noun' && ['Der', 'Die', 'Das'].includes(style.badgeText)) {
                displayWord = displayWord.replace(new RegExp(`^${style.badgeText}\\s+`), '');
            }

            // Progress Info (Safe access)
            const p = store.state.progress[w.id];
            let progBadge = '';
            if (p) {
                progBadge = `<span class="marker-lvl">Lvl ${p.repetition}</span>`;
            } else {
                progBadge = `<span class="marker-new">New</span>`;
            }

            card.innerHTML = `
                <div class="dict-main">
                    <div class="dict-front">
                        ${badgeHtml}
                        <span class="word-text">${displayWord}</span>
                        <span class="dict-pos">${w.pos || ''}</span>
                        ${progBadge}
                    </div>
                    <div class="dict-back">${w.def || ''}</div>
                </div>
                <div class="dict-tags">
                    ${tagsHtml}
                </div>
            `;
            fragment.appendChild(card);
        } catch (err) {
            console.error("Error rendering card", err);
        }
    }

    if (append) {
        listEl.appendChild(fragment);
    } else {
        listEl.appendChild(fragment);
    }
}

function getPOSColor(tags) {
    if (!tags) return '#94a3b8';
    const t = tags.map(x => x.toLowerCase());
    if (t.includes('noun')) return '#3b82f6';
    if (t.includes('verb')) return '#ef4444';
    if (t.includes('adj') || t.includes('adjective')) return '#22c55e';
    return '#94a3b8';
}


// --- Detail Modal Logic ---

function getDetailStructure() {
    return `
        <div class="modal-content" style="border:none; box-shadow:none; height:100%; display:flex; flex-direction:column; gap:20px; background: transparent;">
            <div class="modal-header">
                <div class="modal-word" id="detail-word"></div>
                <div class="modal-def" id="detail-def"></div>
            </div>
            <!-- EXAMPLES -->
            <div>
                <div class="section-title">Examples</div>
                <div id="detail-examples-list"></div>
                <button class="btn-ghost" style="padding: 8px; font-size: 0.85rem; width: 100%; margin-top: 8px;"
                    onclick="app.addDetailExample()">+ Add Example</button>
            </div>
            <!-- TAGS -->
            <div>
                <div class="section-title">Tags</div>
                <div class="chip-container" id="detail-tags"></div>
                <input type="text" class="input-bare" id="detail-tag-input" placeholder="Type tag & hit Enter"
                    onkeydown="if(event.key==='Enter') app.addDetailTag(this.value)">
            </div>
            <!-- NOTES -->
            <div>
                <div class="section-title">Notes</div>
                <textarea class="input-bare" id="detail-notes" rows="4" placeholder="Add mnemonics or notes..."></textarea>
            </div>
            <!-- FOOTER -->
            <div style="display: flex; gap: 12px; margin-top: 10px;">
                <button class="btn-ghost" style="flex:1;" onclick="app.closeDetail()">Cancel</button>
                <button class="btn-primary" style="flex:1;" onclick="app.saveDetail()">Save Changes</button>
            </div>
        </div>
    `;
}

export function openDetail(id) {
    const word = store.state.words.find(w => w.id === id);
    if (!word) return;

    currentDetailId = id;
    currentDetailTags = [...(word.tags || [])];
    currentDetailExamples = word.examples ? [...word.examples] : [];

    // Migration for legacy fields
    if (currentDetailExamples.length === 0 && word.ex_de) {
        currentDetailExamples.push(word.ex_de);
    }

    // Determine Container
    const isDesktop = window.innerWidth >= 768;
    let container;

    if (isDesktop) {
        container = document.getElementById('dict-detail-container');
        // Ensure Mobile Modal is hidden/empty
        const mContent = document.getElementById('detail-modal-content');
        if (mContent) mContent.innerHTML = '';
        document.getElementById('detail-modal').style.display = 'none';

        // Show Right Pane if hidden (CSS handles it usually, but good to be sure)
        const rp = document.getElementById('dict-right-pane');
        if (rp) rp.style.display = 'block';
    } else {
        container = document.getElementById('detail-modal-content');
        // Clear Desktop Pane
        const dContainer = document.getElementById('dict-detail-container');
        if (dContainer) dContainer.innerHTML = '';
    }

    if (!container) return;

    // Inject Structure
    container.innerHTML = getDetailStructure();

    // Populate Data
    const wordEl = document.getElementById('detail-word');
    if (wordEl) wordEl.innerText = word.word;

    const defEl = document.getElementById('detail-def');
    if (defEl) defEl.innerText = word.def;

    const notesInput = document.getElementById('detail-notes');
    if (notesInput) notesInput.value = word.notes || '';

    renderDetailTags();
    renderDetailExamples();

    // Show View (Mobile only needs toggle)
    if (!isDesktop) {
        const m = document.getElementById('detail-modal');
        if (m) {
            m.style.display = 'flex';
            m.classList.remove('hidden');
            void m.offsetWidth; // force reflow
            m.classList.add('visible');
        }
    }
}

export function closeDetail() {
    const m = document.getElementById('detail-modal');
    if (m) {
        m.classList.remove('visible');
        setTimeout(() => m.style.display = 'none', 300);
    }

    // Reset Desktop View to Empty State
    const dContainer = document.getElementById('dict-detail-container');
    if (dContainer && window.innerWidth >= 768) {
        dContainer.innerHTML = `
             <div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); flex-direction: column; gap: 16px; opacity: 0.5;">
                <span style="font-size: 3rem;">📖</span>
                <span>Select a word to view details</span>
            </div>
         `;
    }

    currentDetailId = null;
}

export function saveDetail() {
    if (!currentDetailId) return;

    // We modify the word object in the store directly? 
    // Ideally we pass an update object to the store.
    // The Store doesn't have a specific `updateWord(id, data)` yet, but `state.words` is mutable.
    // Let's create a cleaner update in Store later, for now modify reference.

    const word = store.state.words.find(w => w.id === currentDetailId);
    if (!word) return;

    word.tags = [...currentDetailTags];
    word.examples = [...currentDetailExamples];
    const notesInput = document.getElementById('detail-notes');
    if (notesInput) word.notes = notesInput.value.trim();

    store.save(); // Persist

    // Refresh List
    render();
    closeDetail();

    // Show toast? relying on global util or UI util? 
    console.log("Saved detail");
}

function renderDetailTags() {
    const container = document.getElementById('detail-tags');
    if (!container) return;
    container.innerHTML = '';

    currentDetailTags.forEach((t, idx) => {
        const el = document.createElement('div');
        el.className = 'chip';
        el.innerHTML = `${t} <span class="chip-del" data-idx="${idx}">×</span>`;
        el.querySelector('.chip-del').onclick = () => removeDetailTag(idx);
        container.appendChild(el);
    });
}

export function addDetailTag(val) {
    if (!val || !val.trim()) return;
    const clean = val.trim();
    if (!currentDetailTags.includes(clean)) {
        currentDetailTags.push(clean);
        renderDetailTags();
    }
    const input = document.getElementById('detail-tag-input');
    if (input) input.value = '';
}

export function removeDetailTag(idx) {
    currentDetailTags.splice(idx, 1);
    renderDetailTags();
}

function renderDetailExamples() {
    const container = document.getElementById('detail-examples-list');
    if (!container) return;
    container.innerHTML = '';

    currentDetailExamples.forEach((ex, idx) => {
        const row = document.createElement('div');
        row.className = 'example-item';

        // Use a more robust input/display
        // For simplicity: contenteditable div
        row.innerHTML = `
            <div class="example-text" contenteditable="true">${ex}</div>
            <button class="btn-mini del">🗑</button>
        `;

        // Bind events
        const textDiv = row.querySelector('.example-text');
        textDiv.onblur = () => updateDetailExample(idx, textDiv.innerText);

        const btn = row.querySelector('button');
        btn.onclick = () => removeDetailExample(idx);

        container.appendChild(row);
    });
}

export function addDetailExample() {
    currentDetailExamples.push("New example...");
    renderDetailExamples();
}

export function updateDetailExample(idx, text) {
    currentDetailExamples[idx] = text.trim();
}

export function removeDetailExample(idx) {
    currentDetailExamples.splice(idx, 1);
    renderDetailExamples();
}
