import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ArrowLeft, Edit, Trash2, Volume2 } from 'lucide-react';
import { analyzeWordStyle } from '../../lib/grammar';

export function DictionaryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { words } = useAppStore();

    const word = words.find(w => w.id === id);

    if (!word) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-xl font-bold text-white">Word not found</h2>
                <button onClick={() => navigate('/dictionary')} className="mt-4 text-teal-400">Back to Dictionary</button>
            </div>
        );
    }

    const grammarStyle = analyzeWordStyle(word.pos, word.word);

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header / Nav */}
            <button
                onClick={() => navigate('/dictionary')}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back to List</span>
            </button>

            {/* Main Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Top Banner (Grammar Coded) */}
                <div className={`h-2 ${getGrammarColor(grammarStyle.styleClass)} w-full`}></div>

                <div className="p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-slate-800 text-slate-300 border border-slate-700`}>
                                    {word.pos || 'Word'}
                                </span>
                                {word.level && <span className="text-xs text-slate-500 font-mono">{word.level}</span>}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{word.word}</h1>
                            <p className="text-2xl text-slate-400">{word.translation}</p>
                            {word.phonetics && <p className="text-slate-500 font-mono mt-2">{word.phonetics}</p>}
                        </div>

                        <div className="flex gap-2">
                            <button className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 transition-colors">
                                <Volume2 size={24} />
                            </button>
                            {/* Edit/Delete Placeholders */}
                            <button className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                <Edit size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        {/* Definition Section */}
                        {word.def && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Definition</h3>
                                <p className="text-lg text-slate-200 leading-relaxed">{word.def}</p>
                            </div>
                        )}

                        {/* Example Section */}
                        {(word.example || word.example_en) && (
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-800">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Example Usage</h3>
                                {word.example && <p className="text-xl text-white italic mb-2">"{word.example}"</p>}
                                {word.example_en && <p className="text-slate-400">{word.example_en}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="bg-slate-950 p-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-xs text-slate-500 uppercase">Next Review</span>
                        <span className="text-slate-300">Not started</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-500 uppercase">Ease Factor</span>
                        <span className="text-slate-300">2.5</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getGrammarColor(styleClass) {
    switch (styleClass) {
        case 'style-masc': return 'bg-blue-500';
        case 'style-fem': return 'bg-red-500';
        case 'style-neut': return 'bg-green-500';
        case 'style-verb': return 'bg-purple-500';
        case 'style-adj': return 'bg-yellow-500';
        default: return 'bg-slate-500';
    }
}
