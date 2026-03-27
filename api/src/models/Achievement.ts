// api/src/models/Achievement.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type AchievementKey =
  | "first-game"        // Completed first game
  | "week-streak"       // Played 7 days in a row
  | "memory-master"     // High score in memory game
  | "math-wizard"       // High score in math game
  | "emotion-expert"    // Recognized all emotions
  | "quick-learner"     // Completed 10 games
  | "super-player"      // Completed 50 games
  | "perfect-score"     // Got 100% in any game
  | "level-up";         // Reached new level

export interface IAchievement extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  key: AchievementKey;
  name: string;
  description: string;
  icon: string;
  pointsAwarded: number;
  unlockedAt: Date;
  createdAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    key: {
      type: String,
      enum: [
        "first-game",
        "week-streak",
        "memory-master",
        "math-wizard",
        "emotion-expert",
        "quick-learner",
        "super-player",
        "perfect-score",
        "level-up",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "🏆",
    },
    pointsAwarded: {
      type: Number,
      default: 10,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a child can only have each achievement once
achievementSchema.index({ childId: 1, key: 1 }, { unique: true });

export const Achievement = mongoose.model<IAchievement>("Achievement", achievementSchema);

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementKey, Omit<IAchievement, "_id" | "childId" | "unlockedAt" | "createdAt" | keyof Document>> = {
  "first-game": {
    key: "first-game",
    name: "Первые шаги",
    description: "Сыграл свою первую игру!",
    icon: "🎮",
    pointsAwarded: 10,
  },
  "week-streak": {
    key: "week-streak",
    name: "Недельный воин",
    description: "Играл 7 дней подряд!",
    icon: "🔥",
    pointsAwarded: 50,
  },
  "memory-master": {
    key: "memory-master",
    name: "Мастер памяти",
    description: "Набрал 90%+ в игре на память!",
    icon: "🧠",
    pointsAwarded: 30,
  },
  "math-wizard": {
    key: "math-wizard",
    name: "Математический гений",
    description: "Набрал 90%+ в математике!",
    icon: "🔢",
    pointsAwarded: 30,
  },
  "emotion-expert": {
    key: "emotion-expert",
    name: "Эксперт эмоций",
    description: "Набрал 90%+ в игре про эмоции!",
    icon: "😊",
    pointsAwarded: 25,
  },
  "quick-learner": {
    key: "quick-learner",
    name: "Быстрый ученик",
    description: "Сыграл 10 игр!",
    icon: "📚",
    pointsAwarded: 20,
  },
  "super-player": {
    key: "super-player",
    name: "Супер игрок",
    description: "Сыграл 50 игр!",
    icon: "⭐",
    pointsAwarded: 100,
  },
  "perfect-score": {
    key: "perfect-score",
    name: "Перфекционист",
    description: "Набрал 100% в игре!",
    icon: "💯",
    pointsAwarded: 40,
  },
  "level-up": {
    key: "level-up",
    name: "Новый уровень!",
    description: "Достиг нового уровня!",
    icon: "🚀",
    pointsAwarded: 15,
  },
};

