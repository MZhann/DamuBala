import mongoose, { Document, Types } from "mongoose";
export type EmotionType = "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted" | "neutral";
export interface IEmotionRecord extends Document {
    _id: Types.ObjectId;
    childId: Types.ObjectId;
    emotion: EmotionType;
    intensity: number;
    context?: string;
    gameSessionId?: Types.ObjectId;
    timestamp: Date;
    createdAt: Date;
}
export declare const EmotionRecord: mongoose.Model<IEmotionRecord, {}, {}, {}, mongoose.Document<unknown, {}, IEmotionRecord, {}, mongoose.DefaultSchemaOptions> & IEmotionRecord & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEmotionRecord>;
