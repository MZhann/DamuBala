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

interface WordPuzzle {
  word: string;
  hint: string;
  emoji: string;
  letters: string[]; // shuffled letters including distractors
}

const EASY_WORDS: Omit<WordPuzzle, "letters">[] = [
  { word: "КОТ",   hint: "Домашнее животное, которое мяукает",   emoji: "🐱" },
  { word: "ПЁС",   hint: "Домашнее животное, которое лает",       emoji: "🐶" },
  { word: "ДОМ",   hint: "Место, где мы живём",                    emoji: "🏠" },
  { word: "МЯЧ",   hint: "Им играют в футбол",                     emoji: "⚽" },
  { word: "СОК",   hint: "Вкусный напиток из фруктов",             emoji: "🧃" },
  { word: "ЛЕС",   hint: "Там растут деревья",                     emoji: "🌲" },
  { word: "СОН",   hint: "То, что бывает ночью",                   emoji: "😴" },
  { word: "РЫБ",   hint: "Живёт в воде",                           emoji: "🐟" },
  { word: "ЖУК",   hint: "Маленькое насекомое",                    emoji: "🐞" },
  { word: "НОС",   hint: "Часть лица",                             emoji: "👃" },
];

const MEDIUM_WORDS: Omit<WordPuzzle, "letters">[] = [
  { word: "КОШКА",  hint: "Мяукает и ловит мышей",                  emoji: "🐱" },
  { word: "ШКОЛА",  hint: "Место, где учатся дети",                  emoji: "🏫" },
  { word: "КНИГА",  hint: "В ней много интересных историй",          emoji: "📚" },
  { word: "МЯЧИК",  hint: "Круглый, им можно играть",                emoji: "⚽" },
  { word: "ЦВЕТОК", hint: "Растёт в саду, очень красивый",           emoji: "🌸" },
  { word: "ЯБЛОКО", hint: "Круглый фрукт, бывает красным или зелёным", emoji: "🍎" },
  { word: "ПТИЦА",  hint: "Умеет летать и петь",                     emoji: "🐦" },
  { word: "РЫБКА",  hint: "Плавает в аквариуме",                     emoji: "🐠" },
  { word: "ЗАЙКА",  hint: "Прыгает и любит морковку",                emoji: "🐰" },
  { word: "ЛУЖА",   hint: "Бывает после дождя",                      emoji: "💧" },
];

const HARD_WORDS: Omit<WordPuzzle, "letters">[] = [
  { word: "РАДУГА",     hint: "Цветная дуга в небе после дождя",      emoji: "🌈" },
  { word: "СЕРДЦЕ",     hint: "Орган, который качает кровь",           emoji: "❤️" },
  { word: "СОЛНЦЕ",     hint: "Самая яркая звезда нашей системы",      emoji: "☀️" },
  { word: "РАКЕТА",     hint: "Летит в космос",                        emoji: "🚀" },
  { word: "ДЕЛЬФИН",   hint: "Умное морское животное",                emoji: "🐬" },
  { word: "ЧЕРЕПАХА",  hint: "Медленное животное с панцирем",         emoji: "🐢" },
  { word: "ПИРАМИДА",  hint: "Строение в Египте",                     emoji: "🏛️" },
  { word: "КАПУСТА",   hint: "Круглый зелёный овощ",                  emoji: "🥬" },
  { word: "БАБОЧКА",   hint: "Красивое насекомое с крыльями",         emoji: "🦋" },
  { word: "ВОЛШЕБНИК", hint: "Умеет делать фокусы и заклинания",      emoji: "🧙" },
];

const EXTRA_LETTERS = "АЕИОУЫБВГДЖЗКЛМНПРСТФХЦЧШЩ";

function makeLetters(word: string, count: number): string[] {
  const base = word.split("");
  const extra = new Set<string>();
  while (extra.size < count - base.length) {
    extra.add(EXTRA_LETTERS[Math.floor(Math.random() * EXTRA_LETTERS.length)]!);
  }
  return [...base, ...Array.from(extra)].sort(() => Math.random() - 0.5);
}

function buildPuzzle(item: Omit<WordPuzzle, "letters">, extraCount: number): WordPuzzle {
  return { ...item, letters: makeLetters(item.word, item.word.length + extraCount) };
}

