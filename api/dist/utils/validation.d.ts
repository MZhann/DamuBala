import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        kz: "kz";
        ru: "ru";
    }>>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createChildSchema: z.ZodObject<{
    name: z.ZodString;
    age: z.ZodNumber;
    avatar: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    language: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        kz: "kz";
        ru: "ru";
    }>>>;
    pin: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateChildSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    avatar: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodEnum<{
        kz: "kz";
        ru: "ru";
    }>>;
    pin: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const saveGameSessionSchema: z.ZodObject<{
    childId: z.ZodString;
    gameKey: z.ZodEnum<{
        "memory-match": "memory-match";
        "pattern-sequence": "pattern-sequence";
        "math-adventure": "math-adventure";
        "word-builder": "word-builder";
        "emotion-cards": "emotion-cards";
        "puzzle-solve": "puzzle-solve";
    }>;
    score: z.ZodNumber;
    maxScore: z.ZodNumber;
    duration: z.ZodNumber;
    difficulty: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        easy: "easy";
        medium: "medium";
        hard: "hard";
    }>>>;
    correctAnswers: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    totalQuestions: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    emotionDuringGame: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const saveEmotionSchema: z.ZodObject<{
    childId: z.ZodString;
    emotion: z.ZodEnum<{
        happy: "happy";
        sad: "sad";
        angry: "angry";
        surprised: "surprised";
        fearful: "fearful";
        disgusted: "disgusted";
        neutral: "neutral";
    }>;
    intensity: z.ZodNumber;
    context: z.ZodOptional<z.ZodString>;
    gameSessionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type SaveGameSessionInput = z.infer<typeof saveGameSessionSchema>;
export type SaveEmotionInput = z.infer<typeof saveEmotionSchema>;
