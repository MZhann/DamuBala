// api/src/models/GameSession.ts
import mongoose, { Schema } from "mongoose";
const gameSessionSchema = new Schema({
    childId: {
        type: Schema.Types.ObjectId,
        ref: "Child",
        required: true,
        index: true,
    },
    gameKey: {
        type: String,
        enum: ["memory-match", "pattern-sequence", "math-adventure", "word-builder", "emotion-cards", "puzzle-solve"],
        required: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    maxScore: {
        type: Number,
        required: true,
        min: 0,
    },
    duration: {
        type: Number,
        required: true,
        min: 0,
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy",
    },
    correctAnswers: {
        type: Number,
        default: 0,
    },
    totalQuestions: {
        type: Number,
        default: 0,
    },
    emotionDuringGame: {
        type: String,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Index for analytics queries
gameSessionSchema.index({ childId: 1, createdAt: -1 });
gameSessionSchema.index({ childId: 1, gameKey: 1 });
export const GameSession = mongoose.model("GameSession", gameSessionSchema);
//# sourceMappingURL=GameSession.js.map