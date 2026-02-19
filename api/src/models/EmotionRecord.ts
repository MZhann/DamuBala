// api/src/models/EmotionRecord.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type EmotionType = 
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "fearful"
  | "disgusted"
  | "neutral";

export interface IEmotionRecord extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  emotion: EmotionType;
  intensity: number; // 0-100 confidence level
  context?: string;  // e.g., "memory-match", "dashboard", etc.
  gameSessionId?: Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
}

const emotionRecordSchema = new Schema<IEmotionRecord>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    emotion: {
      type: String,
      enum: ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"],
      required: true,
    },
    intensity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    context: {
      type: String,
    },
    gameSessionId: {
      type: Schema.Types.ObjectId,
      ref: "GameSession",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for analytics queries
emotionRecordSchema.index({ childId: 1, timestamp: -1 });
emotionRecordSchema.index({ childId: 1, emotion: 1 });

export const EmotionRecord = mongoose.model<IEmotionRecord>("EmotionRecord", emotionRecordSchema);

