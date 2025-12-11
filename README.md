# LingoFlow 🌊

**LingoFlow** is a premium, "Local-First" Flashcard PWA (Progressive Web App) gamifying vocabulary mastery. It combines Spaced Repetition (SRS) with arcade-style mini-games to make learning addictive.

[LingoFlow Preview](https://akpandeya.github.io/flashcards/)

## 🚀 Features

### Core Learning
-   **🧠 Spaced Repetition (SM2)**: Optimized review schedules based on performance.
-   **🏗️ Smart Filters**: Filter cards by CEFR Level (A1-C2) and Topics (e.g., Food, Travel).
-   **📚 Dictionary**: Searchable database with definitions, tags, and audio pronunciation.
-   **💾 Local-First Persistence**: All data lives in your browser's LocalStorage. No login required.

### 🎮 Arcade Mode
-   **🃏 Memory Match**: Find pairs of German words and their images/definitions.
-   **💧 Raindrop Race**: Type words before they hit the ground.
-   **🧩 Crossword**: Solve puzzles generated dynamically from your vocabulary.

### 🛠 Technical
-   **Modular ES6 Architecture**: Clean separation of Logic (Core), State, and UI.
-   **PWA**: Installable on Android/iOS with offline support.
-   **CI/CD**: Automated testing via GitHub Actions.

## 📂 Project Structure

```bash
.
├── css/             # Styles directory
├── data/            # Vocabulary CSVs (a1_vocabulary.csv, a2_vocabulary.csv)
├── js/
│   ├── core/        # Logic: SRS, Storage, Parser
│   ├── games/       # Game Modules: Memory, Raindrop, Crossword
│   ├── ui/          # Components: Dashboard, Dictionary, Review
│   ├── app.js       # Main Controller
│   └── state.js     # State Management (Singleton)
├── tests/           # Mocha/Chai Unit Tests
├── index.html       # Single Page Application Entry
├── sw.js            # Service Worker (Offline Caching)
└── package.json     # Dev dependencies & Test scripts
```

## 🛠 Usage

1.  **Start Learning**:
    -   The app automatically loads `a1_vocabulary.csv` and `a2_vocabulary.csv`.
    -   Use the **Dashboard** to set a daily goal and track your streak.
    -   Click **Start Daily Session** to review due cards.

2.  **Import Data**:
    -   Click "Import Words" in the dashboard.
    -   Format: Pipe-delimited CSV (`German|...|Definition|...|Tags`).

3.  **Development**:
    ```bash
    # Install dependencies
    npm install

    # Run Tests
    npm test
    ```
## 🧪 Testing

The project uses **Mocha** and **Chai** for unit testing.
-   **Core Logic**: Validates the SM2 algorithm and CSV parsing.
-   **State**: Ensures filters and data integrity work correctly.
-   **CI/CD**: Tests run automatically on push to `main` via GitHub Actions.

## 📦 Deployment

Hosted on **GitHub Pages**. Code pushed to `main` is automatically deployed.

---
*Built with ❤️ using Vanilla JS, HTML5, and CSS3.*
