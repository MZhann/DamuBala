"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Child } from "@/types";

export default function ParentDashboard() {
  const { user } = useAuth();
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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Привет, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Вот что происходит с вашими детьми
          </p>
        </div>
        <Link href="/parent/children/new">
          <Button className="rounded-xl">
            ➕ Добавить ребенка
          </Button>
        </Link>
      </div>

      {/* Children List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded-xl" />
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
              Создайте профиль ребенка, чтобы начать отслеживать его развитие
            </p>
            <Link href="/parent/children/new">
              <Button className="rounded-xl">
                ➕ Добавить ребенка
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon="👶" 
            value={children.length.toString()} 
            label="Детей" 
          />
          <StatCard 
            icon="⭐" 
            value={children.reduce((sum, c) => sum + c.totalPoints, 0).toString()} 
            label="Всего очков" 
          />
          <StatCard 
            icon="🎮" 
            value="6" 
            label="Доступных игр" 
          />
          <StatCard 
            icon="🏆" 
            value="9" 
            label="Достижений" 
          />
        </div>
      )}

      {/* Quick Actions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">Быстрые действия</CardTitle>
          <CardDescription>Что вы хотите сделать?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickAction href="/parent/children" icon="👥" label="Управление детьми" />
            <QuickAction href="/parent/analytics" icon="📊" label="Аналитика" />
            <QuickAction href="/child" icon="🎮" label="Начать игру" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChildCard({ child }: { child: Child }) {
  const levelProgress = (child.totalPoints % 100);
  const avatarEmojis = ["👦", "👧", "🧒", "👶"];
  const avatarEmoji = avatarEmojis[Math.abs(child.name.charCodeAt(0)) % avatarEmojis.length];

  return (
    <Link href={`/parent/children/${child.id}`}>
      <Card className="rounded-2xl card-hover cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                {avatarEmoji}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{child.name}</h3>
                <p className="text-sm text-muted-foreground">{child.age} лет</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-lg">
              Уровень {child.level}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-medium">{child.totalPoints} очков</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {child.language === "kz" ? "🇰🇿 Қазақша" : "🇷🇺 Русский"}
            </span>
            <Button variant="ghost" size="sm" className="rounded-lg">
              Подробнее →
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
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

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href}>
      <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-center cursor-pointer">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-sm font-medium">{label}</div>
      </div>
    </Link>
  );
}
