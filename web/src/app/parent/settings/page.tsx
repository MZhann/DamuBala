"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Child } from "@/types";

type DialogMode = "set" | "change" | "remove";

interface PinDialogState {
  child: Child;
  mode: DialogMode;
}

const AVATAR_EMOJIS = ["👦", "👧", "🧒", "👶"];

function avatarFor(name: string) {
  return AVATAR_EMOJIS[Math.abs(name.charCodeAt(0)) % AVATAR_EMOJIS.length];
}

export default function ParentSettingsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState<PinDialogState | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    void loadChildren();
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const { children } = await api.getChildren();
      setChildren(children);
    } catch (err) {
      console.error("Failed to load children:", err);
      setFlash({
        type: "error",
        message: "Не удалось загрузить список детей",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (child: Child, mode: DialogMode) => {
    setDialog({ child, mode });
    setPin("");
    setConfirmPin("");
    setError("");
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialog(null);
    setPin("");
    setConfirmPin("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;

    if (dialog.mode === "remove") {
      await persistPin("");
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN должен содержать ровно 4 цифры");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN-коды не совпадают");
      return;
    }

    await persistPin(pin);
  };

  const persistPin = async (newPin: string) => {
    if (!dialog) return;
    setError("");
    setIsSaving(true);
    try {
      const { child } = await api.updateChild(dialog.child.id, {
        pin: newPin,
      });
      setChildren((prev) =>
        prev.map((c) => (c.id === child.id ? { ...c, ...child } : c)),
      );
      setFlash({
        type: "success",
        message:
          dialog.mode === "remove"
            ? `PIN-код для ${dialog.child.name} удалён`
            : `PIN-код для ${dialog.child.name} обновлён`,
      });
      setDialog(null);
      setPin("");
      setConfirmPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить PIN");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">⚙️ Настройки</h1>
        <p className="text-muted-foreground mt-1">
          Управляйте безопасностью и параметрами профилей ваших детей
        </p>
      </div>

      {flash && (
        <div
          className={
            flash.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl text-sm"
              : "bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm"
          }
          role="status"
        >
          {flash.message}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            🔒 PIN-коды для детей
          </CardTitle>
          <CardDescription>
            PIN-код защищает профиль ребёнка от случайного входа другими детьми.
            Установите 4-значный PIN для каждого профиля.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">👶</div>
              <p className="text-muted-foreground mb-4">
                Сначала добавьте профили детей
              </p>
              <Link href="/parent/children/new">
                <Button className="rounded-xl">➕ Добавить ребёнка</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="flex flex-col gap-3 p-4 rounded-xl bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {avatarFor(child.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold truncate">
                        {child.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={child.hasPin ? "default" : "secondary"}
                          className="rounded-lg text-xs"
                        >
                          {child.hasPin ? "🔒 PIN установлен" : "🔓 Без PIN"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {child.age} лет
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {child.hasPin ? (
                      <>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => openDialog(child, "change")}
                        >
                          ✏️ Изменить
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl text-destructive hover:text-destructive"
                          onClick={() => openDialog(child, "remove")}
                        >
                          🗑️ Удалить
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="rounded-xl"
                        onClick={() => openDialog(child, "set")}
                      >
                        🔒 Установить PIN
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            👤 Аккаунт
          </CardTitle>
          <CardDescription>
            Здесь будут дополнительные настройки аккаунта.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          В данный момент здесь доступно управление PIN-кодами. Скоро появятся
          настройки уведомлений, языка и приватности.
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="rounded-3xl">
          {dialog && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  {dialog.mode === "remove"
                    ? "🗑️ Удалить PIN-код"
                    : dialog.mode === "change"
                      ? "✏️ Изменить PIN-код"
                      : "🔒 Установить PIN-код"}
                </DialogTitle>
                <DialogDescription>
                  {dialog.mode === "remove"
                    ? `Профиль ${dialog.child.name} больше не будет защищён PIN-кодом.`
                    : `4-значный PIN-код для профиля ${dialog.child.name}.`}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {dialog.mode !== "remove" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN-код (4 цифры)</Label>
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="• • • •"
                      value={pin}
                      onChange={(e) =>
                        setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      className="text-center text-2xl tracking-[0.75em] h-14 rounded-xl"
                      autoFocus
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Повторите PIN-код</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="• • • •"
                      value={confirmPin}
                      onChange={(e) =>
                        setConfirmPin(
                          e.target.value.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                      className="text-center text-2xl tracking-[0.75em] h-14 rounded-xl"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={closeDialog}
                  disabled={isSaving}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className={
                    dialog.mode === "remove"
                      ? "rounded-xl bg-destructive hover:bg-destructive/90"
                      : "rounded-xl"
                  }
                  disabled={
                    isSaving ||
                    (dialog.mode !== "remove" &&
                      (pin.length !== 4 || confirmPin.length !== 4))
                  }
                >
                  {isSaving
                    ? "Сохранение..."
                    : dialog.mode === "remove"
                      ? "Удалить PIN"
                      : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
