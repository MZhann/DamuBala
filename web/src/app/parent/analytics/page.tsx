"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  Child,
  AnalyticsSummary,
  Recommendation,
  WeeklyReportResponse,
  ChatAnalytics,
  GameStats,
} from "@/types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7 дней", value: 7 },
  { label: "14 дней", value: 14 },
  { label: "30 дней", value: 30 },
];

const GAME_NAMES: Record<string, string> = {
  "memory-match": "Память",
  "pattern-sequence": "Узоры",
  "math-adventure": "Математика",
  "word-builder": "Слова",
  "emotion-cards": "Эмоции",
  "puzzle-solve": "Головоломки",
  "fruit-ninja-nose": "Фрукт Ниндзя",
  "pose-match": "Повтори Позу",
};

const GAME_EMOJIS: Record<string, string> = {
  "memory-match": "🧠",
  "pattern-sequence": "🔷",
  "math-adventure": "🔢",
  "word-builder": "📝",
  "emotion-cards": "😊",
  "puzzle-solve": "🧩",
  "fruit-ninja-nose": "🍎",
  "pose-match": "🤸",
};

const EMOTION_NAMES: Record<string, string> = {
  happy: "Радость",
  sad: "Грусть",
  angry: "Злость",
  surprised: "Удивление",
  fearful: "Страх",
  disgusted: "Отвращение",
  neutral: "Спокойствие",
};

