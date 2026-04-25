"use client";

import { useState, useEffect, useCallback } from "react";
import type { Difficulty } from "@/types";

interface Props {
  difficulty: Difficulty;
  onComplete: (result: {
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  }) => void;
  onExit: () => void;
}

interface EmotionQuestion {
  emoji: string;
  name: string;
  description: string;
  options: string[];
  correct: string;
}

const EMOTIONS: EmotionQuestion[] = [
  { emoji: "😊", name: "Радость",     description: "Когда всё хорошо и весело",         options: ["Радость", "Грусть", "Злость", "Страх"],       correct: "Радость" },
  { emoji: "😢", name: "Грусть",      description: "Когда хочется плакать",              options: ["Радость", "Грусть", "Удивление", "Страх"],     correct: "Грусть" },
  { emoji: "😠", name: "Злость",      description: "Когда что-то идёт не так",           options: ["Злость", "Радость", "Грусть", "Усталость"],    correct: "Злость" },
  { emoji: "😨", name: "Страх",       description: "Когда что-то пугает",                options: ["Удивление", "Злость", "Страх", "Радость"],     correct: "Страх" },
  { emoji: "😲", name: "Удивление",   description: "Когда видишь что-то неожиданное",    options: ["Грусть", "Удивление", "Злость", "Радость"],    correct: "Удивление" },
  { emoji: "🤢", name: "Отвращение",  description: "Когда что-то неприятно",             options: ["Отвращение", "Страх", "Грусть", "Злость"],    correct: "Отвращение" },
  { emoji: "😌", name: "Спокойствие", description: "Когда всё тихо и хорошо",            options: ["Радость", "Спокойствие", "Усталость", "Грусть"], correct: "Спокойствие" },
  { emoji: "🤩", name: "Восхищение",  description: "Когда что-то очень крутое",          options: ["Восхищение", "Удивление", "Радость", "Страх"], correct: "Восхищение" },
  { emoji: "😔", name: "Обида",       description: "Когда тебя обидели",                 options: ["Грусть", "Обида", "Злость", "Страх"],          correct: "Обида" },
  { emoji: "😴", name: "Усталость",   description: "Когда хочется спать и нет сил",      options: ["Усталость", "Грусть", "Спокойствие", "Обида"],  correct: "Усталость" },
  { emoji: "🥳", name: "Праздник",    description: "Когда очень радостно и весело!",     options: ["Праздник", "Радость", "Восхищение", "Удивление"], correct: "Праздник" },
  { emoji: "😰", name: "Тревога",     description: "Когда беспокоишься о чём-то",        options: ["Страх", "Тревога", "Злость", "Грусть"],        correct: "Тревога" },
];

// Situational scenarios (medium/hard) - child picks the right emotion
const SCENARIOS: { situation: string; correct: string; options: string[] }[] = [
  { situation: "Твой лучший друг подарил тебе игрушку на день рождения!", correct: "Радость",    options: ["Радость", "Грусть", "Злость", "Страх"] },
  { situation: "Твою любимую игрушку сломали.",                            correct: "Обида",      options: ["Обида", "Радость", "Удивление", "Усталость"] },
  { situation: "Ты заблудился в незнакомом месте.",                        correct: "Страх",      options: ["Страх", "Радость", "Спокойствие", "Удивление"] },
  { situation: "Тебе сказали, что завтра будет праздник!",                 correct: "Восхищение", options: ["Восхищение", "Грусть", "Злость", "Страх"] },
  { situation: "Тебя попросили съесть что-то невкусное.",                  correct: "Отвращение", options: ["Отвращение", "Радость", "Страх", "Грусть"] },
  { situation: "Ты долго играл и теперь очень устал.",                     correct: "Усталость",  options: ["Усталость", "Злость", "Страх", "Радость"] },
  { situation: "Ты увидел огромную радугу в небе!",                        correct: "Удивление",  options: ["Удивление", "Страх", "Грусть", "Злость"] },
  { situation: "Тебя обидели и не хотят играть с тобой.",                 correct: "Грусть",     options: ["Грусть", "Радость", "Усталость", "Страх"] },
];

