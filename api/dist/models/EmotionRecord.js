// api/src/models/EmotionRecord.ts
import mongoose, { Schema } from "mongoose";
const emotionRecordSchema = new Schema({
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
}, {
    timestamps: true,
});
// Index for analytics queries
emotionRecordSchema.index({ childId: 1, timestamp: -1 });
emotionRecordSchema.index({ childId: 1, emotion: 1 });
export const EmotionRecord = mongoose.model("EmotionRecord", emotionRecordSchema);
//# sourceMappingURL=EmotionRecord.js.map