import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2 } from 'lucide-react';

export function DataLoader({ children }) {
    const { words, addWords } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only load if we have no words
        if (words.length > 0) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Vocabulary
                const vocabRes = await fetch('./data/vocabulary.json');
                if (!vocabRes.ok) throw new Error('Failed to load vocabulary');
                const vocabData = await vocabRes.json();

                // Add to Store (This might be heavy for 10MB JSON, but Zustand handles it okay mostly)
                // Ensure data format matches expected { id, word, translation, etc. }
                // The previous system used a specific format. Let's assume the JSON is array of objects.
                if (Array.isArray(vocabData)) {
                    addWords(vocabData);
                } else if (vocabData.words) {
                    addWords(vocabData.words);
                }

                // Fetch Decks (Optional, but good for metadata if needed later)
                // const decksRes = await fetch('./data/decks.json');

            } catch (err) {
                console.error("Data Load Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [words.length, addWords]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
                <Loader2 size={48} className="animate-spin text-teal-500 mb-4" />
                <h2 className="text-xl font-bold">Loading Library...</h2>
                <p className="text-slate-400">Preparing your flashcards</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold">Error Loading Data</h2>
                <p className="text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return children;
}
