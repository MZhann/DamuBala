// api/src/models/TelegramLink.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITelegramLink extends Document {
  _id: Types.ObjectId;
  telegramChatId: number;
  telegramUsername?: string;
  parentId: Types.ObjectId;
  language: "kz" | "ru";
  linkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const telegramLinkSchema = new Schema<ITelegramLink>(
  {
    telegramChatId: {
      type: Number,
      required: true,
      unique: true,
    },
    telegramUsername: {
      type: String,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    language: {
      type: String,
      enum: ["kz", "ru"],
      default: "ru",
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

telegramLinkSchema.index({ parentId: 1 });

export const TelegramLink = mongoose.model<ITelegramLink>("TelegramLink", telegramLinkSchema);
