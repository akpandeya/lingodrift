# LingoDrift 🌊
A local-first, immersive flashcard app for mastering German vocabulary. It combines the power of **Spaced Repetition (SRS)** with gamified learning and rich dictionary lookups.

Built with **React 19**, **Vite**, and **Tailwind CSS**, it offers a premium, app-like experience directly in the browser.

## ✨ Key Features

- **📚 Smart Learning (SRS)**: Uses the **SuperMemo-2** algorithm to schedule reviews at the optimal time, ensuring long-term retention.
- **📖 Rich Dictionary**: Explore a comprehensive vocabulary database with:
  - **Examples**: Contextual sentences for every word.
  - **Mnemonics**: Built-in memory aids.
  - **Grammar**: Gender (Der/Die/Das) and Part-of-Speech tagging.
  - **Synonyms & Antonyms**.
- **🎮 Gamification**:
  - **Memory Match**: A classic tile-matching game to test word associations.
  - **Raindrop Race**: A fast-paced typing game to improve recall speed.
- **🔒 Local-First & Private**:
  - All progress is saved in your browser's **IndexedDB**.
  - No account required, no tracking, no external servers.
  - Works offline once loaded.
- **🎨 Premium UI**:
  - Dark mode by default.
  - 3D card flip animations.
  - Responsive layout for Mobile & Desktop.

## 🛠️ Technology Stack

- **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb-keyval`)
- **Routing**: React Router DOM (HashRouter)
- **Testing**: Vitest + React Testing Library

## 📂 Project Structure

```
├── public/
│   ├── data/
│   │   ├── vocabulary.json   # Main vocabulary database (~10MB)
│   │   └── decks.json        # Course definitions
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── layout/           # Sidebar, Layout wrappers
│   │   └── DataLoader.jsx    # Handles initial data seeding
│   ├── features/
│   │   ├── dashboard/        # Home screen
│   │   ├── dictionary/       # Dictionary list and detail views
│   │   ├── games/            # Game logic (Memory, Raindrop)
│   │   └── review/           # Flashcard & Session logic
│   ├── lib/                  # Core algorithms (SRS, Grammar, Importer)
│   ├── store/                # Zustand global state
│   └── App.jsx               # Main routing & app entry
└── index.html                # Entry point
```

## 🚀 Getting Started

To run the project locally on your machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/akpandeya/flashcards.git
    cd flashcards
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

4.  **Run Tests** (Optional):
    ```bash
    npm test
    ```

## 💾 Data Management

LingoDrift allows you to "Bring Your Own Data".
- **Initial Load**: On first launch, the app attempts to fetch `vocabulary.json` from the `public/data/` directory and seed the internal database.
- **Persistence**: After the initial seed, all data (including your learning progress) lives in **IndexedDB** in your browser. This bypasses the typical 5MB `localStorage` limit, allowing for massive vocabulary lists.

## 📦 Deployment

The project is configured for extensive CD via **GitHub Actions**.
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Pushing to the `main` branch automatically builds and deploys the app to **GitHub Pages**.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
