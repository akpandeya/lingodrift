import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DictionaryList() {
    const navigate = useNavigate();
    const { words } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter logic
    const filteredWords = useMemo(() => {
        if (!searchTerm) return words;
        const lower = searchTerm.toLowerCase();
        return words.filter(w =>
            w.word.toLowerCase().includes(lower) ||
            (w.translation && w.translation.toLowerCase().includes(lower))
        );
    }, [words, searchTerm]);

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-slate-950 pb-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search words..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredWords.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">
                        No words found.
                    </div>
                ) : (
                    filteredWords.map((word) => (
                        <div
                            key={word.id}
                            onClick={() => navigate(`/dictionary/${word.id}`)}
                            className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 rounded-xl border border-slate-800/50 hover:border-teal-500/30 cursor-pointer transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-white group-hover:text-teal-400 transition-colors">{word.word}</span>
                                <span className="text-sm text-slate-400">{word.translation || 'No translation'}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                {word.level && (
                                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
                                        {word.level}
                                    </span>
                                )}
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-teal-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