const EMOTION_COLORS: Record<string, string> = {
  happy: "#4ade80",
  sad: "#60a5fa",
  angry: "#f87171",
  surprised: "#fbbf24",
  fearful: "#a78bfa",
  disgusted: "#fb923c",
  neutral: "#94a3b8",
};

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AnalyticsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [period, setPeriod] = useState(7);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportResponse | null>(null);
  const [chatStats, setChatStats] = useState<ChatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "games" | "emotions" | "chat" | "report">("overview");

  useEffect(() => {
    loadChildren();
  }, []);

  const loadData = useCallback(async (childId: string, days: number) => {
    try {
      const data = await api.getAnalyticsSummary(childId, days);
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }

    try {
      const stats = await api.getChatAnalytics(childId, days);
      setChatStats(stats);
    } catch (error) {
      console.error("Failed to load chat stats:", error);
      setChatStats(null);
    }
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadData(selectedChild.id, period);
    }
  }, [selectedChild, period, loadData]);

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

  const loadRecommendations = async (childId: string) => {
    setIsLoadingRecommendations(true);
    try {
      const { recommendations } = await api.getRecommendations(childId);
      setRecommendations(recommendations);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const loadWeeklyReport = async (childId: string) => {
    setIsLoadingReport(true);
    try {
      const report = await api.getWeeklyReport(childId);
      setWeeklyReport(report);
    } catch (error) {
      console.error("Failed to load weekly report:", error);
      setWeeklyReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedChild && activeTab === "report") {
      loadWeeklyReport(selectedChild.id);
    }
    if (selectedChild && activeTab === "overview") {
      loadRecommendations(selectedChild.id);
    }
  }, [selectedChild, activeTab]);

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

  const totalMinutes = Math.floor((analytics?.overview?.totalTimePlayed || 0) / 60);
  const dailyActivityData = (analytics?.dailyActivity || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    games: d.gamesPlayed,
    minutes: Math.round(d.totalDuration / 60),
  }));

  const gamePerformanceData = (analytics?.gameStats || []).map((g: GameStats) => ({
    name: GAME_NAMES[g.gameKey] || g.gameKey,
    emoji: GAME_EMOJIS[g.gameKey] || "🎮",
    accuracy: g.averageAccuracy,
    score: g.averageScore,
    games: g.totalGames,
    time: Math.round(g.totalTime / 60),
  }));

  const emotionPieData = (analytics?.emotionStats || []).map((e) => ({
    name: EMOTION_NAMES[e.emotion] || e.emotion,
    value: e.count,
    color: EMOTION_COLORS[e.emotion] || "#94a3b8",
  }));

  const tabs = [
    { key: "overview" as const, label: "Обзор", icon: "📊" },
    { key: "games" as const, label: "Игры", icon: "🎮" },
    { key: "emotions" as const, label: "Эмоции", icon: "😊" },
    { key: "chat" as const, label: "AI-друг", icon: "🤖" },
    { key: "report" as const, label: "Отчёт", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground mt-1">
          Детальная статистика, графики и AI-отчёты
        </p>
      </div>

      {/* Child Selector + Period */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map((child) => {
            const emoji = avatarEmojis[Math.abs(child.name.charCodeAt(0)) % avatarEmojis.length];
            const isSelected = selectedChild?.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-card hover:bg-muted"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="font-medium text-sm">{child.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === opt.value
                  ? "bg-white shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selectedChild && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ============ OVERVIEW TAB ============ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="⭐" value={analytics?.overview?.totalPoints?.toString() || selectedChild.totalPoints.toString()} label="Всего очков" trend={null} />
                <StatCard icon="🎮" value={analytics?.overview?.totalGamesPlayed?.toString() || "0"} label="Игр сыграно" trend={null} />
                <StatCard icon="⏱️" value={`${totalMinutes}м`} label="Время игры" trend={null} />
                <StatCard icon="✅" value={`${analytics?.overview?.overallAccuracy || 0}%`} label="Точность" trend={null} />
              </div>

              {/* Daily Activity Chart */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Ежедневная активность</CardTitle>
                  <CardDescription>Количество игр и время за каждый день</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyActivityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dailyActivityData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                          formatter={(value, name) => [
                            value,
                            name === "games" ? "Игры" : "Минуты",
                          ]}
                        />
                        <Legend formatter={(value) => (value === "games" ? "Игры" : "Минуты")} />
                        <Bar dataKey="games" fill="#22c55e" radius={[6, 6, 0, 0]} name="games" />
                        <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} name="minutes" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Нет данных за выбранный период" />
                  )}
                </CardContent>
              </Card>

              {/* Skills Progress */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Навыки</CardTitle>
                  <CardDescription>Прогресс по разным областям развития</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <SkillBar name="🧠 Память" value={getSkillValue(analytics, "memory")} />
                    <SkillBar name="🔢 Логика" value={getSkillValue(analytics, "math")} />
                    <SkillBar name="😊 Эмоции" value={getSkillValue(analytics, "emotion")} />
                    <SkillBar name="🔷 Узоры" value={getSkillValue(analytics, "pattern")} />
                    <SkillBar name="🍎 Реакция" value={getSkillValue(analytics, "fruit-ninja")} />
                    <SkillBar name="🤸 Координация" value={getSkillValue(analytics, "pose")} />
                  </div>
                </CardContent>
              </Card>

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
                  {isLoadingRecommendations ? (
                    <LoadingSpinner message={`Генерируем рекомендации для ${selectedChild.name}`} />
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Играйте больше, чтобы получить персональные рекомендации от AI!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ GAMES TAB ============ */}
          {activeTab === "games" && (
            <div className="space-y-6">
              {/* Game Performance Bars */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Результаты по играм</CardTitle>
                  <CardDescription>Средний балл и точность в каждой игре</CardDescription>
                </CardHeader>
                <CardContent>
                  {gamePerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={gamePerformanceData} layout="vertical" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                          formatter={(value, name) => [
                            `${value}%`,
                            name === "accuracy" ? "Точность" : "Балл",
                          ]}
                        />
                        <Legend formatter={(value) => (value === "accuracy" ? "Точность" : "Балл")} />
                        <Bar dataKey="score" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="score" />
                        <Bar dataKey="accuracy" fill="#22c55e" radius={[0, 6, 6, 0]} name="accuracy" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Нет данных по играм" />
                  )}
                </CardContent>
              </Card>

              {/* Game Breakdown Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {(analytics?.gameStats || []).map((stat) => (
                  <Card key={stat.gameKey} className="rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                          {GAME_EMOJIS[stat.gameKey] || "🎮"}
                        </div>
                        <div>
                          <h4 className="font-display font-bold">{GAME_NAMES[stat.gameKey] || stat.gameKey}</h4>
                          <p className="text-sm text-muted-foreground">{stat.totalGames} игр</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">{stat.averageScore}%</div>
                          <div className="text-xs text-muted-foreground">Ср. балл</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{stat.averageAccuracy}%</div>
                          <div className="text-xs text-muted-foreground">Точность</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{Math.round(stat.totalTime / 60)}м</div>
                          <div className="text-xs text-muted-foreground">Время</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Точность</span>
                          <span>{stat.averageAccuracy}%</span>
                        </div>
                        <Progress value={stat.averageAccuracy} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {gamePerformanceData.length === 0 && (
                <Card className="rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-3">🎮</div>
                    <p className="text-muted-foreground">Нет данных по играм за выбранный период</p>
                  </CardContent>
                </Card>
              )}

              {/* Time Distribution */}
              {gamePerformanceData.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Распределение времени по играм</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={gamePerformanceData.map((g, i) => ({
                            name: g.name,
                            value: g.time,
                            fill: CHART_COLORS[i % CHART_COLORS.length],
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name} (${value}м)`}
                        >
                          {gamePerformanceData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} мин`, "Время"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ============ EMOTIONS TAB ============ */}
          {activeTab === "emotions" && (
            <div className="space-y-6">
              {/* Emotion Distribution */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Распределение эмоций</CardTitle>
                    <CardDescription>Какие эмоции преобладают</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emotionPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={emotionPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {emotionPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: "12px" }}
                            formatter={(value, _name, props) => [value, (props as { payload?: { name?: string } }).payload?.name || ""]}
                          />
                          <Legend
                            formatter={(_value, entry) => (entry as { payload?: { name?: string } }).payload?.name || _value}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart message="Нет данных об эмоциях" />
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Детали эмоций</CardTitle>
                    <CardDescription>Частота и интенсивность</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(analytics?.emotionStats || []).length > 0 ? (
                      <div className="space-y-3">
                        {(analytics?.emotionStats || []).map((e) => {
                          const total = (analytics?.emotionStats || []).reduce((s, x) => s + x.count, 0);
                          const percentage = total > 0 ? Math.round((e.count / total) * 100) : 0;
                          return (
                            <div key={e.emotion} className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: EMOTION_COLORS[e.emotion] || "#94a3b8" }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">{EMOTION_NAMES[e.emotion] || e.emotion}</span>
                                  <span className="text-muted-foreground">{e.count} раз ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: EMOTION_COLORS[e.emotion] || "#94a3b8",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="text-4xl mb-2">😊</div>
                        <p>Нет данных об эмоциях</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Emotion Summary */}
              {(analytics?.emotionStats || []).length > 0 && (
                <Card className="rounded-2xl bg-gradient-to-r from-pink-50 to-blue-50 border-pink-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">💡</div>
                      <div>
                        <h4 className="font-display font-bold mb-1">Эмоциональный анализ</h4>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const stats = analytics?.emotionStats || [];
                            const positive = stats.filter((e) => ["happy", "surprised"].includes(e.emotion)).reduce((s, e) => s + e.count, 0);
                            const negative = stats.filter((e) => ["sad", "angry", "fearful", "disgusted"].includes(e.emotion)).reduce((s, e) => s + e.count, 0);
                            const total = stats.reduce((s, e) => s + e.count, 0);
                            if (total === 0) return "Нет данных для анализа.";
                            const posRatio = positive / total;
                            if (posRatio > 0.6) return `У ${selectedChild.name} преобладают позитивные эмоции (${Math.round(posRatio * 100)}%). Ребёнок чувствует себя хорошо во время занятий!`;
                            if (negative > positive) return `Замечено повышенное количество негативных эмоций. Попробуйте более простые уровни или поговорите с ребёнком.`;
                            return `Эмоциональное состояние ${selectedChild.name} сбалансировано. Продолжайте в том же духе!`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ============ CHAT TAB ============ */}
          {activeTab === "chat" && (
            <div className="space-y-6">
              {/* Chat Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="💬" value={chatStats?.totalMessages?.toString() || "0"} label="Всего сообщений" trend={null} />
                <StatCard icon="👦" value={chatStats?.childMessages?.toString() || "0"} label="От ребёнка" trend={null} />
                <StatCard icon="🤖" value={chatStats?.aiMessages?.toString() || "0"} label="От AI-друга" trend={null} />
                <StatCard icon="📅" value={chatStats?.activeDays?.toString() || "0"} label="Активных дней" trend={null} />
              </div>

              {/* Chat Activity Chart */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Активность чата</CardTitle>
                  <CardDescription>Сообщения по дням</CardDescription>
                </CardHeader>
                <CardContent>
                  {(chatStats?.dailyChatActivity || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart
                        data={(chatStats?.dailyChatActivity || []).map((d) => ({
                          date: new Date(d.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
                          child: d.childMessages,
                          ai: d.aiMessages,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                          formatter={(value, name) => [
                            value,
                            name === "child" ? "Ребёнок" : "AI-друг",
                          ]}
                        />
                        <Legend formatter={(value) => (value === "child" ? "Ребёнок" : "AI-друг")} />
                        <Area type="monotone" dataKey="child" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="child" />
                        <Area type="monotone" dataKey="ai" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="ai" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Нет данных о чате за выбранный период" />
                  )}
                </CardContent>
              </Card>

              {/* Chat Insight */}
              <Card className="rounded-2xl bg-gradient-to-r from-violet-50 to-green-50 border-violet-200/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🤖</div>
                    <div>
                      <h4 className="font-display font-bold mb-1">Общение с AI-другом</h4>
                      <p className="text-sm text-muted-foreground">
                        {chatStats && chatStats.totalMessages > 0
                          ? `${selectedChild.name} отправил${selectedChild.age <= 7 ? "" : "(а)"} ${chatStats.childMessages} сообщений AI-другу за ${period} дней. Средняя длина сообщения: ${chatStats.avgMessageLength} символов. ${chatStats.activeDays > 3 ? "Ребёнок активно общается!" : "Попробуйте мотивировать ребёнка общаться с AI-другом больше."}`
                          : `${selectedChild.name} пока не общался с AI-другом. Предложите ребёнку попробовать — это отличный способ практиковать общение!`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ REPORT TAB ============ */}
          {activeTab === "report" && (
            <div className="space-y-6">
              {isLoadingReport ? (
                <LoadingSpinner message={`Генерируем недельный отчёт для ${selectedChild.name}`} />
              ) : weeklyReport ? (
                <>
                  {/* Overall Score */}
                  <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display text-2xl font-bold mb-1">
                            Недельный отчёт
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {new Date(weeklyReport.period.startDate).toLocaleDateString("ru-RU")} — {new Date(weeklyReport.period.endDate).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold ${
                            weeklyReport.report.overallScore >= 7
                              ? "bg-green-100 text-green-700"
                              : weeklyReport.report.overallScore >= 4
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}>
                            {weeklyReport.report.overallScore}/10
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Оценка недели</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed">{weeklyReport.report.summary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Highlights */}
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          ✨ Достижения недели
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {weeklyReport.report.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span className="text-sm">{h}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Concerns */}
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          ⚠️ На заметку
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {weeklyReport.report.concerns.length > 0 ? (
                          <div className="space-y-2">
                            {weeklyReport.report.concerns.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50">
                                <span className="text-amber-600 mt-0.5">!</span>
                                <span className="text-sm">{c}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-green-50 text-center">
                            <span className="text-green-600 text-sm">Всё отлично! Нет поводов для беспокойства.</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Learning & Emotional Insights */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          📚 Учебный прогресс
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {weeklyReport.report.learningProgress}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          💖 Эмоциональное состояние
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {weeklyReport.report.emotionalInsight}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat Insight */}
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        🤖 Общение с AI-другом
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {weeklyReport.report.chatInsight}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Parent Tips */}
                  <Card className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        💡 Советы для родителя
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {weeklyReport.report.parentTips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Regenerate */}
                  <div className="text-center">
                    <button
                      onClick={() => loadWeeklyReport(selectedChild.id)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      🔄 Обновить отчёт
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Отчёт сгенерирован: {new Date(weeklyReport.generatedAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </>
              ) : (
                <Card className="rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-3">📋</div>
                    <h3 className="font-display text-lg font-bold mb-2">Не удалось загрузить отчёт</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Попробуйте обновить страницу или подождите
                    </p>
                    <button
                      onClick={() => loadWeeklyReport(selectedChild.id)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
                    >
                      Попробовать снова
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recent Achievements (shown in all tabs at bottom) */}
          {analytics?.recentAchievements?.length ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg">🏆 Последние достижения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {analytics.recentAchievements.map((achievement, i) => (
                    <div key={i} className="flex-shrink-0 p-3 bg-muted/50 rounded-xl text-center min-w-[100px]">
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <div className="text-xs font-medium">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(achievement.unlockedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function getSkillValue(analytics: AnalyticsSummary | null, keyword: string): number {
  if (!analytics?.gameStats) return 0;
  const game = analytics.gameStats.find((g) => g.gameKey.includes(keyword));
  return game ? Math.round(game.averageAccuracy) : 0;
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string; trend: string | null }) {
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <div className="text-4xl mb-3">📈</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl animate-pulse">🤖</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-display font-semibold text-lg text-gray-800">AI анализирует данные...</p>
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      </div>
      <div className="flex gap-1 mt-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="p-4 bg-white/50 rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-display font-bold text-sm flex-1">{rec.title}</h4>
        <span
          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            rec.priority === "high"
              ? "bg-red-100 text-red-700"
              : rec.priority === "medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {rec.priority === "high" ? "Важно" : rec.priority === "medium" ? "Средне" : "Низко"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
      {rec.actionableSteps && rec.actionableSteps.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          {rec.actionableSteps.map((step, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2">
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
          rec.type === "skill" ? "bg-blue-100 text-blue-700" :
          rec.type === "emotional" ? "bg-pink-100 text-pink-700" :
          rec.type === "engagement" ? "bg-green-100 text-green-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {rec.type === "skill" ? "Навыки" :
           rec.type === "emotional" ? "Эмоции" :
           rec.type === "engagement" ? "Вовлеченность" : "Общее"}
        </span>
      </div>
    </div>
  );
}
