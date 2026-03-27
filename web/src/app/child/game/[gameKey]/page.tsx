"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useChild } from "@/lib/child-context";
import { Mascot } from "@/components/Mascot";
import type { Child, Difficulty, Recommendation, AchievementDetail } from "@/types";

// Import game components
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import MathAdventureGame from "@/components/games/MathAdventureGame";
import FruitNinjaNoseGame from "@/components/games/FruitNinjaNoseGame";
import PoseMatchGame from "@/components/games/PoseMatchGame";

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
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newAchievementDetails, setNewAchievementDetails] = useState<AchievementDetail[]>([]);
  const [streakInfo, setStreakInfo] = useState<{ currentStreak: number; bestStreak: number } | null>(null);

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
    setIsLoadingRecommendation(true);
    setRecommendation(null);
    setPointsEarned(0);
    setLeveledUp(false);
    setNewAchievementDetails([]);
    setStreakInfo(null);

    if (child) {
      try {
        const response = await api.saveGameSession({
          childId: child.id,
          gameKey: gameKey as "memory-match" | "math-adventure" | "pattern-sequence" | "word-builder" | "emotion-cards" | "puzzle-solve" | "fruit-ninja-nose" | "pose-match",
          score: result.score,
          maxScore: result.maxScore,
          duration: result.duration,
          difficulty,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions,
        });

        const updatedChild = {
          ...child,
          totalPoints: response.newTotalPoints,
          level: response.newLevel,
          currentStreak: response.streak?.currentStreak ?? (child.currentStreak ?? 0),
          bestStreak: response.streak?.bestStreak ?? (child.bestStreak ?? 0),
        };
        setChild(updatedChild);
        setCurrentChild(updatedChild);

        setPointsEarned(response.pointsEarned ?? 0);
        setLeveledUp(response.leveledUp ?? false);
        setNewAchievementDetails(response.newAchievementDetails ?? []);
        setStreakInfo(response.streak ?? null);

        if (response.recommendation) {
          setRecommendation(response.recommendation);
        }
      } catch (error) {
        console.error("Failed to save game session:", error);
      } finally {
        setIsLoadingRecommendation(false);
      }
    } else {
      setIsLoadingRecommendation(false);
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
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center space-y-5">
          <Mascot size="md" className={`mx-auto ${stars === 3 ? "animate-bounce-gentle" : ""}`} />
          <h2 className="font-display text-3xl font-bold text-gray-800">
            {stars === 3 ? "Отлично!" : stars === 2 ? "Хорошо!" : stars === 1 ? "Неплохо!" : "Попробуй ещё!"}
          </h2>

          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-4xl transition-all ${i <= stars ? "opacity-100 scale-100" : "opacity-30 scale-75"}`}>
                ⭐
              </span>
            ))}
          </div>

          {/* Points Earned Banner */}
          {pointsEarned > 0 && (
            <div className="animate-fade-in bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-3 border border-yellow-200">
              <div className="font-display text-xl font-bold text-amber-700">
                +{pointsEarned} очков! ⭐
              </div>
            </div>
          )}

          {/* Level Up Celebration */}
          {leveledUp && (
            <div className="animate-fade-in bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border border-purple-200">
              <div className="text-3xl mb-1">🚀🎉</div>
              <div className="font-display text-lg font-bold text-purple-700">
                Новый уровень {child?.level}!
              </div>
              <p className="text-xs text-purple-600 mt-1">Поздравляю! Ты становишься лучше!</p>
            </div>
          )}

          {/* New Achievements */}
          {newAchievementDetails.length > 0 && (
            <div className="animate-fade-in space-y-2">
              <div className="text-sm font-display font-bold text-gray-700">Новые достижения!</div>
              <div className="flex justify-center gap-3 flex-wrap">
                {newAchievementDetails.map((ach) => (
                  <div key={ach.key} className="bg-primary/10 rounded-xl p-3 flex flex-col items-center gap-1 min-w-[80px] animate-pop">
                    <div className="text-3xl">{ach.icon}</div>
                    <span className="text-xs font-bold">{ach.name}</span>
                    <span className="text-[10px] text-primary font-bold">+{ach.pointsAwarded}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Streak */}
          {streakInfo && streakInfo.currentStreak > 0 && (
            <div className="animate-fade-in flex items-center justify-center gap-2 text-sm">
              <span className="text-xl">🔥</span>
              <span className="font-medium text-orange-700">
                {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? "день" : streakInfo.currentStreak < 5 ? "дня" : "дней"} подряд!
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3">
              <div className="text-xl font-display font-bold text-[#5B9BD5]">{gameResult.score}</div>
              <div className="text-xs text-gray-500">Счёт</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <div className="text-xl font-display font-bold text-[#4ECDC4]">{percentage}%</div>
              <div className="text-xs text-gray-500">Результат</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <div className="text-xl font-display font-bold text-[#A78BFA]">
                {gameResult.correctAnswers}/{gameResult.totalQuestions}
              </div>
              <div className="text-xs text-gray-500">Правильно</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <div className="text-xl font-display font-bold text-[#F5A623]">
                {Math.floor(gameResult.duration / 60)}:{(gameResult.duration % 60).toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-gray-500">Время</div>
            </div>
          </div>

          {/* AI Recommendation */}
          {isLoadingRecommendation ? (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg animate-pulse">🤖</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">AI анализирует результаты...</p>
                </div>
              </div>
            </div>
          ) : recommendation ? (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🤖</div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-bold text-sm text-gray-800 mb-1">{recommendation.title}</h3>
                  <p className="text-sm text-gray-600">{recommendation.description}</p>
                  {recommendation.actionableSteps && recommendation.actionableSteps.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1 mt-2">
                      {recommendation.actionableSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              onClick={() => {
                setGameResult(null);
                setRecommendation(null);
                router.push("/child");
              }}
            >
              🏠 Меню
            </button>
            <button
              className="flex-1 btn-primary py-3"
              onClick={() => {
                setGameResult(null);
                setRecommendation(null);
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
        {gameKey === "fruit-ninja-nose" && (
          <FruitNinjaNoseGame
            difficulty={difficulty}
            onComplete={handleGameComplete}
            onExit={() => setGameStarted(false)}
          />
        )}
        {gameKey === "pose-match" && (
          <PoseMatchGame
            difficulty={difficulty}
            onComplete={handleGameComplete}
            onExit={() => setGameStarted(false)}
          />
        )}
        {!["memory-match", "math-adventure", "fruit-ninja-nose", "pose-match"].includes(gameKey) && (
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
    "fruit-ninja-nose": { name: "Фруктовый Ниндзя", emoji: "🍎", description: "Разрезай фрукты носом через камеру!", gradient: "from-[#FF4444] to-[#FF8800]" },
    "pose-match": { name: "Повтори Позу", emoji: "🧍", description: "Покажи позу камере!", gradient: "from-[#00BFA5] to-[#4ECDC4]" },
    "emotion-cards": { name: "Эмоции", emoji: "😊", description: "Угадай эмоцию по картинке", gradient: "from-[#F5A623] to-[#E09515]" },
    "word-builder": { name: "Слова", emoji: "📝", description: "Собери слово из букв", gradient: "from-[#A78BFA] to-[#9575E5]" },
    "puzzle-solve": { name: "Головоломки", emoji: "🧩", description: "Собери картинку", gradient: "from-[#FF8FAB] to-[#A78BFA]" },
  };
  return games[gameKey] || { name: "Игра", emoji: "🎮", description: "", gradient: "from-gray-400 to-gray-500" };
}
