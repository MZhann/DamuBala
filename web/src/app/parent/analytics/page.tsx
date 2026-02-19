"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Child, AnalyticsSummary } from "@/types";

export default function AnalyticsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadAnalytics(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const { children } = await api.getChildren();
      setChildren(children);
      if (children.length > 0) {
        setSelectedChild(children[0]);
      }
    } catch (error) {
      console.error("Failed to load children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async (childId: string) => {
    try {
      const data = await api.getAnalyticsSummary(childId);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const avatarEmojis = ["👦", "👧", "🧒", "👶"];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="font-display text-xl font-bold mb-2">
            Нет данных для анализа
          </h3>
          <p className="text-muted-foreground">
            Добавьте ребенка и начните играть, чтобы видеть статистику
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground mt-1">
          Отслеживайте прогресс ваших детей
        </p>
      </div>

      {/* Child Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {children.map((child) => {
          const emoji = avatarEmojis[Math.abs(child.name.charCodeAt(0)) % avatarEmojis.length];
          const isSelected = selectedChild?.id === child.id;
          
          return (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-transparent bg-card hover:bg-muted"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="font-medium">{child.name}</span>
            </button>
          );
        })}
      </div>

      {selectedChild && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon="⭐" 
              value={analytics?.overview?.totalPoints?.toString() || selectedChild.totalPoints.toString()} 
              label="Всего очков" 
            />
            <StatCard 
              icon="🎮" 
              value={analytics?.overview?.totalGamesPlayed?.toString() || "0"} 
              label="Игр сыграно" 
            />
            <StatCard 
              icon="⏱️" 
              value={`${Math.floor((analytics?.overview?.totalTimePlayed || 0) / 60)}м`} 
              label="Время игры" 
            />
            <StatCard 
              icon="🏆" 
              value={analytics?.recentAchievements?.length?.toString() || "0"} 
              label="Достижений" 
            />
          </div>

          {/* AI Recommendations */}
          <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                🤖 AI Рекомендации
              </CardTitle>
              <CardDescription>
                Персональные советы для развития {selectedChild.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Играйте больше, чтобы получить персональные рекомендации!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skills Progress */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display">Навыки</CardTitle>
              <CardDescription>
                Прогресс по разным областям развития
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SkillBar name="🧠 Память" value={getSkillValue(analytics, "memory")} />
                <SkillBar name="🔢 Логика" value={getSkillValue(analytics, "math")} />
                <SkillBar name="😊 Эмоции" value={getSkillValue(analytics, "emotions")} />
                <SkillBar name="🎨 Творчество" value={getSkillValue(analytics, "patterns")} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display">Последняя активность</CardTitle>
              <CardDescription>
                Недавние достижения
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentAchievements?.length ? (
                <div className="space-y-3">
                  {analytics.recentAchievements.map((achievement, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Пока нет активности. Начните играть!
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function getSkillValue(analytics: AnalyticsSummary | null, gameKey: string): number {
  if (!analytics?.gameStats) return 0;
  const game = analytics.gameStats.find((g) => g.gameKey.includes(gameKey));
  return game ? Math.round(game.averageAccuracy) : 0;
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

function SkillBar({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
