// api/src/models/AIFriendSettings.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAIFriendSettings extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  enabled: boolean;
  name: string; // Имя AI-друга (например, "Даму", "Бала")
  personality: "friendly" | "playful" | "supportive" | "wise" | "funny"; // Характер
  ageLevel: "same" | "older" | "peer"; // Возрастной уровень общения
  topics: string[]; // Темы, которые можно обсуждать
  restrictions: string[]; // Ограничения (что нельзя обсуждать)
  customInstructions?: string; // Дополнительные инструкции от родителя
  createdAt: Date;
  updatedAt: Date;
}

const aiFriendSettingsSchema = new Schema<IAIFriendSettings>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      default: "Даму",
      trim: true,
    },
    personality: {
      type: String,
      enum: ["friendly", "playful", "supportive", "wise", "funny"],
      default: "friendly",
    },
    ageLevel: {
      type: String,
      enum: ["same", "older", "peer"],
      default: "same",
    },
    topics: {
      type: [String],
      default: ["игры", "учеба", "друзья", "хобби", "эмоции"],
    },
    restrictions: {
      type: [String],
      default: [],
    },
    customInstructions: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const AIFriendSettings = mongoose.model<IAIFriendSettings>("AIFriendSettings", aiFriendSettingsSchema);

