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

interface Question {
  num1: number;
  num2: number;
  operator: "+" | "-" | "×";
  answer: number;
  options: number[];
}

export default function MathAdventureGame({ difficulty, onComplete, onExit }: Props) {
  const totalQuestions = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 10;
  const maxNumber = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 50;
  const timePerQuestion = difficulty === "easy" ? 15 : difficulty === "medium" ? 12 : 10;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [startTime] = useState(Date.now());

  const generateQuestion = useCallback((): Question => {
    const operators: Array<"+" | "-" | "×"> = difficulty === "easy" ? ["+", "-"] : ["+", "-", "×"];
    const operator = operators[Math.floor(Math.random() * operators.length)]!;
    
    let num1: number, num2: number, answer: number;

    if (operator === "+") {
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * maxNumber) + 1;
      answer = num1 + num2;
    } else if (operator === "-") {
      num1 = Math.floor(Math.random() * maxNumber) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
    }

    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrongAnswer = answer + offset;
      if (wrongAnswer > 0 && wrongAnswer !== answer) {
        options.add(wrongAnswer);
      }
    }

    return {
      num1,
      num2,
      operator,
      answer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
    };
  }, [difficulty, maxNumber]);

  useEffect(() => {
    setQuestion(generateQuestion());
  }, [generateQuestion]);

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
  }, [feedback, currentQuestion, timePerQuestion]);

  const handleAnswer = (selected: number | null) => {
    if (feedback) return;

    const isCorrect = selected === question?.answer;
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setScore((s) => s + 10 + timeLeft);
      setCorrectAnswers((c) => c + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 >= totalQuestions) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onComplete({
          score: score + (isCorrect ? 10 + timeLeft : 0),
          maxScore: totalQuestions * 25,
          correctAnswers: correctAnswers + (isCorrect ? 1 : 0),
          totalQuestions,
          duration,
        });
      } else {
        setCurrentQuestion((q) => q + 1);
        setQuestion(generateQuestion());
        setTimeLeft(timePerQuestion);
        setFeedback(null);
      }
    }, 1000);
  };

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-gentle">🔢</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onExit}
          className="px-4 py-2 rounded-full text-gray-500 hover:bg-white transition-all"
        >
          ← Выйти
        </button>
        <div className="flex items-center gap-4 bg-white rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">⭐ {score}</span>
          <span className="text-sm font-medium">📝 {currentQuestion + 1}/{totalQuestions}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#5B9BD5] to-[#4ECDC4] transition-all"
          style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
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

      {/* Question */}
      <div className={`bg-white rounded-3xl p-8 shadow-lg mb-8 transition-all ${
        feedback === "correct" ? "ring-4 ring-green-400" : 
        feedback === "wrong" ? "ring-4 ring-red-400" : ""
      }`}>
        <div className="font-display text-5xl md:text-6xl font-bold text-center text-gray-800 mb-4">
          {question.num1} {question.operator} {question.num2} = ?
        </div>
        {feedback && (
          <div className={`text-center text-xl ${feedback === "correct" ? "text-green-500" : "text-red-500"}`}>
            {feedback === "correct" ? "✅ Правильно!" : `❌ Ответ: ${question.answer}`}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={!!feedback}
            className={`py-6 rounded-2xl text-3xl font-display font-bold transition-all ${
              feedback
                ? option === question.answer
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-400"
                : "bg-white shadow-sm hover:shadow-md hover:scale-105 text-gray-800"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Encouragement */}
      <div className="text-center mt-8">
        <p className="text-gray-400">
          {currentQuestion === 0 && "Удачи! 🍀"}
          {currentQuestion > 0 && currentQuestion < totalQuestions - 1 && `Отлично! ${correctAnswers}/${currentQuestion + 1} правильно`}
          {currentQuestion === totalQuestions - 1 && "Последний вопрос! 🎯"}
        </p>
      </div>
    </div>
  );
}
