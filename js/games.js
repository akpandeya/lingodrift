import * as Storage from './storage.js';

let flippedTiles = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

export function startMemoryGame() {
    const db = Storage.getDB();
    const filterTags = db.settings ? (db.settings.activeFilter || []) : [];
    let pool = db.words;

    // Filter Logic: Match at least one tag
    if (filterTags.length > 0) {
        pool = pool.filter(w => w.tags && filterTags.some(t => w.tags.includes(t)));
    }

    if (pool.length < 8) {
        const tagLabel = filterTags.length === 1 ? filterTags[0] : `${filterTags.length} tags`;
        alert(filterTags.length > 0 ? `Not enough words with filter '${tagLabel}' (need 8)` : "You need at least 8 words to play!");
        return;
    }

    // Reset Game State
    flippedTiles = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    updateMoves();

    // Select 8 random words
    const deck = [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);

    // Create 16 tiles
    const tiles = [];
    deck.forEach(w => {
        // Pair: Word vs Definition
        tiles.push({ id: w.id, content: w.word, type: 'word' });
        tiles.push({ id: w.id, content: w.def, type: 'def' });
    });

    // Shuffle tiles
    tiles.sort(() => 0.5 - Math.random());

    // Render
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';

    tiles.forEach((tile, index) => {
        const el = document.createElement('div');
        el.className = 'memory-tile';
        el.dataset.index = index;
        el.dataset.id = tile.id;

        const isDef = tile.type === 'def';

        el.innerHTML = `
            <div class="mem-face mem-front">?</div>
            <div class="mem-face mem-back ${isDef ? 'is-def' : ''}">${tile.content}</div>
        `;

        el.onclick = () => handleTileClick(el, tile);
        grid.appendChild(el);
    });

    // Show Screen
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('memory-game-screen').classList.remove('hidden');
}

function handleTileClick(el, tile) {
    if (isLocked) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    el.classList.add('flipped');
    flippedTiles.push({ el, id: tile.id });

    if (flippedTiles.length === 2) {
        moves++;
        updateMoves();
        checkForMatch();
    }
}

function checkForMatch() {
    isLocked = true;
    const [t1, t2] = flippedTiles;

    if (t1.id === t2.id) {
        // Match!
        setTimeout(() => {
            t1.el.classList.add('matched');
            t2.el.classList.add('matched');
            matchedPairs++;
            flippedTiles = [];
            isLocked = false;

            if (matchedPairs === 8) {
                victory();
            }
        }, 600);
    } else {
        // No match
        setTimeout(() => {
            t1.el.classList.remove('flipped');
            t2.el.classList.remove('flipped');
            flippedTiles = [];
            isLocked = false;
        }, 1000);
    }
}

function updateMoves() {
    document.getElementById('mem-moves').innerText = moves;
}

// --- RAINDROP RACE ---
let rainInterval = null;
let gameLoopId = null;
let activeDrops = [];
let rainScore = 0;
let rainLives = 5;
let spawnRate = 2000;
let dropSpeed = 1.5;

export function startRaindropGame() {
    const db = Storage.getDB();
    const filterTags = db.settings ? (db.settings.activeFilter || []) : [];
    let pool = db.words;

    if (filterTags.length > 0) {
        pool = pool.filter(w => w.tags && filterTags.some(t => w.tags.includes(t)));
    }

    if (pool.length < 5) {
        const tagLabel = filterTags.length === 1 ? filterTags[0] : `${filterTags.length} tags`;
        alert(filterTags.length > 0 ? `Not enough words with filter '${tagLabel}' (need 5)` : "Need at least 5 words to play!");
        return;
    }

    // Reset
    rainScore = 0;
    rainLives = 5;
    spawnRate = 2000;
    dropSpeed = 1.5;
    activeDrops = [];
    document.getElementById('rain-score').innerText = '0';
    document.getElementById('rain-lives').innerText = '❤️❤️❤️';
    document.getElementById('rain-area').innerHTML = '';
    document.getElementById('rain-input').value = '';

    // Show Screen
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('raindrop-game-screen').classList.remove('hidden');
    document.getElementById('rain-input').focus();

    // Listeners
    document.getElementById('rain-input').onkeydown = (e) => {
        if (e.key === 'Enter') handleRainInput(e.target);
    };

    // Start Loops
    rainInterval = setInterval(spawnDrop, spawnRate);
    gameLoop();
}

