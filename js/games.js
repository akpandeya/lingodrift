import * as Storage from './storage.js';

let flippedTiles = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

export function startMemoryGame() {
    const db = Storage.getDB();
    if (db.words.length < 8) {
        alert("You need at least 8 words to play!");
        return;
    }

    // Reset Game State
    flippedTiles = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    updateMoves();

    // Select 8 random words
    const deck = [...db.words].sort(() => 0.5 - Math.random()).slice(0, 8);

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
    if (db.words.length < 5) {
        alert("Need at least 5 words to play!");
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
    const word = db.words[Math.floor(Math.random() * db.words.length)];

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
