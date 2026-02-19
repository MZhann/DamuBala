"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz">("ru");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ageNum = parseInt(age);
    if (ageNum < 4 || ageNum > 10) {
      setError("Возраст должен быть от 4 до 10 лет");
      return;
    }

    if (pin && pin.length !== 4) {
      setError("PIN-код должен содержать 4 цифры");
      return;
    }

    setIsLoading(true);

    try {
      await api.createChild({
        name,
        age: ageNum,
        language,
        pin: pin || undefined,
      });
      router.push("/parent/children");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания профиля");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/parent/children" className="text-sm text-muted-foreground hover:text-primary">
          ← Назад к списку детей
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Добавить ребенка</CardTitle>
          <CardDescription>
            Создайте профиль для вашего ребенка
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Имя ребенка</Label>
              <Input
                id="name"
                placeholder="Например: Айдана"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Возраст (4-10 лет)</Label>
              <Input
                id="age"
                type="number"
                min="4"
                max="10"
                placeholder="6"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Язык обучения</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={language === "ru" ? "default" : "outline"}
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setLanguage("ru")}
                >
                  🇷🇺 Русский
                </Button>
                <Button
                  type="button"
                  variant={language === "kz" ? "default" : "outline"}
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setLanguage("kz")}
                >
                  🇰🇿 Қазақша
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN-код (необязательно)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="4 цифры"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="rounded-xl h-12"
              />
              <p className="text-xs text-muted-foreground">
                PIN защитит профиль ребенка от случайного входа других детей
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/parent/children" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-12 rounded-xl">
                  Отмена
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Создание..." : "Создать профиль"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
