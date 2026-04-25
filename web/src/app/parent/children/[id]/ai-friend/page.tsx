"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AIFriendSettings, AIFriendPersonality, AIFriendAgeLevel, Child } from "@/types";

export default function AIFriendSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [settings, setSettings] = useState<AIFriendSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newRestriction, setNewRestriction] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [{ child }, { settings }] = await Promise.all([
        api.getChild(id),
        api.getAIFriendSettings(id),
      ]);
      setChild(child);
      setSettings(settings);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const { settings: updated } = await api.updateAIFriendSettings(id, {
        enabled: settings.enabled,
        name: settings.name,
        personality: settings.personality,
        ageLevel: settings.ageLevel,
        topics: settings.topics,
        restrictions: settings.restrictions,
        customInstructions: settings.customInstructions,
      });
      setSettings(updated);
      alert("Настройки сохранены!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Ошибка при сохранении настроек");
    } finally {
      setIsSaving(false);
    }
  };

  const addTopic = () => {
    if (newTopic.trim() && settings) {
      setSettings({
        ...settings,
        topics: [...settings.topics, newTopic.trim()],
      });
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    if (settings) {
      setSettings({
        ...settings,
        topics: settings.topics.filter((t) => t !== topic),
      });
    }
  };

  const addRestriction = () => {
    if (newRestriction.trim() && settings) {
      setSettings({
        ...settings,
        restrictions: [...settings.restrictions, newRestriction.trim()],
      });
      setNewRestriction("");
    }
  };

  const removeRestriction = (restriction: string) => {
    if (settings) {
      setSettings({
        ...settings,
        restrictions: settings.restrictions.filter((r) => r !== restriction),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-muted rounded-xl animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!child || !settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Не удалось загрузить данные</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">AI-Друг для {child.name}</h1>
          <p className="text-muted-foreground mt-1">Настройте виртуального друга для вашего ребенка</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          ← Назад
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Основные настройки</CardTitle>
          <CardDescription>Включите или выключите AI-друга и настройте его имя</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <Label className="text-base font-semibold">AI-Друг включен</Label>
              <p className="text-sm text-muted-foreground">Ребенок сможет общаться с AI-другом</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="friend-name">Имя AI-друга</Label>
            <Input
              id="friend-name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Например: Даму, Бала, Айда"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">Как будет звать AI-друга ваш ребенок</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Характер и стиль общения</CardTitle>
          <CardDescription>Выберите, как AI-друг будет общаться с ребенком</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Характер</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(["friendly", "playful", "supportive", "wise", "funny"] as AIFriendPersonality[]).map((personality) => {
                const labels: Record<AIFriendPersonality, { name: string; emoji: string; desc: string }> = {
                  friendly: { name: "Дружелюбный", emoji: "😊", desc: "Добрый и отзывчивый" },
                  playful: { name: "Игривый", emoji: "🎮", desc: "Веселый и активный" },
                  supportive: { name: "Поддерживающий", emoji: "🤗", desc: "Понимающий и помогающий" },
                  wise: { name: "Мудрый", emoji: "🧙", desc: "Спокойный и рассудительный" },
                  funny: { name: "Смешной", emoji: "😂", desc: "Забавный и веселый" },
                };
                const label = labels[personality];
                return (
                  <button
                    key={personality}
                    onClick={() => setSettings({ ...settings, personality })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      settings.personality === personality
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{label.emoji}</div>
                    <div className="font-semibold text-sm">{label.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Возрастной уровень общения</Label>
            <div className="grid grid-cols-3 gap-3">
              {(["same", "older", "peer"] as AIFriendAgeLevel[]).map((ageLevel) => {
                const labels: Record<AIFriendAgeLevel, { name: string; desc: string }> = {
                  same: { name: "Как ровесник", desc: "Простой язык, на равных" },
                  older: { name: "Как старший друг", desc: "Мудрый, но дружелюбный" },
                  peer: { name: "Как лучший друг", desc: "Очень близко и открыто" },
                };
                const label = labels[ageLevel];
                return (
                  <button
                    key={ageLevel}
                    onClick={() => setSettings({ ...settings, ageLevel })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      settings.ageLevel === ageLevel
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{label.name}</div>
                    <div className="text-xs text-muted-foreground">{label.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Темы для обсуждения</CardTitle>
          <CardDescription>Какие темы AI-друг может обсуждать с ребенком</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Например: спорт, рисование, мультики"
              onKeyPress={(e) => e.key === "Enter" && addTopic()}
            />
            <Button onClick={addTopic}>Добавить</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.topics.map((topic) => (
              <div
                key={topic}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
              >
                <span>{topic}</span>
                <button
                  onClick={() => removeTopic(topic)}
                  className="text-primary hover:text-primary/70 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Ограничения</CardTitle>
          <CardDescription>Темы, которые AI-друг НЕ должен обсуждать</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newRestriction}
              onChange={(e) => setNewRestriction(e.target.value)}
              placeholder="Например: насилие, страшные истории"
              onKeyPress={(e) => e.key === "Enter" && addRestriction()}
            />
            <Button onClick={addRestriction} variant="outline">
              Добавить
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.restrictions.map((restriction) => (
              <div
                key={restriction}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm"
              >
                <span>{restriction}</span>
                <button
                  onClick={() => removeRestriction(restriction)}
                  className="text-red-700 hover:text-red-900 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Дополнительные инструкции</CardTitle>
          <CardDescription>Специальные указания для AI-друга (необязательно)</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={settings.customInstructions || ""}
            onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
            placeholder="Например: Всегда напоминай ребенку о важности сна, или: Помогай с домашним заданием по математике"
            className="w-full min-h-[100px] p-3 border rounded-xl resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {settings.customInstructions?.length || 0}/500 символов
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1" size="lg">
          {isSaving ? "Сохранение..." : "💾 Сохранить настройки"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} size="lg">
          Отмена
        </Button>
      </div>
    </div>
  );
}

