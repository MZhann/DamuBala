// api/src/utils/validation.ts
import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  language: z.enum(["kz", "ru"]).optional().default("ru"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Child validation schemas
export const createChildSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().int().min(4, "Age must be at least 4").max(10, "Age must be at most 10"),
  avatar: z.string().optional().default("default-avatar"),
  language: z.enum(["kz", "ru"]).optional().default("ru"),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only digits").optional(),
});

export const updateChildSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  age: z.number().int().min(4, "Age must be at least 4").max(10, "Age must be at most 10").optional(),
  avatar: z.string().optional(),
  language: z.enum(["kz", "ru"]).optional(),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only digits").optional(),
});

// Game session validation schemas
export const saveGameSessionSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  gameKey: z.enum(["memory-match", "pattern-sequence", "math-adventure", "word-builder", "emotion-cards", "puzzle-solve"]),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(0),
  duration: z.number().int().min(0),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),
  correctAnswers: z.number().int().min(0).optional().default(0),
  totalQuestions: z.number().int().min(0).optional().default(0),
  emotionDuringGame: z.string().optional(),
});

// Emotion record validation schemas
export const saveEmotionSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
  emotion: z.enum(["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"]),
  intensity: z.number().min(0).max(100),
  context: z.string().optional(),
  gameSessionId: z.string().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type SaveGameSessionInput = z.infer<typeof saveGameSessionSchema>;
export type SaveEmotionInput = z.infer<typeof saveEmotionSchema>;

