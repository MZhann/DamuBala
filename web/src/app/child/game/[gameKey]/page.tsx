"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useChild } from "@/lib/child-context";
import { Mascot } from "@/components/Mascot";
import type { Child, Difficulty } from "@/types";

// Import game components
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import MathAdventureGame from "@/components/games/MathAdventureGame";

export default function GamePage({ params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdFromUrl = searchParams.get("childId");
  const { currentChild, setCurrentChild } = useChild();
  
  const [child, setChild] = useState<Child | null>(currentChild);
  const [isLoading, setIsLoading] = useState(!currentChild);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResult, setGameResult] = useState<{
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!currentChild && childIdFromUrl) {
      loadChild(childIdFromUrl);
    } else if (currentChild) {
      setChild(currentChild);
      setIsLoading(false);
    }
  }, [currentChild, childIdFromUrl]);

  const loadChild = async (id: string) => {
    try {
      const { child } = await api.getChild(id);
      setChild(child);
      setCurrentChild(child);
    } catch {
      router.push("/child");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameComplete = async (result: {
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  }) => {
    setGameResult(result);
    setGameStarted(false);

    if (child) {
      try {
        const response = await api.saveGameSession({
          childId: child.id,
          gameKey: gameKey as "memory-match" | "math-adventure" | "pattern-sequence" | "word-builder" | "emotion-cards" | "puzzle-solve",
          score: result.score,
          maxScore: result.maxScore,
          duration: result.duration,
          difficulty,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions,
        });

        setChild({
          ...child,
          totalPoints: response.newTotalPoints,
          level: response.newLevel,
        });
        setCurrentChild({
          ...child,
          totalPoints: response.newTotalPoints,
          level: response.newLevel,
        });
      } catch (error) {
        console.error("Failed to save game session:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center">
        <Mascot size="lg" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md text-center">
          <Mascot size="md" className="mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-4">Выбери профиль</h2>
          <button onClick={() => router.push("/child")} className="btn-primary">
            Выбрать
          </button>
        </div>
      </div>
    );
  }

  const gameInfo = getGameInfo(gameKey);

  // Game result screen
  if (gameResult) {
    const percentage = Math.round((gameResult.score / gameResult.maxScore) * 100);
    const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

    return (
      <div className="min-h-screen main-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
          <Mascot size="md" className={`mx-auto mb-4 ${stars === 3 ? "animate-bounce-gentle" : ""}`} />
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-2">
            {stars === 3 ? "Отлично!" : stars === 2 ? "Хорошо!" : stars === 1 ? "Неплохо!" : "Попробуй ещё!"}
          </h2>
          
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-4xl transition-all ${i <= stars ? "opacity-100 scale-100" : "opacity-30 scale-75"}`}>
                ⭐
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl font-display font-bold text-[#5B9BD5]">{gameResult.score}</div>
              <div className="text-sm text-gray-500">Очков</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl font-display font-bold text-[#4ECDC4]">{percentage}%</div>
              <div className="text-sm text-gray-500">Результат</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl font-display font-bold text-[#A78BFA]">
                {gameResult.correctAnswers}/{gameResult.totalQuestions}
              </div>
              <div className="text-sm text-gray-500">Правильно</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl font-display font-bold text-[#F5A623]">
                {Math.floor(gameResult.duration / 60)}:{(gameResult.duration % 60).toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-500">Время</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              onClick={() => router.push("/child")}
            >
              🏠 Меню
            </button>
            <button
              className="flex-1 btn-primary py-3"
              onClick={() => {
                setGameResult(null);
                setGameStarted(true);
              }}
            >
              🔄 Ещё раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game started - render the game component
  if (gameStarted) {
    return (
      <div className="min-h-screen main-bg">
        {gameKey === "memory-match" && (
          <MemoryMatchGame
            difficulty={difficulty}
            onComplete={handleGameComplete}
            onExit={() => setGameStarted(false)}
          />
        )}
        {gameKey === "math-adventure" && (
          <MathAdventureGame
            difficulty={difficulty}
            onComplete={handleGameComplete}
            onExit={() => setGameStarted(false)}
          />
        )}
        {!["memory-match", "math-adventure"].includes(gameKey) && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="font-display text-2xl font-bold text-gray-800 mb-4">Скоро!</h2>
              <p className="text-gray-500 mb-6">Эта игра ещё в разработке</p>
              <button onClick={() => setGameStarted(false)} className="btn-primary">
                ← Назад
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Difficulty selection screen
  return (
    <div className="min-h-screen main-bg p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push("/child")}
          className="text-gray-500 hover:text-gray-700 transition-all"
        >
          ← Назад
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span>⭐ {child.totalPoints}</span>
        </div>
      </div>

      {/* Game Info Card */}
      <div className={`bg-gradient-to-br ${gameInfo.gradient} rounded-3xl p-8 text-white text-center mb-8`}>
        <div className="text-6xl mb-4">{gameInfo.emoji}</div>
        <h1 className="font-display text-4xl font-bold mb-2">{gameInfo.name}</h1>
        <p className="opacity-90">{gameInfo.description}</p>
      </div>

      {/* Difficulty Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="font-display text-lg font-bold text-gray-800 mb-4 text-center">
          Выбери сложность
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "easy", label: "Легко", emoji: "🌱" },
            { key: "medium", label: "Средне", emoji: "🌿" },
            { key: "hard", label: "Сложно", emoji: "🌳" },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key as Difficulty)}
              className={`py-4 rounded-xl flex flex-col items-center gap-1 transition-all ${
                difficulty === d.key
                  ? "bg-[#5B9BD5] text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-2xl">{d.emoji}</span>
              <span className="text-sm font-medium">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => setGameStarted(true)}
        className="w-full btn-primary py-4 text-xl font-display font-bold"
      >
        🚀 Начать игру
      </button>
    </div>
  );
}

function getGameInfo(gameKey: string) {
  const games: Record<string, { name: string; emoji: string; description: string; gradient: string }> = {
    "memory-match": { name: "Память", emoji: "🧠", description: "Найди одинаковые пары карточек", gradient: "from-[#FF8FAB] to-[#FF6B8A]" },
    "math-adventure": { name: "Математика", emoji: "🔢", description: "Реши примеры на время", gradient: "from-[#5B9BD5] to-[#4A8BC5]" },
    "pattern-sequence": { name: "Узоры", emoji: "🔷", description: "Продолжи последовательность", gradient: "from-[#4ECDC4] to-[#3DBDB5]" },
    "emotion-cards": { name: "Эмоции", emoji: "😊", description: "Угадай эмоцию по картинке", gradient: "from-[#F5A623] to-[#E09515]" },
    "word-builder": { name: "Слова", emoji: "📝", description: "Собери слово из букв", gradient: "from-[#A78BFA] to-[#9575E5]" },
    "puzzle-solve": { name: "Головоломки", emoji: "🧩", description: "Собери картинку", gradient: "from-[#FF8FAB] to-[#A78BFA]" },
  };
  return games[gameKey] || { name: "Игра", emoji: "🎮", description: "", gradient: "from-gray-400 to-gray-500" };
}
