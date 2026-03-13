"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AIFriendSettings } from "@/types";

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
  const [aiFriendEnabled, setAiFriendEnabled] = useState(false);

  useEffect(() => {
    if (isHydrated && !currentChild) {
      router.push("/child");
    }
  }, [currentChild, isHydrated, router]);

  useEffect(() => {
    if (currentChild) {
      loadAIFriendStatus();
    }
  }, [currentChild]);

  const loadAIFriendStatus = async () => {
    if (!currentChild) return;
    try {
      const { settings } = await api.getAIFriendSettings(currentChild.id);
      setAiFriendEnabled(settings.enabled);
    } catch {
      // Ignore errors
    }
  };

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
  const levelProgress = currentChild.totalPoints % 100;

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
            </div>
            </div>
          </div>
          
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
        </header>

        {/* Progress */}
        <Card className="rounded-2xl mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">До следующего уровня</span>
              <span className="text-sm font-medium">{levelProgress}/100</span>
            </div>
            <Progress value={levelProgress} className="h-3" />
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
            {games.map((game) => (
              <Link key={game.id} href={`/child/game/${game.id}`}>
                <Card className={`rounded-2xl card-hover cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary transition-all bg-gradient-to-br ${game.color}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3 animate-float" style={{ animationDelay: `${Math.random() * 2}s` }}>
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

        {/* Achievements Preview */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-lg mb-4 text-center">
              🏆 Твои достижения
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <AchievementBadge icon="⭐" name="Первая игра" unlocked={true} />
              <AchievementBadge icon="🔥" name="3 дня подряд" unlocked={false} />
              <AchievementBadge icon="🧠" name="Мастер памяти" unlocked={false} />
              <AchievementBadge icon="🔢" name="Математик" unlocked={false} />
              <AchievementBadge icon="🎯" name="100 очков" unlocked={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AchievementBadge({ icon, name, unlocked }: { icon: string; name: string; unlocked: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
      unlocked 
        ? "bg-primary/10" 
        : "bg-muted/50 opacity-50 grayscale"
    }`}>
      <div className="text-3xl">{icon}</div>
      <span className="text-xs font-medium text-center">{name}</span>
    </div>
  );
}

