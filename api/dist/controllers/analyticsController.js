import { GameSession, EmotionRecord, Child, Achievement } from "../models/index.js";
/**
 * Get analytics summary for a child
 * GET /api/analytics/summary/:childId
 */
export async function getAnalyticsSummary(req, res) {
    try {
        const { childId } = req.params;
        const { days = "30" } = req.query;
        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        // Get child info
        const child = await Child.findById(childId).select("-pin");
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        // Get game sessions in date range
        const sessions = await GameSession.find({
            childId,
            createdAt: { $gte: startDate },
        });
        // Get emotion records in date range
        const emotions = await EmotionRecord.find({
            childId,
            timestamp: { $gte: startDate },
        });
        // Calculate game statistics by game type
        const gameStatsMap = new Map();
        for (const session of sessions) {
            const existing = gameStatsMap.get(session.gameKey) || {
                totalGames: 0,
                totalScore: 0,
                totalMaxScore: 0,
                totalCorrect: 0,
                totalQuestions: 0,
                totalTime: 0,
                bestScore: 0,
            };
            existing.totalGames += 1;
            existing.totalScore += session.score;
            existing.totalMaxScore += session.maxScore;
            existing.totalCorrect += session.correctAnswers;
            existing.totalQuestions += session.totalQuestions;
            existing.totalTime += session.duration;
            existing.bestScore = Math.max(existing.bestScore, session.score);
            gameStatsMap.set(session.gameKey, existing);
        }
        const gameStats = [];
        for (const [gameKey, stats] of gameStatsMap) {
            gameStats.push({
                gameKey,
                totalGames: stats.totalGames,
                averageScore: stats.totalMaxScore > 0
                    ? Math.round((stats.totalScore / stats.totalMaxScore) * 100)
                    : 0,
                averageAccuracy: stats.totalQuestions > 0
                    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
                    : 0,
                totalTime: stats.totalTime,
                bestScore: stats.bestScore,
            });
        }
        // Calculate emotion statistics
        const emotionStatsMap = new Map();
        for (const record of emotions) {
            const existing = emotionStatsMap.get(record.emotion) || { count: 0, totalIntensity: 0 };
            existing.count += 1;
            existing.totalIntensity += record.intensity;
            emotionStatsMap.set(record.emotion, existing);
        }
        const emotionStats = [];
        for (const [emotion, stats] of emotionStatsMap) {
            emotionStats.push({
                emotion,
                count: stats.count,
                averageIntensity: Math.round(stats.totalIntensity / stats.count),
            });
        }
        // Sort by count descending
        emotionStats.sort((a, b) => b.count - a.count);
        // Calculate overall stats
        const totalGamesPlayed = sessions.length;
        const totalTimePlayed = sessions.reduce((sum, s) => sum + s.duration, 0);
        const overallAccuracy = sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => {
                return sum + (s.totalQuestions > 0 ? s.correctAnswers / s.totalQuestions : 0);
            }, 0) / sessions.length * 100)
            : 0;
        // Get recent achievements
        const recentAchievements = await Achievement.find({ childId })
            .sort({ unlockedAt: -1 })
            .limit(5);
        // Get daily activity (games per day)
        const dailyActivity = await GameSession.aggregate([
            {
                $match: {
                    childId: child._id,
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    gamesPlayed: { $sum: 1 },
                    totalDuration: { $sum: "$duration" },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({
            child: {
                id: child._id,
                name: child.name,
                age: child.age,
                level: child.level,
                totalPoints: child.totalPoints,
            },
            period: {
                days: Number(days),
                startDate,
                endDate: new Date(),
            },
            overview: {
                totalGamesPlayed,
                totalTimePlayed,
                overallAccuracy,
                currentLevel: child.level,
                totalPoints: child.totalPoints,
            },
            gameStats,
            emotionStats,
            dailyActivity: dailyActivity.map((d) => ({
                date: d._id,
                gamesPlayed: d.gamesPlayed,
                totalDuration: d.totalDuration,
            })),
            recentAchievements: recentAchievements.map((a) => ({
                key: a.key,
                name: a.name,
                icon: a.icon,
                unlockedAt: a.unlockedAt,
            })),
        });
    }
    catch (error) {
        console.error("Get analytics summary error:", error);
        res.status(500).json({ error: "Failed to get analytics" });
    }
}
/**
 * Get AI-generated recommendations for a child
 * GET /api/analytics/recommendations/:childId
 */
export async function getRecommendations(req, res) {
    try {
        const { childId } = req.params;
        const child = await Child.findById(childId);
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        // Get recent game sessions (last 30 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const sessions = await GameSession.find({
            childId,
            createdAt: { $gte: startDate },
        });
        const emotions = await EmotionRecord.find({
            childId,
            timestamp: { $gte: startDate },
        });
        const recommendations = [];
        // Analyze game performance
        if (sessions.length === 0) {
            recommendations.push({
                type: "engagement",
                priority: "high",
                title: "Начните играть!",
                description: "Ваш ребенок еще не играл в игры. Попробуйте начать с простых игр на память.",
            });
        }
        else {
            // Calculate performance by game
            const gamePerformance = new Map();
            for (const session of sessions) {
                const accuracy = session.totalQuestions > 0
                    ? session.correctAnswers / session.totalQuestions
                    : 0;
                const existing = gamePerformance.get(session.gameKey) || { accuracy: 0, count: 0 };
                existing.accuracy = (existing.accuracy * existing.count + accuracy) / (existing.count + 1);
                existing.count += 1;
                gamePerformance.set(session.gameKey, existing);
            }
            // Find weak areas
            for (const [gameKey, stats] of gamePerformance) {
                if (stats.accuracy < 0.5 && stats.count >= 3) {
                    const gameNames = {
                        "memory-match": "Игра на память",
                        "pattern-sequence": "Узоры и последовательности",
                        "math-adventure": "Математика",
                        "word-builder": "Слова и буквы",
                        "emotion-cards": "Эмоции",
                        "puzzle-solve": "Головоломки",
                    };
                    recommendations.push({
                        type: "skill",
                        priority: "high",
                        title: `Улучшите навыки: ${gameNames[gameKey] || gameKey}`,
                        description: `Ребенок показывает результат ${Math.round(stats.accuracy * 100)}% в этой игре. Рекомендуем больше практики на легком уровне сложности.`,
                    });
                }
            }
            // Check for games not played
            const allGames = ["memory-match", "pattern-sequence", "math-adventure", "word-builder", "emotion-cards", "puzzle-solve"];
            const playedGames = new Set(gamePerformance.keys());
            const unplayedGames = allGames.filter(g => !playedGames.has(g));
            if (unplayedGames.length > 0) {
                recommendations.push({
                    type: "engagement",
                    priority: "medium",
                    title: "Попробуйте новые игры",
                    description: `Есть ${unplayedGames.length} игр, которые ребенок еще не пробовал. Разнообразие помогает развитию!`,
                });
            }
        }
        // Analyze emotions
        if (emotions.length > 0) {
            const emotionCounts = new Map();
            for (const e of emotions) {
                emotionCounts.set(e.emotion, (emotionCounts.get(e.emotion) || 0) + 1);
            }
            const negativeEmotions = (emotionCounts.get("sad") || 0) +
                (emotionCounts.get("angry") || 0) +
                (emotionCounts.get("fearful") || 0);
            const totalEmotions = emotions.length;
            if (negativeEmotions / totalEmotions > 0.3) {
                recommendations.push({
                    type: "emotional",
                    priority: "high",
                    title: "Обратите внимание на эмоциональное состояние",
                    description: "Замечено много негативных эмоций во время игр. Попробуйте поговорить с ребенком и выбрать более спокойные игры.",
                });
            }
            if ((emotionCounts.get("happy") || 0) / totalEmotions > 0.5) {
                recommendations.push({
                    type: "emotional",
                    priority: "low",
                    title: "Отличное настроение!",
                    description: "Ребенок часто радуется во время игр. Продолжайте в том же духе!",
                });
            }
        }
        // General recommendations based on level
        if (child.level >= 3 && child.level < 5) {
            recommendations.push({
                type: "general",
                priority: "medium",
                title: "Время для нового уровня сложности",
                description: "Ребенок хорошо прогрессирует! Попробуйте игры на среднем уровне сложности.",
            });
        }
        res.json({
            childId,
            recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
            generatedAt: new Date(),
        });
    }
    catch (error) {
        console.error("Get recommendations error:", error);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
}
//# sourceMappingURL=analyticsController.js.map