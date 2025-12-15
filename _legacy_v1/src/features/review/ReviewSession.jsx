import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateNextState, Grades } from '../../lib/srs';
import { Flashcard } from './Flashcard';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function ReviewSession() {
    const navigate = useNavigate();
    const { words, progress, updateWordProgress, filter } = useAppStore();

    // Local Session State
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Initialize Session
    useEffect(() => {
        if (queue.length > 0) return; // Don't reset if already playing

        const due = words.filter(w => {
            const p = progress[w.id];
            if (!p) return true; // New
            return p.dueDate <= Date.now();
        });

        // Sort logic or shuffle can go here
        // For now, strict shuffle
        const shuffled = [...due].sort(() => Math.random() - 0.5);
        setQueue(shuffled.slice(0, 20)); // Limit to 20 for now
    }, [words]); // Only run on mount or when DB changes

    const activeCard = queue[currentIndex];

    const handleRate = (grade) => {
        if (!activeCard) return;

        // Calc next state
        const currentProgress = progress[activeCard.id] || null;
        const nextState = calculateNextState(currentProgress, grade);

        // Update DB
        updateWordProgress(activeCard.id, nextState);

        // Flip back first
        setIsFlipped(false);

        // Wait for flip animation (500ms) + buffer before changing content
        setTimeout(() => {
            // Next Card
            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setSessionComplete(true);
            }
        }, 600);
    };

    if (!activeCard && !sessionComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white">All caught up!</h2>
                <p className="text-slate-400 mt-2">No cards due for review right now.</p>
                <button onClick={() => navigate('/')} className="mt-8 text-teal-400 hover:text-teal-300">Return to Dashboard</button>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <CheckCircle size={64} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-bold text-white">Session Complete!</h2>
                <p className="text-slate-400 mt-2">You reviewed {queue.length} cards.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-full transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="w-full flex justify-between text-slate-400 text-sm mb-6">
                <span>Session Progress</span>
                <span>{currentIndex + 1} / {queue.length}</span>
            </div>

            {/* Card Area */}
            <div className="flex-1 w-full flex items-center justify-center relative perspective-container">
                <Flashcard
                    card={activeCard}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                />
            </div>

            {/* Controls */}
            <div className={`w-full mt-8 grid grid-cols-4 gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={() => handleRate(Grades.AGAIN)} className="p-4 rounded-xl bg-slate-800 border-b-4 border-red-500 text-red-400 font-bold active:border-b-0 active:translate-y-1">Again</button>
                <button onClick={() => handleRate(Grades.HARD)} className="p-4 rounded-xl bg-slate-800 border-b-4 border-orange-500 text-orange-400 font-bold active:border-b-0 active:translate-y-1">Hard</button>
                <button onClick={() => handleRate(Grades.GOOD)} className="p-4 rounded-xl bg-slate-800 border-b-4 border-teal-500 text-teal-400 font-bold active:border-b-0 active:translate-y-1">Good</button>
                <button onClick={() => handleRate(Grades.EASY)} className="p-4 rounded-xl bg-slate-800 border-b-4 border-blue-500 text-blue-400 font-bold active:border-b-0 active:translate-y-1">Easy</button>
            </div>

            {!isFlipped && (
                <div className="h-20 flex items-center justify-center text-slate-500 animate-pulse">
                    Tap card to reveal answer
                </div>
            )}
        </div>
    );
}
