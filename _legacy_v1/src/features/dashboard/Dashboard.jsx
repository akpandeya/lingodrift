import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
    const { stats, filter, setFilterLevel, getDueCards } = useAppStore();
    const navigate = useNavigate();

    const dueCount = getDueCards().length;

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h3 className="text-slate-400 text-sm font-uppercase tracking-wider">Due Today</h3>
                    <div className="text-3xl font-bold text-teal-400 mt-2">{dueCount} Cards</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h3 className="text-slate-400 text-sm font-uppercase tracking-wider">Streak</h3>
                    <div className="text-3xl font-bold text-orange-400 mt-2">🔥 {stats.streak}</div>
                </div>
            </div>

            {/* Level Selection */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-white">Select Level</h2>
                <div className="flex gap-4">
                    {['A1', 'A2', 'B1', 'B2'].map(level => (
                        <button
                            key={level}
                            onClick={() => setFilterLevel(level)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${filter.level === level
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </section>

            {/* Games Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-white">Mini Games</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div onClick={() => navigate('/games/memory')} className="group bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 cursor-pointer transition-all">
                        <div className="text-3xl mb-2">🧩</div>
                        <h3 className="text-lg font-bold text-white group-hover:text-teal-400">Memory Match</h3>
                        <p className="text-slate-400 text-sm">Find pairs of words and matches.</p>
                    </div>

                    <div onClick={() => navigate('/games/raindrop')} className="group bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all">
                        <div className="text-3xl mb-2">💧</div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400">Raindrop Race</h3>
                        <p className="text-slate-400 text-sm">Type fast before words hit the ground.</p>
                    </div>
                </div>
            </section>

            {/* Hero / Start Section */}
            <div className="bg-gradient-to-r from-teal-900/50 to-blue-900/50 p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Ready to learn?</h1>
                <p className="text-slate-300 max-w-lg mb-8">
                    You have {dueCount} cards due for review. Start your daily session now to keep your streak alive.
                </p>
                <button
                    onClick={() => navigate('/review')}
                    className="bg-white text-slate-900 font-bold py-4 px-12 rounded-full hover:scale-105 transition-transform shadow-xl"
                >
                    Start Session
                </button>
            </div>
        </div>
    );
}
