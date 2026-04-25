"use client";

import { useState, useEffect, useCallback } from "react";
import type { Difficulty } from "@/types";

interface Props {
  difficulty: Difficulty;
  onComplete: (result: {
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  }) => void;
  onExit: () => void;
}

// Each puzzle is an emoji mosaic:
// We divide it into a grid of cells. Each cell holds an emoji "tile".
// The solution is the ordered list; we shuffle them and player taps a tile then taps target.

interface PuzzleLevel {
  name: string;
  emoji: string; // main emoji of the picture
  grid: string[][]; // rows x cols of emojis making the "picture"
}

// 2x2 puzzles (easy)
const EASY_PUZZLES: PuzzleLevel[] = [
  {
    name: "Домик",
    emoji: "🏠",
    grid: [
      ["🌳", "🌳"],
      ["🏠", "🌸"],
    ],
  },
  {
    name: "Ракета",
    emoji: "🚀",
    grid: [
      ["⭐", "🚀"],
      ["🌙", "☁️"],
    ],
  },
  {
    name: "Торт",
    emoji: "🎂",
    grid: [
      ["🎈", "🎂"],
      ["🎁", "🎉"],
    ],
  },
  {
    name: "Лес",
    emoji: "🌲",
    grid: [
      ["🌲", "🌲"],
      ["🦊", "🐰"],
    ],
  },
];

// 3x3 puzzles (medium)
const MEDIUM_PUZZLES: PuzzleLevel[] = [
  {
    name: "Море",
    emoji: "🌊",
    grid: [
      ["☀️", "☀️", "☁️"],
      ["🌊", "🐬", "🌊"],
      ["🐠", "🌊", "🐙"],
    ],
  },
  {
    name: "Космос",
    emoji: "🚀",
    grid: [
      ["⭐", "🌙", "⭐"],
      ["🌟", "🚀", "🌟"],
      ["🪐", "🌌", "🛸"],
    ],
  },
  {
    name: "Сад",
    emoji: "🌻",
    grid: [
      ["🌸", "🌺", "🌸"],
      ["🦋", "🌻", "🐝"],
      ["🍀", "🌿", "🍀"],
    ],
  },
  {
    name: "Город",
    emoji: "🏙️",
    grid: [
      ["☀️", "☁️", "☀️"],
      ["🏢", "🏰", "🏢"],
      ["🚗", "🚕", "🚙"],
    ],
  },
];

// 4x4 puzzles (hard)
const HARD_PUZZLES: PuzzleLevel[] = [
  {
    name: "Лес",
    emoji: "🌲",
    grid: [
      ["☀️", "☀️", "☁️", "☁️"],
      ["🌲", "🌲", "🌲", "🌲"],
      ["🦊", "🐰", "🐸", "🦉"],
      ["🍄", "🍀", "🌿", "🌸"],
    ],
  },
  {
    name: "Праздник",
    emoji: "🎉",
    grid: [
      ["🎈", "🎈", "🎈", "🎈"],
      ["✨", "🎂", "🎂", "✨"],
      ["🎁", "🎁", "🎉", "🎁"],
      ["🥳", "🎊", "🎊", "🥳"],
    ],
  },
  {
    name: "Пляж",
    emoji: "🏖️",
    grid: [
      ["☀️", "☀️", "☁️", "🌤️"],
      ["🏖️", "🏄", "🏖️", "⛵"],
      ["🌊", "🌊", "🐚", "🌊"],
      ["🐠", "🦀", "🐬", "🐙"],
    ],
  },
];

interface TileState {
  id: number;      // original position (index in flattened grid)
  content: string; // emoji
  currentPos: number; // where it is now in the slots
}

