import mongoose, { Document, Types } from "mongoose";
export type GameKey = "memory-match" | "pattern-sequence" | "math-adventure" | "word-builder" | "emotion-cards" | "puzzle-solve";
export type Difficulty = "easy" | "medium" | "hard";
export interface IGameSession extends Document {
    _id: Types.ObjectId;
    childId: Types.ObjectId;
    gameKey: GameKey;
    score: number;
    maxScore: number;
    duration: number;
    difficulty: Difficulty;
    correctAnswers: number;
    totalQuestions: number;
    emotionDuringGame?: string;
    completedAt: Date;
    createdAt: Date;
}
export declare const GameSession: mongoose.Model<IGameSession, {}, {}, {}, mongoose.Document<unknown, {}, IGameSession, {}, mongoose.DefaultSchemaOptions> & IGameSession & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGameSession>;
