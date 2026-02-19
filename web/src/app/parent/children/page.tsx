"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Child } from "@/types";

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const { children } = await api.getChildren();
      setChildren(children);
    } catch (error) {
      console.error("Failed to load children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const avatarEmojis = ["👦", "👧", "🧒", "👶"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Мои дети</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте профилями ваших детей
          </p>
        </div>
        <Link href="/parent/children/new">
          <Button className="rounded-xl">
            ➕ Добавить ребенка
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : children.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="font-display text-xl font-bold mb-2">
              Добавьте первого ребенка
            </h3>
            <p className="text-muted-foreground mb-6">
              Создайте профиль ребенка, чтобы начать использовать приложение
            </p>
            <Link href="/parent/children/new">
              <Button className="rounded-xl">
                ➕ Добавить ребенка
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => {
            const emoji = avatarEmojis[Math.abs(child.name.charCodeAt(0)) % avatarEmojis.length];
            const levelProgress = child.totalPoints % 100;

            return (
              <Card key={child.id} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl">
                      {emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold">{child.name}</h3>
                      <p className="text-muted-foreground">{child.age} лет</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="rounded-lg">
                          Уровень {child.level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {child.language === "kz" ? "🇰🇿" : "🇷🇺"}
                        </span>
                        {child.pin && (
                          <span className="text-sm">🔒</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Прогресс уровня</span>
                        <span className="font-medium">{child.totalPoints} очков</span>
                      </div>
                      <Progress value={levelProgress} className="h-2" />
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/parent/children/${child.id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl">
                          ✏️ Редактировать
                        </Button>
                      </Link>
                      <Link href={`/parent/analytics?child=${child.id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl">
                          📊 Статистика
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
