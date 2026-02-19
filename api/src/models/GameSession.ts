// api/src/models/GameSession.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type GameKey = 
  | "memory-match"      // Memory matching game
  | "pattern-sequence"  // Pattern recognition
  | "math-adventure"    // Basic math problems
  | "word-builder"      // Word/letter games
  | "emotion-cards"     // Emotion recognition game
  | "puzzle-solve";     // Puzzle solving

export type Difficulty = "easy" | "medium" | "hard";

export interface IGameSession extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  gameKey: GameKey;
  score: number;
  maxScore: number;
  duration: number; // in seconds
  difficulty: Difficulty;
  correctAnswers: number;
  totalQuestions: number;
  emotionDuringGame?: string; // Captured emotion if available
  completedAt: Date;
  createdAt: Date;
}

const gameSessionSchema = new Schema<IGameSession>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    gameKey: {
      type: String,
      enum: ["memory-match", "pattern-sequence", "math-adventure", "word-builder", "emotion-cards", "puzzle-solve"],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    emotionDuringGame: {
      type: String,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for analytics queries
gameSessionSchema.index({ childId: 1, createdAt: -1 });
gameSessionSchema.index({ childId: 1, gameKey: 1 });

export const GameSession = mongoose.model<IGameSession>("GameSession", gameSessionSchema);