function spawnDrop() {
    const db = Storage.getDB();
    const filterTags = db.settings ? (db.settings.activeFilter || []) : [];
    let pool = db.words;
    if (filterTags.length > 0) {
        pool = pool.filter(w => w.tags && filterTags.some(t => w.tags.includes(t)));
    }

    // Fallback
    if (pool.length === 0) pool = db.words;

    const word = pool[Math.floor(Math.random() * pool.length)];

    // Create Element
    const el = document.createElement('div');
    el.className = 'raindrop';
    el.innerHTML = `<span>${word.word}</span>`;

    // Use slightly less than 100vw to avoid overflow
    const maxLeft = window.innerWidth - 120;
    el.style.left = Math.random() * maxLeft + 'px';
    el.style.top = '-100px';

    document.getElementById('rain-area').appendChild(el);

    activeDrops.push({
        id: word.id,
        word: word.word,
        def: word.def, // The target answer (definition) - OR should it be translation?
        // Wait, "Foreign Word" falls, user types "Translation"? 
        // Assuming 'word' is Foreign (German) and 'def' is Definition (English).
        // Let's allow either if it's too hard? Or stick to Definition.
        // Let's stick to Definition (or part of it).
        el: el,
        y: -100
    });
}

function gameLoop() {
    gameLoopId = requestAnimationFrame(gameLoop);

    const killZone = window.innerHeight - 100; // Above input area

    activeDrops.forEach((drop, idx) => {
        drop.y += dropSpeed;
        drop.el.style.top = drop.y + 'px';

        if (drop.y > killZone) {
            // Missed!
            activeDrops.splice(idx, 1);
            if (drop.el.parentNode) drop.el.parentNode.removeChild(drop.el);
            loseLife();
        }
    });
}

function handleRainInput(input) {
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    // Check matches
    const matchIndex = activeDrops.findIndex(drop => {
        // Simple fuzzy: active drop definition contains input?
        // Or input contains definition?
        // Or exact match?
        // Let's do: Input must be contained in definition (easy mode) or exact.
        // Actually, usually it's "Type what you see" (typing practice) OR "Translate".
        // User prompt said: "Type the correct translation".
        return drop.def.toLowerCase().includes(val) && val.length > 2; // Min 3 chars to prevent cheating with 'a'
    });

    if (matchIndex !== -1) {
        // HIT!
        const drop = activeDrops[matchIndex];

        // Remove visual
        // Maybe add pop effect?
        drop.el.style.transform = 'scale(1.5)';
        drop.el.style.opacity = '0';
        setTimeout(() => {
            if (drop.el.parentNode) drop.el.parentNode.removeChild(drop.el);
        }, 200);

        activeDrops.splice(matchIndex, 1);

        rainScore++;
        document.getElementById('rain-score').innerText = rainScore;
        input.value = '';

        // Difficulty scaling
        if (rainScore % 5 === 0) {
            dropSpeed += 0.2;
            clearInterval(rainInterval);
            spawnRate = Math.max(800, spawnRate - 200);
            rainInterval = setInterval(spawnDrop, spawnRate);
        }
    } else {
        // Wrong input feedback?
        input.style.borderColor = 'red';
        setTimeout(() => input.style.borderColor = 'var(--primary)', 200);
    }
}

function loseLife() {
    rainLives--;
    let hearts = '';
    for (let i = 0; i < rainLives; i++) hearts += '❤️';
    document.getElementById('rain-lives').innerText = hearts;

    if (rainLives <= 0) {
        endRaindropGame();
        alert(`Game Over! Final Score: ${rainScore}`);
    }
}