export default function WordBuilderGame({ difficulty, onComplete, onExit }: Props) {
  const totalQuestions = difficulty === "easy" ? 5 : difficulty === "medium" ? 7 : 10;
  const extraLetters = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5;
  const timePerWord = difficulty === "easy" ? 30 : difficulty === "medium" ? 25 : 20;

  const wordPool = difficulty === "easy" ? EASY_WORDS : difficulty === "medium" ? MEDIUM_WORDS : HARD_WORDS;

  const [puzzles, setPuzzles] = useState<WordPuzzle[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number[]>([]); // indices into letters[]
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerWord);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [shake, setShake] = useState(false);
  const [startTime] = useState(Date.now());

  const buildPuzzles = useCallback(() => {
    return [...wordPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalQuestions)
      .map((w) => buildPuzzle(w, extraLetters));
  }, [wordPool, totalQuestions, extraLetters]);

  useEffect(() => {
    setPuzzles(buildPuzzles());
  }, [buildPuzzles]);

  useEffect(() => {
    if (feedback) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitWrong();
          return timePerWord;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, current, timePerWord]);

  const puzzle = puzzles[current];
  const currentWord = puzzle?.word ?? "";
  const builtWord = selected.map((i) => puzzle?.letters[i] ?? "").join("");

  const submitWrong = () => {
    if (feedback) return;
    setFeedback("wrong");
    setShake(true);
    setTimeout(() => setShake(false), 600);
    advance(false);
  };

  const handleLetterClick = (idx: number) => {
    if (feedback || selected.includes(idx)) return;
    const next = [...selected, idx];
    setSelected(next);
    const word = next.map((i) => puzzle?.letters[i] ?? "").join("");

    if (word.length === currentWord.length) {
      const isCorrect = word === currentWord;
      setFeedback(isCorrect ? "correct" : "wrong");
      if (!isCorrect) { setShake(true); setTimeout(() => setShake(false), 600); }
      advance(isCorrect);
    }
  };

  const handleRemoveLast = () => {
    if (feedback || selected.length === 0) return;
    setSelected((s) => s.slice(0, -1));
  };

  const advance = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((s) => s + 10 + Math.floor(timeLeft * 0.7));
      setCorrectCount((c) => c + 1);
    }
    setTimeout(() => {
      const next = current + 1;
      if (next >= totalQuestions) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onComplete({
          score: score + (isCorrect ? 10 + Math.floor(timeLeft * 0.7) : 0),
          maxScore: totalQuestions * 30,
          correctAnswers: correctCount + (isCorrect ? 1 : 0),
          totalQuestions,
          duration,
        });
      } else {
        setCurrent(next);
        setSelected([]);
        setTimeLeft(timePerWord);
        setFeedback(null);
      }
    }, 1300);
  };

  if (!puzzle) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce-gentle">📝</div></div>;

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="px-4 py-2 rounded-full text-gray-500 hover:bg-white transition-all">
          ← Выйти
        </button>
        <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">⭐ {score}</span>
          <span className="text-sm font-medium">📝 {current + 1}/{totalQuestions}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#A78BFA] to-[#9575E5] transition-all"
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

      {/* Hint card */}
      <div className={`bg-white rounded-3xl p-6 shadow-lg mb-6 text-center transition-all ${
        feedback === "correct" ? "ring-4 ring-green-400" : feedback === "wrong" ? "ring-4 ring-red-400" : ""
      }`}>
        <div className="text-6xl mb-3">{puzzle.emoji}</div>
        <p className="text-gray-600 text-base">{puzzle.hint}</p>
        {feedback && (
          <div className={`mt-3 text-lg font-bold ${feedback === "correct" ? "text-green-600" : "text-red-500"}`}>
            {feedback === "correct" ? `✅ ${puzzle.word}!` : `❌ Слово: ${puzzle.word}`}
          </div>
        )}
      </div>

      {/* Answer slots */}
      <div className={`flex justify-center gap-2 mb-6 ${shake ? "animate-shake" : ""}`}>
        {currentWord.split("").map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-display font-bold border-2 transition-all ${
              selected[i] !== undefined
                ? feedback === "correct"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : feedback === "wrong"
                    ? "bg-red-100 border-red-400 text-red-700"
                    : "bg-[#A78BFA]/20 border-[#A78BFA] text-[#7C3AED]"
                : "bg-white border-dashed border-gray-300 text-gray-300"
            }`}
          >
            {selected[i] !== undefined ? puzzle.letters[selected[i]!] : "_"}
          </div>
        ))}
      </div>

      {/* Letter tiles */}
      <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto mb-4">
        {puzzle.letters.map((letter, idx) => (
          <button
            key={idx}
            onClick={() => handleLetterClick(idx)}
            disabled={!!feedback || selected.includes(idx)}
            className={`w-12 h-12 rounded-xl text-xl font-display font-bold transition-all ${
              selected.includes(idx)
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white shadow-sm hover:shadow-md hover:scale-110 text-gray-800 hover:bg-[#A78BFA]/20"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Remove last */}
      {selected.length > 0 && !feedback && (
        <div className="text-center">
          <button
            onClick={handleRemoveLast}
            className="px-5 py-2 rounded-full bg-white text-gray-500 shadow-sm hover:bg-gray-50 transition-all text-sm"
          >
            ← Убрать букву
          </button>
        </div>
      )}
    </div>
  );
}
