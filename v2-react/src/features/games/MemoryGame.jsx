import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export function MemoryGame() {
    const navigate = useNavigate();
    const { words } = useAppStore();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState(new Set());
    const [disabled, setDisabled] = useState(false);

    // Initialize Game
    useEffect(() => {
        initializeGame();
    }, [words]);

    const initializeGame = () => {
        if (words.length < 8) return;

        // Pick 8 random words
        const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 8);

        // Create pairs
        const deck = [];
        shuffledWords.forEach(w => {
            deck.push({ id: w.id, content: w.word, type: 'word', pairId: w.id });
            deck.push({ id: `${w.id}-trans`, content: w.translation || '?', type: 'trans', pairId: w.id });
        });

        // Shuffle deck
        setCards(deck.sort(() => 0.5 - Math.random()));
        setFlipped([]);
        setMatched(new Set());
        setDisabled(false);
    };

    const handleClick = (index) => {
        if (disabled) return;
        if (flipped.includes(index)) return;
        if (matched.has(cards[index].pairId)) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisabled(true);
            const [firstIndex, secondIndex] = newFlipped;

            if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
                // Match
                setMatched(prev => new Set([...prev, cards[firstIndex].pairId]));
                setFlipped([]);
                setDisabled(false);
            } else {
                // No Match - Reset after delay
                setTimeout(() => {
                    setFlipped([]);
                    setDisabled(false);
                }, 1000);
            }
        }
    };

    if (words.length < 8) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-xl text-white font-bold">Not enough words</h2>
                <p className="text-slate-400">You need at least 8 words to play Memory.</p>
                <button onClick={() => navigate('/')} className="mt-4 text-teal-400">Go Back</button>
            </div>
        );
    }

    const isWin = matched.size === 8;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="flex gap-4">
                    <div className="text-slate-300 font-bold">Matches: {matched.size} / 8</div>
                    <button onClick={initializeGame} className="text-teal-400 hover:text-teal-300 flex items-center gap-2">
                        <RotateCcw size={20} /> Restart
                    </button>
                </div>
            </div>

            {isWin && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center p-8 bg-slate-900 rounded-3xl border border-teal-500/50 shadow-2xl animate-bounce-in">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-4xl font-bold text-white mb-2">You Win!</h2>
                        <button onClick={initializeGame} className="mt-6 bg-teal-500 text-white font-bold py-3 px-8 rounded-full">Play Again</button>
                    </div>
                </div>
            )}

            <div className="flex-1 grid grid-cols-4 gap-4 auto-rows-fr">
                {cards.map((card, idx) => {
                    const isFlipped = flipped.includes(idx) || matched.has(card.pairId);
                    return (
                        <div
                            key={`${card.id}-${idx}`}
                            onClick={() => handleClick(idx)}
                            className={`relative cursor-pointer transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                            style={{ perspective: '1000px' }}
                        >
                            <div className={`absolute inset-0 bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center backface-hidden shadow-lg transition-colors hover:border-teal-500/50 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                                <span className="text-3xl opacity-20">?</span>
                            </div>

                            <div
                                className={`absolute inset-0 bg-slate-900 rounded-xl border-2 flex items-center justify-center backface-hidden p-2 text-center shadow-xl rotate-y-180 ${matched.has(card.pairId) ? 'border-green-500/80 bg-green-900/20' : 'border-teal-500'}`}
                                style={{ transform: 'rotateY(180deg)' }}
                            >
                                <span className="font-bold text-white md:text-lg select-none">{card.content}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