export function endRaindropGame() {
    clearInterval(rainInterval);
    cancelAnimationFrame(gameLoopId);
    activeDrops = [];
    document.getElementById('raindrop-game-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

// --- CROSSWORD ---
let cwGridSize = 15;
let cwGrid = []; // 2D array [row][col] = { char, clueId }
let cwWords = []; // { id, word, clue, row, col, dir(0=ac,1=dn), num }
let cwState = {}; // current grid state

export function startCrosswordGame() {
    const db = Storage.getDB();
    const filterTags = db.settings ? (db.settings.activeFilter || []) : [];
    let pool = db.words;

    if (filterTags.length > 0) {
        pool = pool.filter(w => w.tags && filterTags.some(t => w.tags.includes(t)));
    }

    if (pool.length < 10) {
        const tagLabel = filterTags.length === 1 ? filterTags[0] : `${filterTags.length} tags`;
        alert(filterTags.length > 0 ? `Not enough words with filter '${tagLabel}' (need 10)` : "Need at least 10 words to generate crossword!");
        return;
    }

    // Select words (try more to fit)
    const selection = [...pool].sort(() => 0.5 - Math.random()).slice(0, 15);

    // Generate
    const success = generateCrossword(selection);
    if (!success) {
        alert("Could not generate a valid grid. Try adding more words!");
        return;
    }

    renderCrossword();

    // Show Screen
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('crossword-game-screen').classList.remove('hidden');
}

function generateCrossword(pool) {
    // Reset
    cwGrid = Array(cwGridSize).fill(null).map(() => Array(cwGridSize).fill(null));
    cwWords = [];

    // Sort pool by length desc
    pool.sort((a, b) => b.word.length - a.word.length);

    // Place first word in center horizontal
    const first = pool[0];
    const fRow = Math.floor(cwGridSize / 2);
    const fCol = Math.floor((cwGridSize - first.word.length) / 2);

    if (!placeWord(first, fRow, fCol, 0)) return false;
    cwWords.push({ ...first, row: fRow, col: fCol, dir: 0 });

    const remaining = pool.slice(1);

    // Try to place remaining
    for (const w of remaining) {
        // Try all intersections
        if (cwWords.length >= 10) break; // Enough words

        let placed = false;
        // Shuffle existing words to try random intersections first
        const targets = [...cwWords].sort(() => 0.5 - Math.random());

        for (const target of targets) {
            if (placed) break;

            // Find common letters
            for (let i = 0; i < w.word.length; i++) {
                if (placed) break;
                const char = w.word[i].toLowerCase();

                // Iterate target word chars
                const tWord = target.word;
                for (let j = 0; j < tWord.length; j++) {
                    if (tWord[j].toLowerCase() === char) {
                        // Intersection candidate
                        // Target is Dir 0 (across) -> We must be Dir 1 (down) 
                        // Target is Dir 1 (down) -> We must be Dir 0 (across)
                        const newDir = target.dir === 0 ? 1 : 0;

                        // Calculate start row/col for new word
                        // Intersect at: target(r,c) + j offset
                        const iRow = target.row + (target.dir === 1 ? j : 0);
                        const iCol = target.col + (target.dir === 0 ? j : 0);

                        // New word intersects at index i
                        const sRow = iRow - (newDir === 1 ? i : 0);
                        const sCol = iCol - (newDir === 0 ? i : 0);

                        if (canPlace(w.word, sRow, sCol, newDir)) {
                            placeWord(w, sRow, sCol, newDir);
                            cwWords.push({ ...w, row: sRow, col: sCol, dir: newDir });
                            placed = true;
                        }
                    }
                }
            }
        }
    }

    // Renumber words logic
    // Sort by row then col
    cwWords.sort((a, b) => (a.row - b.row) || (a.col - b.col));
    cwWords.forEach((w, idx) => w.num = idx + 1);

    return cwWords.length >= 5; // Success if at least 5 words placed
}

function canPlace(word, row, col, dir) {
    if (row < 0 || col < 0) return false;
    if (dir === 0 && col + word.length > cwGridSize) return false;
    if (dir === 1 && row + word.length > cwGridSize) return false;

    for (let i = 0; i < word.length; i++) {
        const r = row + (dir === 1 ? i : 0);
        const c = col + (dir === 0 ? i : 0);
        const cell = cwGrid[r][c];

        // Check 1: Conflict
        if (cell && cell.char !== word[i].toLowerCase()) return false;

        // Check 2: Adjacent collision (complex)
        // If cell is empty, it must not have neighbors perpendicular to direction
        if (!cell) {
            if (hasNeighbors(r, c, dir)) return false;

            // Also check immediate start/end of word boundaries
            if (i === 0) {
                // Check before start
                const pr = r - (dir === 1 ? 1 : 0);
                const pc = c - (dir === 0 ? 1 : 0);
                if (isValid(pr, pc) && cwGrid[pr][pc]) return false;
            }
            if (i === word.length - 1) {
                // Check after end
                const nr = r + (dir === 1 ? 1 : 0);
                const nc = c + (dir === 0 ? 1 : 0);
                if (isValid(nr, nc) && cwGrid[nr][nc]) return false;
            }
        }
    }
    return true;
}

function hasNeighbors(row, col, ignoreDir) {
    // If placing ACROSS (0), check DOWN neighbors (row-1, row+1)
    if (ignoreDir === 0) {
        if (isValid(row - 1, col) && cwGrid[row - 1][col]) return true;
        if (isValid(row + 1, col) && cwGrid[row + 1][col]) return true;
    } else {
        // If placing DOWN (1), check ACROSS neighbors (col-1, col+1)
        if (isValid(row, col - 1) && cwGrid[row][col - 1]) return true;
        if (isValid(row, col + 1) && cwGrid[row][col + 1]) return true;
    }
    return false;
}

function isValid(r, c) {
    return r >= 0 && r < cwGridSize && c >= 0 && c < cwGridSize;
}

function placeWord(w, row, col, dir) {
    for (let i = 0; i < w.word.length; i++) {
        const r = row + (dir === 1 ? i : 0);
        const c = col + (dir === 0 ? i : 0);
        cwGrid[r][c] = { char: w.word[i].toLowerCase() };
    }
    return true;
}

function renderCrossword() {
    const gridEl = document.getElementById('cw-grid');
    gridEl.innerHTML = '';

    // Fill Grid
    for (let r = 0; r < cwGridSize; r++) {
        for (let c = 0; c < cwGridSize; c++) {
            const cellData = cwGrid[r][c];
            const div = document.createElement('div');

            if (cellData) {
                div.className = 'cw-cell';

                // Check if this is a word start
                const startWord = cwWords.find(w => w.row === r && w.col === c);
                if (startWord) {
                    div.innerHTML += `<span class="cw-num">${startWord.num}</span>`;
                }

                div.innerHTML += `<input type="text" class="cw-input" maxlength="1" data-r="${r}" data-c="${c}">`;

                // Add Focus listener
                setTimeout(() => {
                    const inp = div.querySelector('input');
                    inp.onkeyup = (e) => handleCwInput(e, r, c);
                }, 0);

            } else {
                div.className = 'cw-cell black';
            }
            gridEl.appendChild(div);
        }
    }

    // Render Clues
    const acrossEl = document.getElementById('clues-across');
    const downEl = document.getElementById('clues-down');
    acrossEl.innerHTML = '';
    downEl.innerHTML = '';

    cwWords.forEach(w => {
        const el = document.createElement('div');
        el.className = 'clue-item';
        el.innerHTML = `<strong>${w.num}</strong>. ${w.def}`; // Definition as clue
        el.id = `clue-${w.id}`;
        el.onclick = () => focusWord(w);

        if (w.dir === 0) acrossEl.appendChild(el);
        else downEl.appendChild(el);
    });
}

function handleCwInput(e, r, c) {
    const val = e.target.value;
    const key = e.key;

    // Check correctness of this cell
    const cell = cwGrid[r][c];
    if (val.toLowerCase() === cell.char) {
        e.target.parentElement.classList.add('correct');
        e.target.parentElement.style.background = '#86efac';
        checkWinCondition();
    } else if (val) {
        e.target.parentElement.classList.remove('correct');
        e.target.parentElement.style.background = 'white';
    }

    // Navigation
    if (val && key.length === 1) {
        // Find direction of current word?
        // Simple: Try Across, then Down
        moveFocus(r, c, 1); // Move to next cell?
        // Ideally we know active direction. For now just try moving right or down based on existence.
    }
}

function moveFocus(r, c, offset) {
    // Find next input
    // Naively scan
    // Implementation of full nav is complex, simplifying:
    // User can just click. Auto-advance is nice-to-have.
}

function focusWord(w) {
    // Highlight cells?
    // Focus first input
    const inp = document.querySelector(`.cw-input[data-r="${w.row}"][data-c="${w.col}"]`);
    if (inp) inp.focus();
}

function checkWinCondition() {
    const inputs = document.querySelectorAll('.cw-input');
    const allCorrect = Array.from(inputs).every(inp => {
        const r = parseInt(inp.dataset.r);
        const c = parseInt(inp.dataset.c);
        return inp.value.toLowerCase() === cwGrid[r][c].char;
    });

    if (allCorrect) {
        setTimeout(() => {
            alert("Crossword Solved! 🎉");
            endCrosswordGame();
        }, 500);
    }
}

export function endCrosswordGame() {
    document.getElementById('crossword-game-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

function victory() {
    // Simple Confetti Effect (CSS or JS)
    // For now, let's just use an alert or a nice toast
    // Ideally we inject a confetti canvas but let's keep it simple first

    setTimeout(() => {
        alert(`Victory! 🎉\nCompleted in ${moves} moves.`);
        endMemoryGame();
    }, 500);
}

export function endMemoryGame() {
    document.getElementById('memory-game-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}
