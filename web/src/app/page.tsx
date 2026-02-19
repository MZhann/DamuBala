"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/parent/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-fun">
        <div className="text-4xl animate-bounce-gentle">🎈</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-fun">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌟</span>
            <h1 className="font-display text-3xl font-bold text-primary">DamuBala</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="rounded-xl px-6 font-semibold">
                Войти
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl px-6 font-semibold">
                Начать
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row items-center gap-12 py-12">
          {/* Left Side - Text */}
          <div className="flex-1 space-y-6">
            <h2 className="font-display text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Развитие вашего
              <span className="text-primary"> ребенка </span>
              с помощью AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg">
              Интерактивные игры для развития когнитивных, эмоциональных и социальных 
              навыков детей от 4 до 10 лет. Адаптивный AI подстраивается под каждого ребенка.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="btn-kid bg-primary text-primary-foreground">
                  🚀 Начать бесплатно
                </Button>
              </Link>
              <Link href="/child">
                <Button size="lg" variant="outline" className="btn-kid border-2">
                  🎮 Режим ребенка
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="flex-1 grid grid-cols-2 gap-4 max-w-md">
            <FeatureCard emoji="🧠" title="Память" description="Тренируйте память с увлекательными играми" />
            <FeatureCard emoji="😊" title="Эмоции" description="Распознавание и понимание эмоций" />
            <FeatureCard emoji="🔢" title="Логика" description="Математика и логическое мышление" />
            <FeatureCard emoji="🏆" title="Награды" description="Очки, значки и уровни" />
          </div>
        </main>

        {/* Stats Section */}
        <section className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard number="6+" label="Мини-игр" />
            <StatCard number="AI" label="Адаптация" />
            <StatCard number="2" label="Языка (KZ/RU)" />
            <StatCard number="∞" label="Веселья" />
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <h3 className="font-display text-3xl font-bold text-center mb-12">
            Как это работает?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              step="1" 
              emoji="👤" 
              title="Создайте профиль" 
              description="Зарегистрируйтесь и добавьте профиль вашего ребенка"
            />
            <StepCard 
              step="2" 
              emoji="🎮" 
              title="Играйте вместе" 
              description="Ребенок выбирает игры, AI адаптирует сложность"
            />
            <StepCard 
              step="3" 
              emoji="📊" 
              title="Следите за прогрессом" 
              description="Получайте рекомендации и отчеты о развитии"
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 DamuBala. Дипломный проект.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg card-hover">
      <div className="text-4xl mb-3">{emoji}</div>
      <h4 className="font-display font-bold text-lg mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 text-center shadow-md">
      <div className="font-display text-4xl font-bold text-primary">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

function StepCard({ step, emoji, title, description }: { step: string; emoji: string; title: string; description: string }) {
  return (
    <div className="bg-card rounded-2xl p-8 text-center shadow-lg card-hover">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl mb-4">
        {step}
      </div>
      <div className="text-5xl mb-4">{emoji}</div>
      <h4 className="font-display font-bold text-xl mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
