// api/src/models/AIFriendMessage.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAIFriendMessage extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  role: "child" | "ai"; // Кто отправил сообщение
  content: string;
  timestamp: Date;
  createdAt: Date;
}

const aiFriendMessageSchema = new Schema<IAIFriendMessage>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["child", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of recent messages
aiFriendMessageSchema.index({ childId: 1, timestamp: -1 });

export const AIFriendMessage = mongoose.model<IAIFriendMessage>("AIFriendMessage", aiFriendMessageSchema);

