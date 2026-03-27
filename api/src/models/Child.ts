// api/src/models/Child.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChild extends Document {
  _id: Types.ObjectId;
  parentId: Types.ObjectId;
  name: string;
  age: number;
  avatar: string;
  language: "kz" | "ru";
  pin?: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate?: string; // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

const childSchema = new Schema<IChild>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 4,
      max: 10,
    },
    avatar: {
      type: String,
      default: "default-avatar",
    },
    language: {
      type: String,
      enum: ["kz", "ru"],
      default: "ru",
    },
    pin: {
      type: String,
      minlength: 4,
      maxlength: 4,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    lastPlayedDate: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Child = mongoose.model<IChild>("Child", childSchema);

