"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-gentle">🌟</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/parent/dashboard" className="flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            <span className="font-display text-2xl font-bold text-primary">DamuBala</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/parent/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Главная
            </Link>
            <Link href="/parent/children" className="text-sm font-medium hover:text-primary transition-colors">
              Дети
            </Link>
            <Link href="/parent/analytics" className="text-sm font-medium hover:text-primary transition-colors">
              Аналитика
            </Link>
            <Link href="/parent/settings" className="text-sm font-medium hover:text-primary transition-colors">
              Настройки
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/child">
              <Button variant="outline" size="sm" className="rounded-xl">
                🎮 Режим ребенка
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "P"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end">
                <div className="px-3 py-2">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  🚪 Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
