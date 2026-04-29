"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getLevelProgress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Achievement, AchievementDefinition } from "@/types";

// Client-side fallback so the hub works even if the API doesn't return allDefinitions yet
const FALLBACK_DEFINITIONS: AchievementDefinition[] = [
  { key: "first-game",    name: "Первые шаги",          description: "Сыграл свою первую игру!",      icon: "🎮", pointsAwarded: 10 },
  { key: "week-streak",   name: "Недельный воин",        description: "Играл 7 дней подряд!",          icon: "🔥", pointsAwarded: 50 },
  { key: "memory-master", name: "Мастер памяти",         description: "Набрал 90%+ в игре на память!", icon: "🧠", pointsAwarded: 30 },
  { key: "math-wizard",   name: "Математический гений",  description: "Набрал 90%+ в математике!",     icon: "🔢", pointsAwarded: 30 },
  { key: "emotion-expert",name: "Эксперт эмоций",        description: "Набрал 90%+ в эмоциях!",       icon: "😊", pointsAwarded: 25 },
  { key: "quick-learner", name: "Быстрый ученик",        description: "Сыграл 10 игр!",                icon: "📚", pointsAwarded: 20 },
  { key: "super-player",  name: "Супер игрок",           description: "Сыграл 50 игр!",                icon: "⭐", pointsAwarded: 100 },
  { key: "perfect-score", name: "Перфекционист",         description: "Набрал 100% в игре!",           icon: "💯", pointsAwarded: 40 },
  { key: "level-up",      name: "Новый уровень!",        description: "Достиг нового уровня!",         icon: "🚀", pointsAwarded: 15 },
];

const games = [
  { id: "memory-match", icon: "🧠", name: "Память", description: "Найди пары", color: "from-pink-500/20 to-purple-500/20" },
  { id: "math-adventure", icon: "🔢", name: "Математика", description: "Реши примеры", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "fruit-ninja-nose", icon: "🍎", name: "Фруктовый Ниндзя", description: "Режь носом! 📸", color: "from-red-500/20 to-orange-500/20" },
  { id: "pose-match", icon: "🧍", name: "Повтори Позу", description: "Покажи позу! 📸", color: "from-teal-500/20 to-emerald-500/20" },
  { id: "emotion-cards", icon: "😊", name: "Эмоции", description: "Угадай эмоцию", color: "from-yellow-500/20 to-orange-500/20" },
  { id: "word-builder", icon: "📝", name: "Слова", description: "Собери слово", color: "from-green-500/20 to-teal-500/20" },
  { id: "pattern-sequence", icon: "🔷", name: "Узоры", description: "Продолжи ряд", color: "from-indigo-500/20 to-violet-500/20" },
  { id: "puzzle-solve", icon: "🧩", name: "Головоломки", description: "Собери картинку", color: "from-red-500/20 to-pink-500/20" },
];

