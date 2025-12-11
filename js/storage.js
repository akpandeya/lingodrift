export const STORAGE_KEY = 'lingoflow_db_v2';

let db = {
    words: [],
    progress: {} // { [id]: { interval, repetition, easeFactor, dueDate } }
};

export function getDB() {
    return db;
}

export function setDB(newDB) {
    db = newDB;
    save();
}

export function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            db = JSON.parse(raw);
            // Migration check could go here if moving from v1 to v2
            if (!db.words) db.words = [];
            if (!db.progress) db.progress = {};
            if (!db.stats) db.stats = { streak: 0, lastReviewDate: null };
        } catch (e) {
            console.error("Corrupt DB", e);
        }
    }
    return db;
}

export function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function updateProgress(id, state) {
    db.progress[id] = state;
    save();
}

export function parseCSVData(text) {
    const lines = text.split('\n');
    let newWords = [];

    lines.forEach(line => {
        if (!line.trim()) return;
        const cols = line.split('|');
        if (cols.length < 1) return;

        const rawWord = cols[0];
        const cleanWord = rawWord.split('#')[0].trim();
        if (!cleanWord) return;

        const id = cleanWord;

        newWords.push({
            id: id,
            word: cleanWord,
            pos: cols[1] || 'Word',
            def: cols[5] || 'No definition',
            ex_de: cols[8] || '',
            ex_en: cols[9] || '',
            tags: cols[10] ? cols[10].split(',').map(t => t.trim()) : []
        });
    });
    return newWords;
}

export function mergeWords(newWords, notify = true) {
    let added = 0;
    const existing = new Set(db.words.map(w => w.id));

    newWords.forEach(w => {
        if (!existing.has(w.id)) {
            db.words.push(w);
            existing.add(w.id);
            added++;
        }
    });

    if (added > 0) {
        save();
        return { added, message: `Added ${added} new words!` };
    } else {
        return { added: 0, message: "No new words found." };
    }
}

export function clearData() {
    localStorage.removeItem(STORAGE_KEY);
    db = { words: [], progress: {} };
    save();
}
