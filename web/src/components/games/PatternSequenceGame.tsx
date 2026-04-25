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

type PatternItem = string; // emoji or shape symbol

interface Pattern {
  sequence: PatternItem[];
  options: PatternItem[];
  correct: PatternItem;
  rule: string;
}

const EMOJI_SETS = [
  ["🌟", "🌙", "☀️", "⭐", "🌈"],
  ["🍎", "🍊", "🍋", "🍇", "🍓"],
  ["🐶", "🐱", "🐭", "🐰", "🐸"],
  ["🔴", "🟡", "🟢", "🔵", "🟣"],
  ["🏠", "🏡", "🏢", "🏰", "🏯"],
  ["🚗", "🚕", "🚙", "🚌", "🚎"],
  ["🌷", "🌹", "🌻", "🌸", "💐"],
  ["🎵", "🎶", "🎸", "🎹", "🎺"],
];

function makeSimplePattern(): Pattern {
  // AB repeating: A B A B A B ?  → answer is A
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]!;
  const a = set[0]!, b = set[1]!;
  const sequence = [a, b, a, b, a, b];
  const correct = a;
  const distractors = set.slice(2, 5);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { sequence, correct, options, rule: "AB" };
}

function makeABCPattern(): Pattern {
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]!;
  const a = set[0]!, b = set[1]!, c = set[2]!;
  const sequence = [a, b, c, a, b, c, a, b];
  const correct = c;
  const distractors = set.slice(3, 6).filter(Boolean);
  while (distractors.length < 3) distractors.push(set[Math.floor(Math.random() * set.length)]!);
  const options = [correct, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
  return { sequence, correct, options, rule: "ABC" };
}

function makeGrowingPattern(): Pattern {
  // sizes: small → big, represented via repeat: ⭐, ⭐⭐, ⭐⭐⭐, ⭐⭐⭐⭐
  // We encode as items in sequence with a "count" encoded as the item itself
  // Let's use numbers: 1, 2, 3, 4, 5 displayed as filled circles
  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
  const sequence = emojis.slice(0, 5);
  const correct = emojis[5]!;
  const distractors = ["7️⃣", "0️⃣", "8️⃣"];
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { sequence, correct, options, rule: "GROW" };
}

function makeColorPattern(): Pattern {
  const colors = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"];
  const a = colors[0]!, b = colors[1]!, c = colors[2]!;
  // AABB pattern: A A B B A A B B A A ?
  const sequence = [a, a, b, b, a, a, b, b, a, a];
  const correct = b;
  const distractors = colors.slice(3, 6);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { sequence, correct, options, rule: "AABB" };
}

function makeHardPattern(): Pattern {
  // Fibonacci-like: A, B, A+B (emoji version with animals count)
  const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]!;
  const a = set[0]!, b = set[1]!, c = set[2]!, d = set[3]!;
  // Pattern: a b c d a b c
  const sequence = [a, b, c, d, a, b, c];
  const correct = d;
  const distractors = set.slice(4).concat(EMOJI_SETS[(Math.floor(Math.random() * EMOJI_SETS.length))]!.slice(0, 2));
  const options = [correct, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
  return { sequence, correct, options, rule: "ABCD" };
}

function generatePattern(difficulty: "easy" | "medium" | "hard"): Pattern {
  if (difficulty === "easy") {
    return Math.random() > 0.5 ? makeSimplePattern() : makeABCPattern();
  } else if (difficulty === "medium") {
    const r = Math.random();
    if (r < 0.33) return makeABCPattern();
    if (r < 0.66) return makeColorPattern();
    return makeGrowingPattern();
  } else {
    const r = Math.random();
    if (r < 0.5) return makeHardPattern();
    return makeColorPattern();
  }
}

export default function PatternSequenceGame({ difficulty, onComplete, onExit }: Props) {
  const totalQuestions = difficulty === "easy" ? 5 : difficulty === "medium" ? 7 : 10;
  const timePerQ = difficulty === "easy" ? 20 : difficulty === "medium" ? 15 : 12;

  const [questions, setQuestions] = useState<Pattern[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const buildQuestions = useCallback(() => {
    return Array.from({ length: totalQuestions }, () => generatePattern(difficulty));
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
          return timePerQ;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, current, timePerQ]);

  const handleAnswer = (answer: string | null) => {
    if (feedback) return;
    const q = questions[current];
    if (!q) return;
    const isCorrect = answer === q.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    setSelectedAnswer(answer);
    if (isCorrect) {
      setScore((s) => s + 10 + timeLeft);
      setCorrectCount((c) => c + 1);
    }
    setTimeout(() => {
      const next = current + 1;
      if (next >= totalQuestions) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onComplete({
          score: score + (isCorrect ? 10 + timeLeft : 0),
          maxScore: totalQuestions * 30,
          correctAnswers: correctCount + (isCorrect ? 1 : 0),
          totalQuestions,
          duration,
        });
      } else {
        setCurrent(next);
        setTimeLeft(timePerQ);
        setFeedback(null);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  const q = questions[current];
  if (!q) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce-gentle">🔷</div></div>;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="px-4 py-2 rounded-full text-gray-500 hover:bg-white transition-all">
          ← Выйти
        </button>
        <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">⭐ {score}</span>
          <span className="text-sm font-medium">🔷 {current + 1}/{totalQuestions}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4ECDC4] to-[#3DBDB5] transition-all"
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

      {/* Instruction */}
      <p className="text-center text-gray-500 mb-4 text-sm">Что идёт дальше?</p>

      {/* Sequence display */}
      <div className={`bg-white rounded-3xl p-6 shadow-lg mb-8 transition-all ${
        feedback === "correct" ? "ring-4 ring-green-400" : feedback === "wrong" ? "ring-4 ring-red-400" : ""
      }`}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {q.sequence.map((item, i) => (
            <div key={i} className="w-12 h-12 rounded-xl bg-[#4ECDC4]/20 flex items-center justify-center text-2xl">
              {item}
            </div>
          ))}
          {/* Question mark tile */}
          <div className="w-12 h-12 rounded-xl bg-[#4ECDC4] flex items-center justify-center text-white text-xl font-bold">
            ?
          </div>
        </div>
        {feedback && (
          <div className={`text-center mt-4 text-lg font-bold ${feedback === "correct" ? "text-green-600" : "text-red-500"}`}>
            {feedback === "correct" ? "✅ Правильно!" : `❌ Ответ: ${q.correct}`}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            disabled={!!feedback}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
              feedback
                ? opt === q.correct
                  ? "bg-green-500 scale-110 shadow-lg"
                  : opt === selectedAnswer
                    ? "bg-red-400"
                    : "bg-gray-100 opacity-50"
                : "bg-white shadow-sm hover:shadow-md hover:scale-110"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