export default function ChildHubPage() {
  const router = useRouter();
  const { currentChild, clearChild, isHydrated } = useChild();
  const { isAuthenticated } = useAuth();
  const [aiFriendEnabled, setAiFriendEnabled] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [allDefinitions, setAllDefinitions] = useState<AchievementDefinition[]>([]);

  useEffect(() => {
    if (isHydrated && !currentChild) {
      router.push("/child");
    }
  }, [currentChild, isHydrated, router]);

  useEffect(() => {
    if (!currentChild) return;
    const loadData = async () => {
      try {
        const { settings } = await api.getAIFriendSettings(currentChild.id);
        setAiFriendEnabled(settings.enabled);
      } catch { /* ignore */ }
      try {
        const res = await api.getAchievements(currentChild.id);
        setUnlockedAchievements(res.achievements || []);
        setAllDefinitions(res.allDefinitions?.length ? res.allDefinitions : FALLBACK_DEFINITIONS);
      } catch { /* ignore */ }
    };
    loadData();
  }, [currentChild]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen gradient-game flex items-center justify-center">
        <div className="text-6xl animate-bounce-gentle">🎮</div>
      </div>
    );
  }

  if (!currentChild) {
    return null;
  }

  const avatarEmojis = ["👦", "👧", "🧒", "👶"];
  const avatarEmoji = avatarEmojis[Math.abs(currentChild.name.charCodeAt(0)) % avatarEmojis.length];
  const { current: lvlCurrent, needed: lvlNeeded, percentage: lvlPercent } = getLevelProgress(currentChild.totalPoints, currentChild.level);
  const streak = currentChild.currentStreak ?? 0;
  const bestStreak = currentChild.bestStreak ?? 0;
  const unlockedKeys = new Set(unlockedAchievements.map((a) => a.key));
  const displayDefinitions = allDefinitions.length > 0 ? allDefinitions : FALLBACK_DEFINITIONS;

  return (
    <div className="min-h-screen gradient-game p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl shadow-lg">
              {avatarEmoji}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Привет, {currentChild.name}! 👋
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="rounded-lg">
                  Уровень {currentChild.level}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ⭐ {currentChild.totalPoints} очков
                </span>
                {streak > 0 && (
                  <span className="text-sm font-medium text-orange-600">
                    🔥 {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  clearChild();
                  router.push("/parent/dashboard");
                }}
              >
                👨‍👩‍👧 К родителю
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                clearChild();
                router.push("/child");
              }}
            >
              👋 Выйти
            </Button>
          </div>
        </header>

        {/* Level Progress */}
        <Card className="rounded-2xl mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                До уровня {currentChild.level + 1}
              </span>
              <span className="text-sm font-medium">{lvlCurrent}/{lvlNeeded}</span>
            </div>
            <Progress value={lvlPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="rounded-2xl mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{streak > 0 ? "🔥" : "❄️"}</div>
                <div>
                  <h3 className="font-display font-bold text-sm">
                    {streak > 0 ? `${streak} ${streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд!` : "Начни серию!"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {streak > 0
                      ? streak >= 7
                        ? "Невероятно! Ты настоящий чемпион! 🏆"
                        : streak >= 3
                          ? "Отличная серия! Продолжай!"
                          : "Хорошее начало! Играй каждый день!"
                      : "Играй каждый день, чтобы начать серию!"
                    }
                  </p>
                </div>
              </div>
              {bestStreak > 0 && (
                <div className="text-center">
                  <div className="text-sm font-display font-bold text-orange-600">
                    {bestStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">рекорд</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Friend Card */}
        {aiFriendEnabled && (
          <div className="mb-8">
            <Link href="/child/ai-friend">
              <Card className="rounded-2xl card-hover cursor-pointer overflow-hidden border-2 border-primary/30 hover:border-primary transition-all bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl mb-3 animate-float">🤖</div>
                  <h3 className="font-display font-bold text-lg">Мой AI-Друг</h3>
                  <p className="text-sm text-muted-foreground">Поговори со мной!</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Games Grid */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            🎮 Выбери игру!
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {games.map((game, idx) => (
              <Link key={game.id} href={`/child/game/${game.id}`}>
                <Card className={`rounded-2xl card-hover cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-gradient-to-br ${game.color}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3 animate-float" style={{ animationDelay: `${idx * 0.25}s` }}>
                      {game.icon}
                    </div>
                    <h3 className="font-display font-bold text-lg">{game.name}</h3>
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">
                🏆 Твои достижения
              </h3>
              <span className="text-sm text-muted-foreground">
                {unlockedAchievements.length}/{displayDefinitions.length}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {displayDefinitions.map((def) => {
                const unlocked = unlockedKeys.has(def.key);
                return (
                  <div
                    key={def.key}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                      unlocked
                        ? "bg-primary/10 shadow-sm"
                        : "bg-muted/50 opacity-40 grayscale"
                    }`}
                    title={def.description}
                  >
                    <div className={`text-3xl ${unlocked ? "animate-pop" : ""}`}>{def.icon}</div>
                    <span className="text-xs font-medium text-center leading-tight">{def.name}</span>
                    {unlocked && (
                      <span className="text-[10px] text-primary font-bold">+{def.pointsAwarded}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {unlockedAchievements.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Играй, чтобы получить свои первые достижения! 🌟
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
