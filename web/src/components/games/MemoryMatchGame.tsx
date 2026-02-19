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

interface CardItem {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮"];

export default function MemoryMatchGame({ difficulty, onComplete, onExit }: Props) {
  const gridSize = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  const cols = difficulty === "easy" ? 4 : difficulty === "medium" ? 4 : 4;
  
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [isLocked, setIsLocked] = useState(false);

  const initializeGame = useCallback(() => {
    const numPairs = gridSize / 2;
    const selectedEmojis = EMOJIS.slice(0, numPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    
    const shuffled = cardPairs
      .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  }, [gridSize]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleCardClick = (index: number) => {
    if (isLocked || flippedCards.includes(index) || cards[index]?.isMatched) return;

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    ));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      const firstCard = cards[first!];
      const secondCard = cards[second!];

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second ? { ...card, isMatched: true } : card
          ));
          setMatchedPairs(m => m + 1);
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second ? { ...card, isFlipped: false } : card
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    const totalPairs = gridSize / 2;
    if (matchedPairs === totalPairs && matchedPairs > 0) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const maxScore = 100;
      const efficiency = Math.max(0, 1 - (moves - totalPairs) / (totalPairs * 2));
      const score = Math.round(maxScore * efficiency);

      setTimeout(() => {
        onComplete({
          score,
          maxScore,
          correctAnswers: totalPairs,
          totalQuestions: totalPairs,
          duration,
        });
      }, 500);
    }
  }, [matchedPairs, gridSize, moves, startTime, onComplete]);

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
          <span className="text-sm font-medium">🎯 {matchedPairs}/{gridSize / 2}</span>
          <span className="text-sm font-medium">👆 {moves}</span>
        </div>
      </div>

      {/* Game Board */}
      <div 
        className="grid gap-3 max-w-md mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            disabled={card.isMatched || isLocked}
            className={`aspect-square rounded-2xl text-4xl transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? "bg-white shadow-md scale-105"
                : "bg-[#5B9BD5] hover:bg-[#4A8BC5] hover:scale-105"
            } ${card.isMatched ? "opacity-50" : ""}`}
          >
            <span className={`transition-opacity duration-200 ${
              card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0"
            }`}>
              {card.isFlipped || card.isMatched ? card.emoji : ""}
            </span>
            {!card.isFlipped && !card.isMatched && (
              <span className="text-white text-2xl">❓</span>
            )}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Найди все пары! ({matchedPairs}/{gridSize / 2})
        </p>
      </div>
    </div>
  );
}