export default function EmotionCardsGame({ difficulty, onComplete, onExit }: Props) {
  const totalQuestions = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 10;
  const timePerQuestion = difficulty === "easy" ? 20 : difficulty === "medium" ? 15 : 12;

  const [questions, setQuestions] = useState<Array<{ type: "emoji" | "scenario"; question: string; emoji?: string; options: string[]; correct: string }>>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const buildQuestions = useCallback(() => {
    const emojiPool = [...EMOTIONS].sort(() => Math.random() - 0.5);
    const scenarioPool = [...SCENARIOS].sort(() => Math.random() - 0.5);

    const result = [];
    if (difficulty === "easy") {
      for (let i = 0; i < totalQuestions; i++) {
        const e = emojiPool[i % emojiPool.length]!;
        result.push({ type: "emoji" as const, question: e.description, emoji: e.emoji, options: e.options, correct: e.correct });
      }
    } else if (difficulty === "medium") {
      for (let i = 0; i < 4; i++) {
        const e = emojiPool[i % emojiPool.length]!;
        result.push({ type: "emoji" as const, question: e.description, emoji: e.emoji, options: e.options, correct: e.correct });
      }
      for (let i = 0; i < totalQuestions - 4; i++) {
        const s = scenarioPool[i % scenarioPool.length]!;
        result.push({ type: "scenario" as const, question: s.situation, options: s.options, correct: s.correct });
      }
    } else {
      for (let i = 0; i < totalQuestions; i++) {
        const s = scenarioPool[i % scenarioPool.length]!;
        result.push({ type: "scenario" as const, question: s.situation, options: s.options, correct: s.correct });
      }
    }
    return result.sort(() => Math.random() - 0.5).slice(0, totalQuestions);
  }, [difficulty, totalQuestions]);

  useEffect(() => {
    setQuestions(buildQuestions());
  }, [buildQuestions]);

  useEffect(() => {
    if (feedback) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAnswer(null);
          return timePerQuestion;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, current, timePerQuestion]);

  const handleAnswer = (answer: string | null) => {
    if (feedback) return;
    const q = questions[current];
    if (!q) return;
    const isCorrect = answer === q.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    setSelectedAnswer(answer);
    if (isCorrect) {
      setScore((s) => s + 10 + Math.floor(timeLeft * 0.5));
      setCorrectCount((c) => c + 1);
    }
    setTimeout(() => {
      const next = current + 1;
      if (next >= totalQuestions) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onComplete({
          score: score + (isCorrect ? 10 + Math.floor(timeLeft * 0.5) : 0),
          maxScore: totalQuestions * 20,
          correctAnswers: correct + (isCorrect ? 1 : 0),
          totalQuestions,
          duration,
        });
      } else {
        setCurrent(next);
        setTimeLeft(timePerQuestion);
        setFeedback(null);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  const q = questions[current];
  if (!q) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce-gentle">😊</div></div>;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="px-4 py-2 rounded-full text-gray-500 hover:bg-white transition-all">
          ← Выйти
        </button>
        <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">⭐ {score}</span>
          <span className="text-sm font-medium">😊 {current + 1}/{totalQuestions}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#F5A623] to-[#FF8FAB] transition-all"
          style={{ width: `${(current / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Timer */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          timeLeft <= 5 ? "bg-red-100 text-red-500 animate-pulse" : "bg-white shadow-sm"
        }`}>
          ⏱️ {timeLeft}с
        </div>
      </div>

      {/* Question card */}
      <div className={`bg-white rounded-3xl p-8 shadow-lg mb-8 text-center transition-all ${
        feedback === "correct" ? "ring-4 ring-green-400" : feedback === "wrong" ? "ring-4 ring-red-400" : ""
      }`}>
        {q.type === "emoji" ? (
          <>
            <div className="text-8xl mb-4">{q.emoji}</div>
            <p className="text-lg text-gray-600">{q.question}</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">🤔</div>
            <p className="font-display text-lg font-semibold text-gray-800 leading-relaxed">{q.question}</p>
            <p className="text-sm text-gray-500 mt-2">Какую эмоцию чувствует ребёнок?</p>
          </>
        )}
        {feedback && (
          <div className={`mt-4 text-lg font-bold ${feedback === "correct" ? "text-green-600" : "text-red-500"}`}>
            {feedback === "correct" ? "✅ Правильно!" : `❌ Ответ: ${q.correct}`}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            disabled={!!feedback}
            className={`py-5 rounded-2xl font-display font-bold text-lg transition-all ${
              feedback
                ? opt === q.correct
                  ? "bg-green-500 text-white scale-105"
                  : opt === selectedAnswer
                    ? "bg-red-400 text-white"
                    : "bg-gray-100 text-gray-400"
                : "bg-white shadow-sm hover:shadow-md hover:scale-105 text-gray-800"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
