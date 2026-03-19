// api/src/controllers/analyticsController.ts
import { Request, Response } from "express";
import { GameSession, EmotionRecord, Child, Achievement, AIFriendMessage } from "../models/index.js";
import type { GameKey } from "../models/GameSession.js";
import type { EmotionType } from "../models/EmotionRecord.js";
import { generateRecommendations, generateWeeklyReport } from "../services/aiRecommendationService.js";

interface GameStats {
  gameKey: GameKey;
  totalGames: number;
  averageScore: number;
  averageAccuracy: number;
  totalTime: number;
  bestScore: number;
}

interface EmotionStats {
  emotion: EmotionType;
  count: number;
  averageIntensity: number;
}

/**
 * Get analytics summary for a child
 * GET /api/analytics/summary/:childId
 */
export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
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
    const gameStatsMap = new Map<GameKey, {
      totalGames: number;
      totalScore: number;
      totalMaxScore: number;
      totalCorrect: number;
      totalQuestions: number;
      totalTime: number;
      bestScore: number;
    }>();

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

    const gameStats: GameStats[] = [];
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
    const emotionStatsMap = new Map<EmotionType, { count: number; totalIntensity: number }>();

    for (const record of emotions) {
      const existing = emotionStatsMap.get(record.emotion) || { count: 0, totalIntensity: 0 };
      existing.count += 1;
      existing.totalIntensity += record.intensity;
      emotionStatsMap.set(record.emotion, existing);
    }

    const emotionStats: EmotionStats[] = [];
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
      ? Math.round(
          sessions.reduce((sum, s) => {
            return sum + (s.totalQuestions > 0 ? s.correctAnswers / s.totalQuestions : 0);
          }, 0) / sessions.length * 100
        )
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
  } catch (error) {
    console.error("Get analytics summary error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
}

/**
 * Get AI-generated recommendations for a child
 * GET /api/analytics/recommendations/:childId
 */
export async function getRecommendations(req: Request, res: Response): Promise<void> {
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
    }).sort({ createdAt: -1 });

    const emotions = await EmotionRecord.find({
      childId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    const achievements = await Achievement.find({ childId })
      .sort({ unlockedAt: -1 })
      .limit(10);

    // Prepare data for AI service
    const gameSessionsData = sessions.map((s) => ({
      gameKey: s.gameKey,
      score: s.score,
      maxScore: s.maxScore,
      accuracy: s.totalQuestions > 0 ? s.correctAnswers / s.totalQuestions : 0,
      duration: s.duration,
      difficulty: s.difficulty,
      completedAt: s.completedAt,
    }));

    const emotionsData = emotions.map((e) => ({
      emotion: e.emotion,
      intensity: e.intensity,
      context: e.context,
      timestamp: e.timestamp,
    }));

    const achievementNames = achievements.map((a) => a.name);

    // Generate AI recommendations
    const recommendations = await generateRecommendations(
      {
        name: child.name,
        age: child.age,
        level: child.level,
        totalPoints: child.totalPoints,
        language: child.language || "ru",
      },
      gameSessionsData,
      emotionsData,
      achievementNames,
    );

    res.json({
      childId,
      recommendations: recommendations.slice(0, 5),
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
}

/**
 * Get AI-generated weekly report for a child
 * GET /api/analytics/weekly-report/:childId
 */
export async function getWeeklyReport(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const [sessions, emotions, achievements, chatMessages] = await Promise.all([
      GameSession.find({ childId, createdAt: { $gte: startDate } }).sort({ createdAt: -1 }),
      EmotionRecord.find({ childId, timestamp: { $gte: startDate } }).sort({ timestamp: -1 }),
      Achievement.find({ childId, unlockedAt: { $gte: startDate } }),
      AIFriendMessage.find({ childId, timestamp: { $gte: startDate } }),
    ]);

    const gameSessionsData = sessions.map((s) => ({
      gameKey: s.gameKey,
      score: s.score,
      maxScore: s.maxScore,
      accuracy: s.totalQuestions > 0 ? s.correctAnswers / s.totalQuestions : 0,
      duration: s.duration,
      difficulty: s.difficulty,
      completedAt: s.completedAt,
    }));

    const emotionsData = emotions.map((e) => ({
      emotion: e.emotion,
      intensity: e.intensity,
      context: e.context,
      timestamp: e.timestamp,
    }));

    const childMessages = chatMessages.filter((m) => m.role === "child");
    const chatTopics = childMessages
      .slice(0, 10)
      .map((m) => m.content.substring(0, 50));

    const report = await generateWeeklyReport(
      {
        name: child.name,
        age: child.age,
        level: child.level,
        totalPoints: child.totalPoints,
        language: child.language || "ru",
      },
      gameSessionsData,
      emotionsData,
      achievements.map((a) => a.name),
      chatMessages.length,
      chatTopics,
    );

    res.json({
      childId,
      report,
      period: { startDate, endDate: new Date() },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get weekly report error:", error);
    res.status(500).json({ error: "Failed to generate weekly report" });
  }
}

/**
 * Get chat analytics for a child
 * GET /api/analytics/chat-stats/:childId
 */
export async function getChatAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;
    const { days = "30" } = req.query;

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const messages = await AIFriendMessage.find({
      childId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    const totalMessages = messages.length;
    const childMessages = messages.filter((m) => m.role === "child").length;
    const aiMessages = messages.filter((m) => m.role === "ai").length;

    // Daily message counts
    const dailyMessages = await AIFriendMessage.aggregate([
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
            role: "$role",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const dailyChatActivity: { date: string; childMessages: number; aiMessages: number }[] = [];
    const dateMap = new Map<string, { childMessages: number; aiMessages: number }>();

    for (const entry of dailyMessages) {
      const date = entry._id.date;
      const existing = dateMap.get(date) || { childMessages: 0, aiMessages: 0 };
      if (entry._id.role === "child") existing.childMessages = entry.count;
      else existing.aiMessages = entry.count;
      dateMap.set(date, existing);
    }

    for (const [date, counts] of dateMap) {
      dailyChatActivity.push({ date, ...counts });
    }
    dailyChatActivity.sort((a, b) => a.date.localeCompare(b.date));

    // Average message length
    const childMsgs = messages.filter((m) => m.role === "child");
    const avgMessageLength = childMsgs.length > 0
      ? Math.round(childMsgs.reduce((sum, m) => sum + m.content.length, 0) / childMsgs.length)
      : 0;

    res.json({
      childId,
      totalMessages,
      childMessages,
      aiMessages,
      avgMessageLength,
      dailyChatActivity,
      activeDays: dateMap.size,
    });
  } catch (error) {
    console.error("Get chat analytics error:", error);
    res.status(500).json({ error: "Failed to get chat analytics" });
  }
}

