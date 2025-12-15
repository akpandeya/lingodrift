import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom Storage Engine for IndexedDB
const storage = {
    getItem: async (name) => {
        // console.log(name, 'has been retrieved');
        return (await get(name)) || null;
    },
    setItem: async (name, value) => {
        // console.log(name, 'with value', value, 'has been saved');
        await set(name, value);
    },
    removeItem: async (name) => {
        // console.log(name, 'has been deleted');
        await del(name);
    },
};

export const useAppStore = create(
    persist(
        (set, get) => ({
            words: [],
            progress: {}, // { [wordId]: { interval, repetition, easeFactor, dueDate } }
            stats: {
                streak: 0,
                lastReviewDate: null,
            },
            settings: {
                activeFilter: [], // Legacy tags
            },
            filter: {
                level: null,
                topics: [],
            },

            // Actions
            setFilterLevel: (level) => set((state) => ({ filter: { ...state.filter, level } })),

            addWords: (newWords) => set((state) => {
                const existingIds = new Set(state.words.map((w) => w.id));
                const toAdd = newWords.filter((w) => !existingIds.has(w.id));
                if (toAdd.length === 0) return {};

                return {
                    words: [...state.words, ...toAdd]
                };
            }),

            updateWordProgress: (id, srsData) => set((state) => ({
                progress: {
                    ...state.progress,
                    [id]: srsData
                }
            })),

            resetProgress: () => set({ progress: {}, stats: { streak: 0, lastReviewDate: null } }),

            // Computed (Helpers)
            getDueCards: () => {
                const { words, progress, filter } = get();
                const now = Date.now();

                return words.filter(w => {
                    // Filter check
                    if (filter.level && w.level !== filter.level) return false;
                    // Topic check (if implemented)

                    // SRS check
                    const p = progress[w.id];
                    if (!p) return true; // New card
                    return p.dueDate <= now;
                });
            }
        }),
        {
            name: 'lingoflow-storage', // unique name
            storage: createJSONStorage(() => storage),
        }
    )
);
