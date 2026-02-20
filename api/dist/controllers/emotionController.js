import { EmotionRecord, Child } from "../models/index.js";
import { saveEmotionSchema } from "../utils/validation.js";
import { ZodError } from "zod";
/**
 * Save an emotion record
 * POST /api/emotions
 */
export async function saveEmotion(req, res) {
    try {
        const data = saveEmotionSchema.parse(req.body);
        // Verify child exists
        const child = await Child.findById(data.childId);
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        const emotion = new EmotionRecord({
            childId: data.childId,
            emotion: data.emotion,
            intensity: data.intensity,
            context: data.context,
            gameSessionId: data.gameSessionId,
        });
        await emotion.save();
        res.status(201).json({
            message: "Emotion recorded",
            emotion: {
                id: emotion._id,
                emotion: emotion.emotion,
                intensity: emotion.intensity,
                context: emotion.context,
                timestamp: emotion.timestamp,
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            const firstIssue = error.issues[0];
            res.status(400).json({ error: firstIssue?.message || "Validation error" });
            return;
        }
        console.error("Save emotion error:", error);
        res.status(500).json({ error: "Failed to save emotion" });
    }
}
/**
 * Get emotion history for a child
 * GET /api/emotions/:childId
 */
export async function getEmotions(req, res) {
    try {
        const { childId } = req.params;
        const { limit = "50", offset = "0", days = "7" } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        const emotions = await EmotionRecord.find({
            childId,
            timestamp: { $gte: startDate },
        })
            .sort({ timestamp: -1 })
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await EmotionRecord.countDocuments({
            childId,
            timestamp: { $gte: startDate },
        });
        res.json({
            emotions: emotions.map((e) => ({
                id: e._id,
                emotion: e.emotion,
                intensity: e.intensity,
                context: e.context,
                timestamp: e.timestamp,
            })),
            total,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    catch (error) {
        console.error("Get emotions error:", error);
        res.status(500).json({ error: "Failed to get emotions" });
    }
}
/**
 * Get emotion summary for a child (aggregated stats)
 * GET /api/emotions/:childId/summary
 */
export async function getEmotionSummary(req, res) {
    try {
        const { childId } = req.params;
        const { days = "7" } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        const child = await Child.findById(childId);
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        // Aggregate emotions by type
        const emotionSummary = await EmotionRecord.aggregate([
            {
                $match: {
                    childId: child._id,
                    timestamp: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$emotion",
                    count: { $sum: 1 },
                    averageIntensity: { $avg: "$intensity" },
                },
            },
            { $sort: { count: -1 } },
        ]);
        // Aggregate emotions by day
        const dailyEmotions = await EmotionRecord.aggregate([
            {
                $match: {
                    childId: child._id,
                    timestamp: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        emotion: "$emotion",
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.date": 1 } },
        ]);
        // Find dominant emotion
        const dominantEmotion = emotionSummary.length > 0 ? emotionSummary[0]?._id : null;
        res.json({
            childId,
            period: {
                days: Number(days),
                startDate,
                endDate: new Date(),
            },
            dominantEmotion,
            emotionBreakdown: emotionSummary.map((e) => ({
                emotion: e._id,
                count: e.count,
                averageIntensity: Math.round(e.averageIntensity),
            })),
            dailyEmotions: dailyEmotions.map((d) => ({
                date: d._id.date,
                emotion: d._id.emotion,
                count: d.count,
            })),
        });
    }
    catch (error) {
        console.error("Get emotion summary error:", error);
        res.status(500).json({ error: "Failed to get emotion summary" });
    }
}
//# sourceMappingURL=emotionController.js.map