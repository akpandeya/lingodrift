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
            const back = (w.translation || w.def || '').toLowerCase();
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
            // Start with nested grammar pos, fallback to root pos
            const pos = (w.grammar && w.grammar.pos) ? w.grammar.pos : (w.pos || '');

            const style = (typeof analyzeWordStyle === 'function')
                ? analyzeWordStyle(pos, w.word || '')
                : { type: 'other', styleClass: 'style-adv', badgeText: 'Other' };

            card.className = `dict-card ${style.styleClass}`; // removed undefined style-card-border

            // Use explicit attribute to avoid any closure/binding issues
            // This relies on window.app.openDetail being available (which it is)
            card.setAttribute('onclick', `app.openDetail('${w.id}')`);

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
                        <span class="dict-pos">${pos || ''}</span>
                        ${progBadge}
                    </div>
                    <div class="dict-back">${w.translation || w.def || ''}</div>
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
            <!-- HEADER -->
            <div class="modal-header" style="text-align:center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div id="detail-emoji" style="font-size: 3rem; margin-bottom: 10px; animation: bounce 2s infinite;"></div>
                <div class="modal-word" id="detail-word" style="font-size: 2.5rem; line-height:1.2;"></div>
                <div style="display:flex; gap:10px; justify-content:center; align-items:center; margin-top:8px;">
                    <span id="detail-phonetics" style="font-family:monospace; color:var(--text-muted);"></span>
                    <span id="detail-pos" class="pos-badge" style="font-size:0.7rem;"></span>
                </div>
                <div class="modal-def" id="detail-def" style="margin-top: 16px; font-size: 1.3rem; color: var(--text-main); font-weight: 500;"></div>
            </div>

            <div style="flex: 1; overflow-y: auto; padding-right: 4px;">
                <!-- GRAMMAR TABLE (If applicable) -->
                <div id="detail-grammar-section" style="margin-bottom: 24px; display:none;">
                    <div class="section-title">Grammar</div>
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px;">
                        <div class="info-row" id="row-gender" style="display:none;">
                            <span class="info-label">Gender</span>
                            <span id="val-gender" style="text-transform:capitalize"></span>
                        </div>
                        <div class="info-row" id="row-plural" style="display:none;">
                            <span class="info-label">Plural</span>
                            <span id="val-plural"></span>
                        </div>
                        <div class="info-row" id="row-genitive" style="display:none;">
                            <span class="info-label">Genitivo</span>
                            <span id="val-genitive"></span>
                        </div>
                    </div>
                </div>

                <!-- LEARNING AIDS -->
                <div id="detail-learning-section" style="margin-bottom: 24px;">
                     <div class="section-title">Learning Aids</div>
                     
                     <div id="box-synonyms" style="margin-bottom:8px; display:none;">
                        <span class="info-label">Synonyms:</span> 
                        <span id="val-synonyms" style="color:var(--text-muted); padding-left:8px;"></span>
                     </div>
                     <div id="box-antonyms" style="margin-bottom:8px; display:none;">
                        <span class="info-label">Antonyms:</span> 
                        <span id="val-antonyms" style="color:var(--text-muted); padding-left:8px;"></span>
                     </div>

                     <div id="box-mnemonic" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 8px; margin-top: 12px; display:none;">
                        <div style="color: #fbbf24; font-weight:700; font-size:0.8rem; margin-bottom:4px;">💡 MNEMONIC</div>
                        <div id="val-mnemonic" style="font-style: italic; color: #e2e8f0;"></div>
                     </div>
                </div>

                <!-- EXAMPLES -->
                <div style="margin-bottom: 24px;">
                    <div class="section-title">Examples</div>
                    <div id="detail-examples-list"></div>
                    <button class="btn-ghost" style="padding: 8px; font-size: 0.85rem; width: 100%; margin-top: 8px;"
                        onclick="app.addDetailExample()">+ Add Example</button>
                </div>

                <!-- TAGS -->
                <div style="margin-bottom: 24px;">
                    <div class="section-title">Tags & Topics</div>
                    <div class="chip-container" id="detail-tags"></div>
                    <input type="text" class="input-bare" id="detail-tag-input" placeholder="Type tag & hit Enter"
                        onkeydown="if(event.key==='Enter') app.addDetailTag(this.value)">
                </div>

                <!-- NOTES -->
                <div>
                    <div class="section-title">My Notes</div>
                    <textarea class="input-bare" id="detail-notes" rows="4" placeholder="Add personal notes..."></textarea>
                </div>
            </div>

            <!-- FOOTER -->
            <div style="display: flex; gap: 12px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                <button class="btn-ghost" style="flex:1;" onclick="app.closeDetail()">Close</button>
                <button class="btn-primary" style="flex:1;" onclick="app.saveDetail()">Save Changes</button>
            </div>
        </div>
    `;
}

export function openDetail(id) {
    console.log("Opening detail for ID:", id, "(Type:", typeof id, ")");
    const word = store.state.words.find(w => String(w.id) === String(id)); // Robust weak comparison

    if (!word) {
        console.error("Word not found for ID:", id);
        return;
    }

    currentDetailId = word.id; // Keep original ID type if needed
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

    // --- POPULATE DATA ---

    // Header
    const wordEl = document.getElementById('detail-word');
    if (wordEl) wordEl.innerText = word.word;

    const emojiEl = document.getElementById('detail-emoji');
    if (emojiEl) emojiEl.innerText = word.emoji || '✨';

    const defEl = document.getElementById('detail-def');
    if (defEl) defEl.innerText = word.translation || word.def || 'Ref needed';

    const phonEl = document.getElementById('detail-phonetics');
    if (phonEl) phonEl.innerText = word.phonetics || '';

    const posEl = document.getElementById('detail-pos');
    const pos = (word.grammar && word.grammar.pos) ? word.grammar.pos : (word.pos || '');
    if (posEl) {
        posEl.innerText = pos;
        if (pos) posEl.style.display = 'inline-block';
        else posEl.style.display = 'none';
    }

    // Grammar Section
    const gramSec = document.getElementById('detail-grammar-section');
    const rowGender = document.getElementById('row-gender');
    const rowPlural = document.getElementById('row-plural');
    const rowGenitive = document.getElementById('row-genitive');

    let showGrammar = false;
    if (word.grammar) {
        if (word.grammar.gender && word.grammar.gender !== 'unknown') {
            document.getElementById('val-gender').innerText = word.grammar.gender;
            rowGender.style.display = 'flex';
            showGrammar = true;
        }
        if (word.grammar.plural) {
            document.getElementById('val-plural').innerText = word.grammar.plural;
            rowPlural.style.display = 'flex';
            showGrammar = true;
        }
        if (word.grammar.genitive) {
            document.getElementById('val-genitive').innerText = word.grammar.genitive;
            rowGenitive.style.display = 'flex';
            showGrammar = true;
        }
    }
    if (showGrammar) gramSec.style.display = 'block';

    // Learning Section (Synonyms, Mnemonic)
    const boxSyn = document.getElementById('box-synonyms');
    const boxAnt = document.getElementById('box-antonyms');
    const boxMnem = document.getElementById('box-mnemonic');

    if (word.learning) {
        if (word.learning.synonyms && word.learning.synonyms.length > 0) {
            document.getElementById('val-synonyms').innerText = word.learning.synonyms.join(', ');
            boxSyn.style.display = 'block';
        }
        if (word.learning.antonyms && word.learning.antonyms.length > 0) {
            document.getElementById('val-antonyms').innerText = word.learning.antonyms.join(', ');
            boxAnt.style.display = 'block';
        }
        if (word.learning.mnemonic) {
            document.getElementById('val-mnemonic').innerText = word.learning.mnemonic;
            boxMnem.style.display = 'block';
        }
    }

    // Notes
    const notesInput = document.getElementById('detail-notes');
    if (notesInput) notesInput.value = word.notes || '';

    renderDetailTags();
    renderDetailExamples();

    // Show View
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
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
        // Desktop: Maybe clear right pane or show placeholder?
        // For now, we can just empty it or leave it. 
        // Let's leave it as is or show "Select a word" state.
        const container = document.getElementById('dict-detail-container');
        if (container) container.innerHTML = `<div style="display:flex; height:100%; justify-content:center; align-items:center; color:var(--text-muted);">Select a word to view details</div>`;
    } else {
        const m = document.getElementById('detail-modal');
        if (m) {
            m.classList.remove('visible');
            setTimeout(() => {
                m.style.display = 'none';
                m.classList.add('hidden');
            }, 200); // Wait for transition
        }
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

        // Check if string or object
        let textDe = '';
        let textEn = '';

        if (typeof ex === 'string') {
            textDe = ex;
        } else if (ex && typeof ex === 'object') {
            textDe = ex.de || '';
            textEn = ex.en || '';
        }

        row.innerHTML = `
            <div class="example-content" style="flex:1;">
                <div class="example-text" contenteditable="true" data-type="de">${textDe}</div>
                ${textEn ? `<div class="example-sub" contenteditable="true" data-type="en" style="color:var(--text-muted); font-size:0.85rem; padding-left:8px; margin-top:4px; font-style:italic;">${textEn}</div>` : ''}
            </div>
            <button class="btn-mini del">🗑</button>
        `;

        // Bind events
        const textDiv = row.querySelector('.example-text');
        textDiv.onblur = () => {
            if (typeof currentDetailExamples[idx] === 'object') {
                currentDetailExamples[idx].de = textDiv.innerText.trim();
            } else {
                currentDetailExamples[idx] = textDiv.innerText.trim();
            }
        };

        // Bind EN update if exists
        const subDiv = row.querySelector('.example-sub');
        if (subDiv && typeof currentDetailExamples[idx] === 'object') {
            subDiv.onblur = () => {
                currentDetailExamples[idx].en = subDiv.innerText.trim();
            }
        }

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
