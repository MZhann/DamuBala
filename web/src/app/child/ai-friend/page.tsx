"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useChild } from "@/lib/child-context";
import { Mascot } from "@/components/Mascot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Child, AIFriendMessage, AIFriendSettings } from "@/types";

function AIFriendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdFromUrl = searchParams.get("childId");
  const { currentChild, setCurrentChild } = useChild();

  const [child, setChild] = useState<Child | null>(currentChild);
  const [settings, setSettings] = useState<AIFriendSettings | null>(null);
  const [messages, setMessages] = useState<AIFriendMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentChild && childIdFromUrl) {
      loadChild(childIdFromUrl);
    } else if (currentChild) {
      setChild(currentChild);
      setIsLoading(false);
    }
  }, [currentChild, childIdFromUrl]);

  useEffect(() => {
    if (child) {
      loadSettingsAndHistory();
    }
  }, [child]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChild = async (id: string) => {
    try {
      const { child } = await api.getChild(id);
      setChild(child);
      setCurrentChild(child);
    } catch {
      router.push("/child");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettingsAndHistory = async () => {
    if (!child) return;
    try {
      const [{ settings }, { messages: history }] = await Promise.all([
        api.getAIFriendSettings(child.id),
        api.getAIFriendChatHistory(child.id, { limit: 50 }),
      ]);

      if (!settings.enabled) {
        alert("AI-Друг отключен родителем. Обратитесь к родителям, чтобы включить его.");
        router.push("/child");
        return;
      }

      setSettings(settings);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load AI friend data:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!child || !settings || !inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Add user message immediately
    const tempUserMessage: AIFriendMessage = {
      id: `temp-${Date.now()}`,
      role: "child",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { response } = await api.sendAIFriendMessage(child.id, {
        message: userMessage,
      });

      // Add AI response
      const aiMessage: AIFriendMessage = {
        id: `temp-ai-${Date.now()}`,
        role: "ai",
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Reload history to get real IDs
      const { messages: updatedHistory } = await api.getAIFriendChatHistory(child.id, { limit: 50 });
      setMessages(updatedHistory);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp")));
      alert("Не удалось отправить сообщение. Попробуй еще раз.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center">
        <Mascot size="lg" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md text-center">
          <Mascot size="md" className="mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-4">Выбери профиль</h2>
          <button onClick={() => router.push("/child")} className="btn-primary">
            Выбрать
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-4">AI-Друг недоступен</h2>
          <p className="text-gray-500 mb-6">Обратись к родителям, чтобы включить AI-друга</p>
          <button onClick={() => router.push("/child")} className="btn-primary">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen main-bg flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/child")}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h1 className="font-display text-xl font-bold">{settings.name}</h1>
                <p className="text-xs text-gray-500">AI-Друг</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
                Привет, {child.name}!
              </h2>
              <p className="text-gray-500">
                Я {settings.name}, твой AI-друг! Напиши мне что-нибудь, и я отвечу!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "child" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.role === "child"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "child" ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={`Напиши ${settings.name}...`}
            disabled={isSending}
            className="rounded-full"
            maxLength={2000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="rounded-full px-6"
          >
            {isSending ? "..." : "➤"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AIFriendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen main-bg flex items-center justify-center">
          <Mascot size="lg" />
        </div>
      }
    >
      <AIFriendContent />
    </Suspense>
  );
}

