import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ArrowRight, Trophy, Zap } from 'lucide-react';

// --- Audio Synthesizer ---
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSound = (type: 'start' | 'correct' | 'wrong' | 'complete' | 'gameover') => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  try {
    if (type === 'correct') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'start') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'complete') {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.15);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      });
    } else if (type === 'gameover') {
      [300, 250, 200, 150].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.2 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.25);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.3);
      });
    }
  } catch (e) {
    console.error("Audio play error", e);
  }
};
// --- End Audio Synthesizer ---

type GameState = 'START' | 'MEMORIZE' | 'PLAY' | 'GAME_OVER' | 'LEVEL_COMPLETE' | 'VICTORY';

export default function App() {
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>('START');
  const [gridSize, setGridSize] = useState(3);
  const [markedSquares, setMarkedSquares] = useState<number[]>([]);
  const [clickedSquares, setClickedSquares] = useState<number[]>([]);
  const [wrongSquare, setWrongSquare] = useState<number | null>(null);

  const currentGridSize = Math.min(3 + Math.floor((level - 1) / 4), 10);
  const numMarked = 3 + Math.floor((level - 1) / 2);
  const totalSquares = currentGridSize * currentGridSize;

  const startLevel = useCallback(() => {
    initAudio();
    playSound('start');
    setGridSize(currentGridSize);
    
    const squares = new Set<number>();
    const actualNumMarked = Math.min(numMarked, totalSquares - 1);
    
    while (squares.size < actualNumMarked) {
      squares.add(Math.floor(Math.random() * totalSquares));
    }
    
    setMarkedSquares(Array.from(squares));
    setClickedSquares([]);
    setWrongSquare(null);
    setGameState('MEMORIZE');
  }, [currentGridSize, numMarked, totalSquares]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'MEMORIZE') {
      timer = setTimeout(() => {
        setGameState('PLAY');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [gameState]);

  // Auto-start next level when clicking next level button
  useEffect(() => {
    if (gameState === 'START' && level > 1) {
       startLevel();
    }
  }, [gameState, level, startLevel]);

  const handleSquareClick = (index: number) => {
    if (gameState !== 'PLAY') return;

    initAudio();

    if (markedSquares.includes(index)) {
      if (!clickedSquares.includes(index)) {
        playSound('correct');
        const newClicked = [...clickedSquares, index];
        setClickedSquares(newClicked);
        
        if (newClicked.length === markedSquares.length) {
          if (level >= 32) {
            setTimeout(() => playSound('complete'), 300);
            setGameState('VICTORY');
          } else {
            setTimeout(() => playSound('complete'), 300);
            setGameState('LEVEL_COMPLETE');
          }
        }
      }
    } else {
      playSound('wrong');
      setTimeout(() => playSound('gameover'), 400);
      setWrongSquare(index);
      setGameState('GAME_OVER');
    }
  };

  const handleStartGame = () => {
    initAudio();
    startLevel();
  };

  const nextLevel = () => {
    initAudio();
    setLevel(l => l + 1);
    setGameState('START');
  };

  const restartGame = () => {
    initAudio();
    setLevel(1);
    setGameState('START');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-[800px] h-[800px] bg-indigo-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-8 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-indigo-400 fill-indigo-400/20" />
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-sm">
              Desafío de Memoria
            </h1>
          </div>
          <p className="text-indigo-200/70 font-bold tracking-widest uppercase text-sm md:text-base">
            Nivel {level} <span className="mx-2 opacity-50">•</span> Cuadrícula {currentGridSize}x{currentGridSize}
          </p>
        </motion.div>

        {/* Game Board */}
        <motion.div 
          animate={gameState === 'GAME_OVER' ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } } : {}}
          className="relative w-full max-w-[500px] aspect-square bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-3 md:p-5 shadow-2xl shadow-indigo-900/20 border border-white/10"
        >
          
          <AnimatePresence>
            {gameState === 'START' && level === 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-[2rem]"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartGame}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Play className="w-7 h-7 fill-current" />
                  Iniciar Secuencia
                </motion.button>
              </motion.div>
            )}

            {gameState === 'GAME_OVER' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-[2rem] p-6 text-center border border-red-500/20"
              >
                <h2 className="text-4xl font-black text-red-400 mb-2 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]">¡Sobrecarga!</h2>
                <p className="text-slate-300 mb-8 text-lg">Alcanzaste el nivel <span className="font-bold text-white">{level}</span></p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-xl transition-colors hover:bg-slate-200"
                >
                  <RotateCcw className="w-6 h-6" />
                  Reiniciar Sistema
                </motion.button>
              </motion.div>
            )}

            {gameState === 'LEVEL_COMPLETE' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-[2rem] p-6 text-center border border-emerald-500/20"
              >
                <h2 className="text-4xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">¡Secuencia Correcta!</h2>
                <p className="text-slate-300 mb-8 text-lg">Preparando siguiente fase...</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextLevel}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Siguiente Nivel
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </motion.div>
            )}

            {gameState === 'VICTORY' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-[2rem] p-6 text-center border border-yellow-500/20"
              >
                <Trophy className="w-20 h-20 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-4xl font-black text-yellow-400 mb-2">¡Mente Maestra!</h2>
                <p className="text-slate-300 mb-8 text-lg">Has dominado la matriz por completo.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartGame}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 shadow-lg shadow-yellow-500/25 transition-all"
                >
                  <RotateCcw className="w-6 h-6" />
                  Jugar de nuevo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            className="w-full h-full grid gap-2 md:gap-3"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: totalSquares }).map((_, index) => {
              const isMarked = markedSquares.includes(index);
              const isClicked = clickedSquares.includes(index);
              const isWrong = wrongSquare === index;
              
              let squareClass = "bg-slate-800/50 rounded-xl md:rounded-2xl border border-white/5";
              let animateProps: any = { scale: 1 };
              
              if (gameState === 'MEMORIZE' && isMarked) {
                squareClass = "bg-indigo-500 rounded-xl md:rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.8)] border border-indigo-300/50";
                animateProps = { scale: [1, 1.05, 1], transition: { duration: 0.4, ease: "easeInOut" } };
              } else if (gameState === 'PLAY' || gameState === 'GAME_OVER' || gameState === 'LEVEL_COMPLETE') {
                if (isClicked) {
                  squareClass = "bg-emerald-500 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.6)] border border-emerald-300/50";
                  animateProps = { scale: [0.8, 1.05, 0.95], transition: { duration: 0.3 } };
                } else if (isWrong) {
                  squareClass = "bg-red-500 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.7)] border border-red-300/50";
                  animateProps = { scale: [1, 1.1, 0.95], rotate: [-5, 5, 0], transition: { duration: 0.3 } };
                } else if (gameState === 'GAME_OVER' && isMarked) {
                  squareClass = "bg-indigo-500/30 rounded-xl md:rounded-2xl border border-indigo-500/30";
                } else if (gameState === 'PLAY') {
                  squareClass = "bg-slate-800/50 hover:bg-slate-700/80 cursor-pointer rounded-xl md:rounded-2xl active:scale-95 hover:shadow-lg hover:border-white/10 border border-white/5 transition-colors";
                }
              }

              return (
                <motion.div
                  key={`${level}-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ ...animateProps, scale: animateProps.scale || 1, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: gameState === 'START' ? index * 0.01 : 0,
                    ...animateProps.transition
                  }}
                  className={squareClass}
                  onClick={() => handleSquareClick(index)}
                  whileTap={gameState === 'PLAY' && !isClicked ? { scale: 0.9 } : {}}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Instructions / Status */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {gameState === 'MEMORIZE' && (
              <motion.div
                key="memorize"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-indigo-300 font-bold text-lg md:text-xl tracking-wide"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                MEMORIZA LA SECUENCIA
              </motion.div>
            )}
            {gameState === 'PLAY' && (
              <motion.div
                key="play"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-cyan-300 font-bold text-lg md:text-xl tracking-wide"
              >
                FALTAN {markedSquares.length - clickedSquares.length} CUADRADOS
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
