# Project Context: LingoFlow (Flashcard App)

**Purpose**: This document provides a technical summary of the "LingoFlow" application to assist an AI model in brainstorming features, improvements, or refactoring strategies.

## 1. Application Overview
**Name**: LingoFlow
**Type**: Single Page Application (SPA) / Progressive Web App (PWA)
**Domain**: Language Learning / Flashcards
**Core Philosophy**: Local-First, Privacy-Focused, High Performance.

## 2. Technology Stack
- **Runtime**: Browser (No backend server, deployed via GitHub Pages).
- **Framework**: React 19 (Vite Build Tool).
- **State Management**: Zustand (w/ Persistence Middleware).
- **Database**: IndexedDB (via `idb-keyval` abstraction) for storing 10MB+ datasets locally.
- **Styling**: Tailwind CSS v4 + Lucide React Icons.
- **Routing**: React Router DOM (`HashRouter` for static host compatibility).
- **Testing**: Vitest + React Testing Library (JSDOM environment).

## 3. Code Architecture (`src/`)
The project follows a **Feature-Based Architecture**.

### 📂 `src/features/`
- **`dashboard/`**: Home screen with learning stats (Streak, Due Words) and entry points.
- **`review/`**: The core SRS loop.
  - `ReviewSession.jsx`: Manages the queue, card flipping state, and grading logic.
  - `Flashcard.jsx`: The visual card component with 3D CSS transforms and side-specific content.
- **`dictionary/`**:
  - `DictionaryList.jsx`: Virtualized or paginated list of all words with search/filter.
  - `DictionaryDetail.jsx`: detailed view showing mnemonics, examples, and grammar usage.
- **`games/`**:
  - `MemoryGame.jsx`: Tile matching game.
  - `RaindropGame.jsx`: Typing speed game.

### 📂 `src/lib/` (Core Logic - Pure Functions)
- **`srs.js`**: Implementation of **SuperMemo-2 (SM-2)** algorithm.
  - inputs: `(currentInterval, repetition, easeFactor, grade)`
  - outputs: `(newInterval, newRepetition, newEaseFactor)`
- **`grammar.js`**: Utilities for German language analysis (Gender color coding, Part-of-Speech tagging).
- **`importer.js`**: CSV/DSV parsing logic for user data imports.

### 📂 `src/store/`
- **`useAppStore.js`**: Global Zustand store.
  - Manages `words` (Array), `progress` (Map of ID -> SRS Usage), `settings`, and `filter`.
  - Persists entire state to **IndexedDB** to handle large vocabulary sets (>5MB quota).

## 4. Data Model
**Vocabulary Item Schema**:
```json
{
  "id": "uuid-v4",
  "word": "Die Hausaufgabe",
  "translation": "Homework",
  "grammar": { "pos": "noun", "gender": "feminine" },
  "phonetics": "/.../",
  "examples": [ { "de": "...", "en": "..." } ],
  "learning": {
    "mnemonic": "Visual aid text...",
    "synonyms": ["..."],
    "antonyms": ["..."]
  },
  "tags": ["A1", "School"]
}
```

## 5. Current UI/UX Capabilities
- **Review**: Drag-like or Button-based grading (Again/Hard/Good/Easy).
- **Animations**: CSS 3D transforms for card flips; Tailwind transitions for UI states.
- **Responsiveness**: Mobile-first Sidebar (collapsible overlay on small screens).
- **Accessibility**: Keyboard shortcuts for grading; high contrast text.

## 6. Deployment
- **CI/CD**: GitHub Actions (`deploy.yml`) builds and pushes to `gh-pages` branch.
- **Hosting**: GitHub Pages (Static).
