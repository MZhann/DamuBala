"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Child, AnalyticsSummary, Recommendation, Achievement } from "@/types";

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [child, setChild] = useState<Child | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [childRes, analyticsRes, recsRes, achievementsRes] = await Promise.all([
        api.getChild(id),
        api.getAnalyticsSummary(id, 30).catch(() => null),
        api.getRecommendations(id).catch(() => ({ recommendations: [] })),
        api.getAchievements(id).catch(() => ({ achievements: [] })),
      ]);
      
      setChild(childRes.child);
      setAnalytics(analyticsRes);
      setRecommendations(recsRes.recommendations);
      setAchievements(achievementsRes.achievements);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-4xl animate-bounce-gentle">🌟</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ребенок не найден</p>
        <Link href="/parent/children">
          <Button className="mt-4 rounded-xl">← Назад</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-5xl">
            {child.age <= 5 ? "👶" : child.age <= 7 ? "🧒" : "👦"}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{child.name}</h1>
            <p className="text-muted-foreground">
              {child.age} лет • {child.language === "kz" ? "🇰🇿 Қазақша" : "🇷🇺 Русский"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/parent/children/${id}/ai-friend`}>
            <Button variant="outline" className="rounded-xl">🤖 AI-Друг</Button>
          </Link>
          <Link href={`/parent/children/${id}/edit`}>
            <Button variant="outline" className="rounded-xl">✏️ Редактировать</Button>
          </Link>
          <Link href={`/child?childId=${id}`}>
            <Button className="rounded-xl">🎮 Играть</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="⭐" value={child.totalPoints.toString()} label="Очков" />
        <StatCard icon="🏆" value={`Ур. ${child.level}`} label="Уровень" />
        <StatCard icon="🎮" value={analytics?.overview.totalGamesPlayed.toString() || "0"} label="Игр" />
        <StatCard icon="✅" value={`${analytics?.overview.overallAccuracy || 0}%`} label="Точность" />
      </div>

      {/* Level Progress */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Прогресс уровня {child.level}</span>
            <span className="text-sm text-muted-foreground">
              {child.totalPoints % 100}/100 до следующего
            </span>
          </div>
          <Progress value={child.totalPoints % 100} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommendations */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              💡 Рекомендации AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Пока нет рекомендаций. Играйте больше для получения персонализированных советов!
              </p>
            ) : (
              recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={rec.priority === "high" ? "destructive" : "secondary"}
                      className="rounded-lg text-xs"
                    >
                      {rec.priority === "high" ? "Важно" : rec.priority === "medium" ? "Средне" : "Инфо"}
                    </Badge>
                    <span className="font-medium text-sm">{rec.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              🏆 Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Пока нет достижений. Начните играть!
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="p-3 rounded-xl bg-muted/50 text-center"
                    title={achievement.description}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium truncate">{achievement.name}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Stats */}
      {analytics && analytics.gameStats.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display">📊 Статистика по играм</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {analytics.gameStats.map((stat) => (
                <div key={stat.gameKey} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getGameEmoji(stat.gameKey)}
                    </div>
                    <div>
                      <div className="font-medium">{getGameName(stat.gameKey)}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.totalGames} игр • {Math.floor(stat.totalTime / 60)} мин
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.averageScore}%</div>
                    <div className="text-sm text-muted-foreground">средний балл</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function getGameEmoji(gameKey: string): string {
  const emojis: Record<string, string> = {
    "memory-match": "🧠",
    "pattern-sequence": "🔷",
    "math-adventure": "🔢",
    "word-builder": "📝",
    "emotion-cards": "😊",
    "puzzle-solve": "🧩",
  };
  return emojis[gameKey] || "🎮";
}

function getGameName(gameKey: string): string {
  const names: Record<string, string> = {
    "memory-match": "Память",
    "pattern-sequence": "Узоры",
    "math-adventure": "Математика",
    "word-builder": "Слова",
    "emotion-cards": "Эмоции",
    "puzzle-solve": "Головоломки",
  };
  return names[gameKey] || gameKey;
}

