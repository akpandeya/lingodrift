import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Zap } from 'lucide-react';

export function RaindropGame() {
    const navigate = useNavigate();
    const { words } = useAppStore();
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [gameOver, setGameOver] = useState(false);
    const [inputVal, setInputVal] = useState('');

    // Game Refs (Mutable state for game loop)
    const dropsRef = useRef([]);
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const spawnTimerRef = useRef(0);
    const lastTimeRef = useRef(0);

    // Settings
    const SPAWN_RATE = 2000;
    const DROP_SPEED = 100; // Pixels per second

    useEffect(() => {
        if (words.length < 5) return;

        // Start Loop
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(gameLoop);

        return () => cancelAnimationFrame(requestRef.current);
    }, [words]);

    const gameLoop = (time) => {
        if (gameOver) return;

        const deltaTime = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        // Updates
        updateDrops(deltaTime);
        spawnDrops(deltaTime);

        // Draw happens naturally via React state if we used it, 
        // but here we forceUpdate or use a Canvas.
        // Actually, let's use a "tick" state to force re-render positions? 
        // No, that kills performance.
        // Better: Modifying DOM directly or using Canvas.
        // Let's use pure React state for "existence" and CSS Animations?
        // User requested direct port. The original used DOM manipulation.
        // I'll stick to React State for mapped items, but update their positions via Refs + forceUpdate is tricky.
        // Hybrid: Drops are state, but positions are CSS animation?
        // No, collision detection requires known position.

        // Let's go with the canvas approach or a dedicated Game Engine like logic.
        // For simplicity in this stack:
        // I will use a simple state ticker that updates ~30fps, or use CSS Keyframes for falling 
        // and just "validate" on enter.

        // "CSS Only" approach for movement is best for React.
        // 1. Spawn a drop with a `animation-duration`.
        // 2. On `animationEnd`, remove life.
        // 3. On Input match, remove drop + add score.

        // But I need to pass `gameLoop` for consistency?
        // Let's rewrite using the standard requestAnimationFrame for logic, but maybe update DOM directly?
        // Actually, simple React State update at 30fps is fine for < 20 items.

        // Let's try the State Update driven loop.
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    // Wait... React state updates in rAF might be jittery. 
    // Let's try the CSS Animation approach. It's much smoother for web apps.
    // I will control "Existing Drops" in state.

    return <RaindropGameCSSBased words={words} navigate={navigate} />;
}


function RaindropGameCSSBased({ words, navigate }) {
    const [drops, setDrops] = useState([]); // { id, word, def, key }
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [active, setActive] = useState(true);
    const [inputValue, setInputValue] = useState('');

    // Refs for timers
    const spawnTimer = useRef(null);

    // Start Spawning
    useEffect(() => {
        if (words.length < 5) return;

        const spawn = () => {
            if (!active) return;
            const w = words[Math.floor(Math.random() * words.length)];
            const id = Date.now();
            const left = Math.random() * 80 + 10; // 10% to 90%

            setDrops(prev => [...prev, { ...w, uiId: id, left }]);
        };

        spawnTimer.current = setInterval(spawn, 2000);
        return () => clearInterval(spawnTimer.current);
    }, [words, active]);

    const handleInput = (e) => {
        if (e.key === 'Enter') {
            const val = inputValue.toLowerCase().trim();
            // Find match
            const matchId = drops.find(d =>
                (d.translation && d.translation.toLowerCase().includes(val)) ||
                (d.def && d.def.toLowerCase().includes(val))
            );

            if (matchId) {
                // Hit
                setScore(s => s + 1);
                setDrops(prev => prev.filter(d => d.uiId !== matchId.uiId));
                setInputValue('');
            } else {
                // Miss visual cue?
                setInputValue('');
            }
        }
    };

    const handleAnimationEnd = (uiId) => {
        // Drop reached bottom
        setDrops(prev => {
            if (prev.find(d => d.uiId === uiId)) {
                setLives(l => {
                    const newLives = l - 1;
                    if (newLives <= 0) setActive(false);
                    return newLives;
                });
                return prev.filter(d => d.uiId !== uiId);
            }
            return prev;
        });
    };

    if (words.length < 5) return <div className="p-8 text-center">Not enough words</div>;

    return (
        <div className="relative h-full w-full overflow-hidden bg-slate-900">
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-4 text-white font-bold">
                <button onClick={() => navigate('/')}><ArrowLeft /></button>
                <div className="flex gap-2 items-center"><Heart className="text-red-500" fill="currentColor" /> {lives}</div>
                <div className="flex gap-2 items-center"><Zap className="text-yellow-400" fill="currentColor" /> {score}</div>
            </div>

            {/* Game Area */}
            {active ? (
                <>
                    {drops.map(drop => (
                        <div
                            key={drop.uiId}
                            className="absolute px-4 py-2 bg-blue-500/80 rounded-full text-white font-bold shadow-lg backdrop-blur"
                            style={{
                                left: `${drop.left}%`,
                                top: '-50px',
                                animation: `fall 6s linear forwards`
                            }}
                            onAnimationEnd={() => handleAnimationEnd(drop.uiId)}
                        >
                            {drop.word}
                        </div>
                    ))}

                    {/* Input Area */}
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
                        <input
                            autoFocus
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleInput}
                            className="w-64 bg-slate-800/80 border-2 border-slate-600 rounded-full py-3 px-6 text-white text-center text-xl focus:border-teal-500 focus:outline-none backdrop-blur"
                            placeholder="Type translation..."
                        />
                    </div>

                    <style>{`
                  @keyframes fall {
                    from { transform: translateY(0); }
                    to { transform: translateY(110vh); }
                  }
                `}</style>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
                    <h2 className="text-4xl text-white font-bold mb-4">Game Over</h2>
                    <p className="text-2xl text-slate-400 mb-8">Score: {score}</p>
                    <button onClick={() => window.location.reload()} className="bg-teal-500 py-3 px-8 rounded-full text-white font-bold">Play Again</button>
                </div>
            )}
        </div>
    );
}
