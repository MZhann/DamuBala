// api/src/models/Achievement.ts
import mongoose, { Schema } from "mongoose";
const achievementSchema = new Schema({
    childId: {
        type: Schema.Types.ObjectId,
        ref: "Child",
        required: true,
        index: true,
    },
    key: {
        type: String,
        enum: [
            "first-game",
            "week-streak",
            "memory-master",
            "math-wizard",
            "emotion-expert",
            "quick-learner",
            "super-player",
            "perfect-score",
            "level-up",
        ],
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: "🏆",
    },
    pointsAwarded: {
        type: Number,
        default: 10,
    },
    unlockedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Ensure a child can only have each achievement once
achievementSchema.index({ childId: 1, key: 1 }, { unique: true });
export const Achievement = mongoose.model("Achievement", achievementSchema);
// Achievement definitions for awarding
export const ACHIEVEMENT_DEFINITIONS = {
    "first-game": {
        key: "first-game",
        name: "First Steps",
        description: "Completed your first game!",
        icon: "🎮",
        pointsAwarded: 10,
    },
    "week-streak": {
        key: "week-streak",
        name: "Week Warrior",
        description: "Played for 7 days in a row!",
        icon: "🔥",
        pointsAwarded: 50,
    },
    "memory-master": {
        key: "memory-master",
        name: "Memory Master",
        description: "Achieved a high score in the memory game!",
        icon: "🧠",
        pointsAwarded: 30,
    },
    "math-wizard": {
        key: "math-wizard",
        name: "Math Wizard",
        description: "Achieved a high score in the math game!",
        icon: "🔢",
        pointsAwarded: 30,
    },
    "emotion-expert": {
        key: "emotion-expert",
        name: "Emotion Expert",
        description: "Recognized all emotions correctly!",
        icon: "😊",
        pointsAwarded: 25,
    },
    "quick-learner": {
        key: "quick-learner",
        name: "Quick Learner",
        description: "Completed 10 games!",
        icon: "📚",
        pointsAwarded: 20,
    },
    "super-player": {
        key: "super-player",
        name: "Super Player",
        description: "Completed 50 games!",
        icon: "⭐",
        pointsAwarded: 100,
    },
    "perfect-score": {
        key: "perfect-score",
        name: "Perfectionist",
        description: "Got 100% in a game!",
        icon: "💯",
        pointsAwarded: 40,
    },
    "level-up": {
        key: "level-up",
        name: "Level Up!",
        description: "Reached a new level!",
        icon: "🚀",
        pointsAwarded: 15,
    },
};
//# sourceMappingURL=Achievement.js.map