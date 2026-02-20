import mongoose, { Document, Types } from "mongoose";
export type AchievementKey = "first-game" | "week-streak" | "memory-master" | "math-wizard" | "emotion-expert" | "quick-learner" | "super-player" | "perfect-score" | "level-up";
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
export declare const Achievement: mongoose.Model<IAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IAchievement, {}, mongoose.DefaultSchemaOptions> & IAchievement & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAchievement>;
export declare const ACHIEVEMENT_DEFINITIONS: Record<AchievementKey, Omit<IAchievement, "_id" | "childId" | "unlockedAt" | "createdAt" | keyof Document>>;
