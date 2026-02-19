"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useChild } from "@/lib/child-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Child } from "@/types";

export default function ChildSelectionPage() {
  const router = useRouter();
  const { setCurrentChild, currentChild, isHydrated } = useChild();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedForPin, setSelectedForPin] = useState<Child | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    // If a child is already selected, redirect to their game hub
    if (isHydrated && currentChild) {
      router.push("/child/hub");
    }
  }, [currentChild, isHydrated, router]);

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

  const handleChildSelect = (child: Child) => {
    if (child.pin) {
      setSelectedForPin(child);
      setPin("");
      setPinError("");
    } else {
      setCurrentChild(child);
      router.push("/child/hub");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedForPin && pin === selectedForPin.pin) {
      setCurrentChild(selectedForPin);
      router.push("/child/hub");
    } else {
      setPinError("Неправильный PIN-код");
      setPin("");
    }
  };

  const avatarEmojis = ["👦", "👧", "🧒", "👶"];

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen gradient-game flex items-center justify-center">
        <div className="text-6xl animate-bounce-gentle">🎮</div>
      </div>
    );
  }

  // PIN Entry Modal
  if (selectedForPin) {
    return (
      <div className="min-h-screen gradient-game flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Привет, {selectedForPin.name}!
            </h2>
            <p className="text-muted-foreground mb-6">
              Введи свой секретный PIN-код
            </p>
            
            <form onSubmit={handlePinSubmit} className="space-y-4">
              {pinError && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-sm">
                  {pinError}
                </div>
              )}
              
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-3xl tracking-[1em] h-16 rounded-xl"
                autoFocus
              />
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setSelectedForPin(null)}
                >
                  ← Назад
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl"
                  disabled={pin.length !== 4}
                >
                  Войти ✓
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-game p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4 animate-bounce-gentle">🎮</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            Кто играет?
          </h1>
          <p className="text-lg text-muted-foreground">
            Выбери себя, чтобы начать играть!
          </p>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <Card className="rounded-3xl max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="font-display text-xl font-bold mb-2">
                Пока никого нет
              </h3>
              <p className="text-muted-foreground mb-6">
                Попроси родителей добавить тебя!
              </p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push("/login")}
              >
                👨‍👩‍👧 Войти как родитель
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {children.map((child) => {
              const emoji = avatarEmojis[Math.abs(child.name.charCodeAt(0)) % avatarEmojis.length];
              return (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className="group"
                >
                  <Card className="rounded-3xl card-hover overflow-hidden border-4 border-transparent group-hover:border-primary transition-all">
                    <CardContent className="p-8 text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                        {emoji}
                      </div>
                      <h3 className="font-display text-xl font-bold mb-1">
                        {child.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Уровень {child.level}
                      </p>
                      {child.pin && (
                        <div className="mt-2 text-xl">🔒</div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Back to Parent */}
        <div className="text-center mt-12">
          <Button
            variant="ghost"
            className="rounded-xl text-muted-foreground"
            onClick={() => router.push("/login")}
          >
            👨‍👩‍👧 Войти как родитель
          </Button>
        </div>
      </div>
    </div>
  );
}