function flatGrid(grid: string[][]): string[] {
  return grid.flat();
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function PuzzleSolveGame({ difficulty, onComplete, onExit }: Props) {
  const totalRounds = difficulty === "easy" ? 3 : difficulty === "medium" ? 3 : 3;
  const puzzlePool = difficulty === "easy" ? EASY_PUZZLES : difficulty === "medium" ? MEDIUM_PUZZLES : HARD_PUZZLES;

  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [selected, setSelected] = useState<number | null>(null); // tileId
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [startTime] = useState(Date.now());
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [previewing, setPreviewing] = useState(true); // show solution briefly

  const puzzles = useCallback(() => {
    return [...puzzlePool].sort(() => Math.random() - 0.5).slice(0, totalRounds);
  }, [puzzlePool, totalRounds]);

  const [selectedPuzzles] = useState(() => puzzles());
  const currentPuzzle = selectedPuzzles[round];
  const gridFlat = currentPuzzle ? flatGrid(currentPuzzle.grid) : [];
  const gridSize = Math.sqrt(gridFlat.length);

  const initTiles = useCallback((flat: string[]) => {
    const shuffledPositions = shuffleArray(flat.map((_, i) => i));
    return flat.map((content, id) => ({
      id,
      content,
      currentPos: shuffledPositions[id]!,
    }));
  }, []);

  useEffect(() => {
    if (!currentPuzzle) return;
    const flat = flatGrid(currentPuzzle.grid);
    setTiles(initTiles(flat));
    setSolved(false);
    setSelected(null);
    setMoves(0);
    setRoundStartTime(Date.now());
    setPreviewing(true);
    // Show preview for 2s
    const t = setTimeout(() => setPreviewing(false), 2000);
    return () => clearTimeout(t);
  }, [round, currentPuzzle, initTiles]);

  const isSolved = useCallback((tls: TileState[]) => {
    return tls.every((t) => t.id === t.currentPos);
  }, []);

  const handleTileClick = (tileId: number) => {
    if (solved || previewing) return;

    if (selected === null) {
      setSelected(tileId);
      return;
    }

    if (selected === tileId) {
      setSelected(null);
      return;
    }

    // Swap positions of selected and tileId
    setTiles((prev) => {
      const next = prev.map((t) => {
        if (t.id === selected) return { ...t, currentPos: prev.find((x) => x.id === tileId)!.currentPos };
        if (t.id === tileId) return { ...t, currentPos: prev.find((x) => x.id === selected)!.currentPos };
        return t;
      });
      setMoves((m) => m + 1);

      if (isSolved(next)) {
        setSolved(true);
        const roundDuration = Math.floor((Date.now() - roundStartTime) / 1000);
        const efficiency = Math.max(0, 1 - (moves / (gridFlat.length * 2)));
        const roundScore = Math.round(50 * efficiency + 10);
        setScore((s) => s + roundScore);
        setCorrectCount((c) => c + 1);

        setTimeout(() => {
          const nextRound = round + 1;
          if (nextRound >= totalRounds) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            onComplete({
              score: score + roundScore,
              maxScore: totalRounds * 60,
              correctAnswers: correctCount + 1,
              totalQuestions: totalRounds,
              duration,
            });
          } else {
            setRound(nextRound);
          }
        }, 1500);
      }

      return next;
    });

    setSelected(null);
  };

  // Build display grid: slot -> tile
  const slotToTile: Record<number, TileState> = {};
  tiles.forEach((t) => {
    slotToTile[t.currentPos] = t;
  });

  if (!currentPuzzle) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl">🧩</div></div>;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="px-4 py-2 rounded-full text-gray-500 hover:bg-white transition-all">
          ← Выйти
        </button>
        <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">⭐ {score}</span>
          <span className="text-sm font-medium">🧩 {round + 1}/{totalRounds}</span>
          <span className="text-sm font-medium">👆 {moves}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FF8FAB] to-[#A78BFA] transition-all"
          style={{ width: `${(round / totalRounds) * 100}%` }}
        />
      </div>

      {/* Puzzle name */}
      <div className="text-center mb-4">
        <h2 className="font-display text-xl font-bold text-gray-700">
          {currentPuzzle.emoji} {currentPuzzle.name}
        </h2>
        {previewing ? (
          <p className="text-sm text-[#A78BFA] font-medium mt-1 animate-pulse">Запомни картинку...</p>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Собери картинку! Нажми на две плитки, чтобы поменять их.</p>
        )}
      </div>

      {/* Preview mode: show solution */}
      {previewing && (
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-1 rounded-2xl overflow-hidden shadow-lg border-4 border-[#A78BFA]"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: gridSize * 64 }}
          >
            {gridFlat.map((cell, i) => (
              <div key={i} className="w-14 h-14 flex items-center justify-center text-3xl bg-white">
                {cell}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Puzzle grid */}
      {!previewing && (
        <div className="flex justify-center">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: gridSize * 64 }}
          >
            {Array.from({ length: gridFlat.length }, (_, slotIdx) => {
              const tile = slotToTile[slotIdx];
              const isSelected = tile && selected === tile.id;
              const isCorrect = tile && tile.id === slotIdx;
              return (
                <button
                  key={slotIdx}
                  onClick={() => tile && handleTileClick(tile.id)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all duration-200 ${
                    solved
                      ? "bg-green-100 scale-100"
                      : isSelected
                        ? "bg-[#A78BFA]/40 ring-2 ring-[#7C3AED] scale-110"
                        : isCorrect
                          ? "bg-green-50 ring-1 ring-green-300"
                          : "bg-white hover:bg-[#A78BFA]/10 hover:scale-105 shadow-sm"
                  }`}
                >
                  {tile?.content}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Solved overlay */}
      {solved && (
        <div className="text-center mt-6 animate-fade-in">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-display text-xl font-bold text-green-600">Отлично собрал!</p>
          <p className="text-sm text-gray-400 mt-1">{moves} ходов</p>
        </div>
      )}
    </div>
  );
}
