/**
 * Library View
 * Displays available courses/decks from data/decks.json
 */

export async function init() {
    // Check if container exists, if not create it (lazy check)
    // In index.html we will manually add the container, but here we can ensure referenced
}

export async function render() {
    const container = document.getElementById('library-list');
    if (!container) return;

    container.innerHTML = '<div style="color:white;text-align:center;">Loading courses...</div>';

    try {
        const resp = await fetch('data/decks.json');
        const decks = await resp.json();

        container.innerHTML = '';

        decks.forEach(deck => {
            const card = document.createElement('div');
            card.className = 'glass-panel';
            card.style.borderColor = deck.color || 'var(--glass-border)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '12px';
            card.style.cursor = 'pointer';
            card.style.marginBottom = '20px';

            // Hover effect logic could be css, designating class

            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <h2 style="font-size:1.5rem;color:${deck.color}">${deck.title}</h2>
                    ${deck.count ? `<span style="background:${deck.color}20;color:${deck.color};padding:4px 8px;border-radius:8px;font-size:0.8rem;font-weight:bold;">${deck.count} Words</span>` : ''}
                </div>
                <p style="color:var(--text-muted);font-size:1rem;margin:0;">${deck.description}</p>
                <div style="margin-top:auto;display:flex;justify-content:flex-end;">
                     <button class="btn-primary" style="background:${deck.color};padding:10px 24px;">Start Learning</button>
                </div>
            `;

            card.onclick = () => {
                window.app.loadDeck(deck.id);
            };

            container.appendChild(card);
        });

    } catch (e) {
        container.innerHTML = `<div style="color:var(--error);">Failed to load courses.</div>`;
        console.error(e);
    }
}
