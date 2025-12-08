# LingoFlow 🌊

**LingoFlow** is a premium, single-file Flashcard PWA (Progressive Web App) designed for mastering vocabulary with a beautiful, gesture-friendly interface.

![LingoFlow Preview](https://via.placeholder.com/800x400.png?text=LingoFlow+Preview)

## 🚀 Features

-   **Premium UI**: Glassmorphism design with animated backgrounds and smooth transitions.
-   **📚 Smart Dictionary**: Searchable word list with definitions and deletion support.
-   **🔄 spaced Repetition**: Review mode with 3D card flips and "Know / Not Yet" tracking.
-   **💾 Persistence**: Auto-saves your progress to your device (LocalStorage).
-   **📲 Installable (PWA)**: Works offline and installs as a native app on Android/iOS.
-   **📤 Import/Export**: Import words via pipe-delimited CSV and backup your full database to JSON.

## 🛠 Usage

1.  **Add Words**:
    -   Import a CSV file (Format: `Word|POS|...|Definition|...|Ex_De|Ex_En`).
    -   Or restore a previous backup JSON.
2.  **Review**:
    -   Swipe or tap to flip cards.
    -   Mark words as "I Know This" to remove them from the active queue.
3.  **Install**:
    -   Open in Chrome/Safari.
    -   Tap **Add to Home Screen**.

## 📦 Deployment (GitHub Pages)

This project is designed to run on GitHub Pages.

1.  Push code to the `main` branch.
2.  Go to **Settings > Pages**.
3.  Select Source: `Deploy from a branch` -> `main` / `root`.
4.  Your app will be live at `https://<username>.github.io/flashcards/`.

## 📂 Project Structure

-   `index.html`: The complete application (HTML, CSS, JS).
-   `sw.js`: Service Worker for offline capabilities.
-   `README.md`: This file.

---
*Built with Vanilla JS, HTML5, and CSS3.*
