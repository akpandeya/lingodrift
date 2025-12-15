/**
 * CSV Importer Logic
 * Parses CSV/DSV strings into Arrays of Objects.
 */

/**
 * Parses a delimited string into an array of objects.
 * Assumes the first row is the header.
 * @param {string} content - Raw file content
 * @param {string} delimiter - Separator (default '|')
 * @returns {Array<Object>}
 */
export function parseCSV(content, delimiter = '|') {
    if (!content) return [];

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const headers = parseLine(lines[0], delimiter);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], delimiter);

        // Skip if column count mismatch (or handle gracefully)
        if (values.length > 0) {
            const row = {};
            headers.forEach((h, index) => {
                row[h] = values[index] || '';
            });
            result.push(row);
        }
    }

    return result;
}

/**
 * Helper to parse a single line, handling quotes.
 * @param {string} line 
 * @param {string} delimiter 
 * @returns {Array<string>}
 */
function parseLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === delimiter && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
