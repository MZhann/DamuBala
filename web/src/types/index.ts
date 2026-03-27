// web/src/types/index.ts

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  language: "kz" | "ru";
  role: "parent";
  createdAt?: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
  language: "kz" | "ru";
  pin?: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate?: string | null;
  createdAt?: string;
}

// Auth types
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  language?: "kz" | "ru";
}

export interface LoginInput {
  email: string;
  password: string;
}

// Child types
export interface CreateChildInput {
  name: string;
  age: number;
  avatar?: string;
  language?: "kz" | "ru";
  pin?: string;
}

export interface UpdateChildInput {
  name?: string;
  age?: number;
  avatar?: string;
  language?: "kz" | "ru";
  pin?: string;
}

// Game types
export type GameKey =
  | "memory-match"
  | "pattern-sequence"
  | "math-adventure"
  | "word-builder"
  | "emotion-cards"
  | "puzzle-solve"
  | "fruit-ninja-nose"
  | "pose-match";

export type Difficulty = "easy" | "medium" | "hard";

export interface GameSession {
  id: string;
  gameKey: GameKey;
  score: number;
  maxScore: number;
  duration: number;
  difficulty: Difficulty;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
}

export interface SaveGameSessionInput {
  childId: string;
  gameKey: GameKey;
  score: number;
  maxScore: number;
  duration: number;
  difficulty?: Difficulty;
  correctAnswers?: number;
  totalQuestions?: number;
  emotionDuringGame?: string;
}

export interface AchievementDetail {
  key: string;
  name: string;
  icon: string;
  pointsAwarded: number;
}

export interface GameSessionResponse {
  message: string;
  session: GameSession;
  pointsEarned: number;
  newTotalPoints: number;
  newLevel: number;
  leveledUp: boolean;
  newAchievements: string[];
  newAchievementDetails: AchievementDetail[];
  streak: { currentStreak: number; bestStreak: number };
  recommendation?: Recommendation;
}

// Achievement types
export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  pointsAwarded: number;
  unlockedAt: string;
}

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  pointsAwarded: number;
}

// Emotion types
export type EmotionType =
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "fearful"
  | "disgusted"
  | "neutral";

export interface EmotionRecord {
  id: string;
  emotion: EmotionType;
  intensity: number;
  context?: string;
  timestamp: string;
}

// Analytics types
export interface GameStats {
  gameKey: GameKey;
  totalGames: number;
  averageScore: number;
  averageAccuracy: number;
  totalTime: number;
  bestScore: number;
}

export interface EmotionStats {
  emotion: EmotionType;
  count: number;
  averageIntensity: number;
}

export interface DailyActivity {
  date: string;
  gamesPlayed: number;
  totalDuration: number;
}

export interface AnalyticsSummary {
  child: {
    id: string;
    name: string;
    age: number;
    level: number;
    totalPoints: number;
  };
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalGamesPlayed: number;
    totalTimePlayed: number;
    overallAccuracy: number;
    currentLevel: number;
    totalPoints: number;
  };
  gameStats: GameStats[];
  emotionStats: EmotionStats[];
  dailyActivity: DailyActivity[];
  recentAchievements: {
    key: string;
    name: string;
    icon: string;
    unlockedAt: string;
  }[];
}

export interface Recommendation {
  type: "skill" | "emotional" | "engagement" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionableSteps?: string[];
}

// AI Friend types
export type AIFriendPersonality = "friendly" | "playful" | "supportive" | "wise" | "funny";
export type AIFriendAgeLevel = "same" | "older" | "peer";

export interface AIFriendSettings {
  id: string;
  childId: string;
  enabled: boolean;
  name: string;
  personality: AIFriendPersonality;
  ageLevel: AIFriendAgeLevel;
  topics: string[];
  restrictions: string[];
  customInstructions?: string;
}

export interface AIFriendMessage {
  id: string;
  role: "child" | "ai";
  content: string;
  timestamp: string;
}

export interface UpdateAIFriendSettingsInput {
  enabled?: boolean;
  name?: string;
  personality?: AIFriendPersonality;
  ageLevel?: AIFriendAgeLevel;
  topics?: string[];
  restrictions?: string[];
  customInstructions?: string;
}

export interface SendAIFriendMessageInput {
  message: string;
}

export interface SendAIFriendMessageResponse {
  message: string;
  response: string;
  timestamp: string;
}

// Weekly Report types
export interface WeeklyReport {
  summary: string;
  highlights: string[];
  concerns: string[];
  emotionalInsight: string;
  learningProgress: string;
  chatInsight: string;
  parentTips: string[];
  overallScore: number;
}

export interface WeeklyReportResponse {
  childId: string;
  report: WeeklyReport;
  period: { startDate: string; endDate: string };
  generatedAt: string;
}

// Chat Analytics types
export interface DailyChatActivity {
  date: string;
  childMessages: number;
  aiMessages: number;
}

export interface ChatAnalytics {
  childId: string;
  totalMessages: number;
  childMessages: number;
  aiMessages: number;
  avgMessageLength: number;
  dailyChatActivity: DailyChatActivity[];
  activeDays: number;
}

// API Response types
export interface ApiError {
  error: string;
}

