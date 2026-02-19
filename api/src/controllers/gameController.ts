// api/src/controllers/gameController.ts
import { Request, Response } from "express";
import { GameSession, Child, Achievement, ACHIEVEMENT_DEFINITIONS } from "../models/index.js";
import { saveGameSessionSchema } from "../utils/validation.js";
import { ZodError } from "zod";
import type { AchievementKey } from "../models/Achievement.js";

// Points awarded per score percentage
const POINTS_MULTIPLIER = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

/**
 * Calculate level from total points
 */
function calculateLevel(totalPoints: number): number {
  // Level thresholds: 0-99 = L1, 100-299 = L2, 300-599 = L3, etc.
  if (totalPoints < 100) return 1;
  if (totalPoints < 300) return 2;
  if (totalPoints < 600) return 3;
  if (totalPoints < 1000) return 4;
  if (totalPoints < 1500) return 5;
  if (totalPoints < 2100) return 6;
  if (totalPoints < 2800) return 7;
  if (totalPoints < 3600) return 8;
  if (totalPoints < 4500) return 9;
  return 10;
}

/**
 * Check and award achievements
 */
async function checkAchievements(childId: string): Promise<string[]> {
  const awarded: string[] = [];

  // Get child's game count
  const gameCount = await GameSession.countDocuments({ childId });
  const child = await Child.findById(childId);

  if (!child) return awarded;

  // First game achievement
  if (gameCount === 1) {
    await awardAchievement(childId, "first-game");
    awarded.push("first-game");
  }

  // Quick learner (10 games)
  if (gameCount === 10) {
    await awardAchievement(childId, "quick-learner");
    awarded.push("quick-learner");
  }

  // Super player (50 games)
  if (gameCount === 50) {
    await awardAchievement(childId, "super-player");
    awarded.push("super-player");
  }

  return awarded;
}

/**
 * Award an achievement to a child
 */
async function awardAchievement(childId: string, key: AchievementKey): Promise<boolean> {
  try {
    const definition = ACHIEVEMENT_DEFINITIONS[key];
    if (!definition) return false;

    // Check if already awarded
    const existing = await Achievement.findOne({ childId, key });
    if (existing) return false;

    // Create achievement
    const achievement = new Achievement({
      childId,
      ...definition,
    });

    await achievement.save();

    // Add points to child
    await Child.findByIdAndUpdate(childId, {
      $inc: { totalPoints: definition.pointsAwarded },
    });

    return true;
  } catch {
    // Ignore duplicate key errors (already awarded)
    return false;
  }
}

/**
 * Save a game session result
 * POST /api/games/sessions
 */
export async function saveGameSession(req: Request, res: Response): Promise<void> {
  try {
    const data = saveGameSessionSchema.parse(req.body);

    // Verify child exists
    const child = await Child.findById(data.childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Create game session
    const session = new GameSession({
      childId: data.childId,
      gameKey: data.gameKey,
      score: data.score,
      maxScore: data.maxScore,
      duration: data.duration,
      difficulty: data.difficulty,
      correctAnswers: data.correctAnswers,
      totalQuestions: data.totalQuestions,
      emotionDuringGame: data.emotionDuringGame,
    });

    await session.save();

    // Calculate points earned
    const scorePercentage = data.maxScore > 0 ? data.score / data.maxScore : 0;
    const multiplier = POINTS_MULTIPLIER[data.difficulty];
    const pointsEarned = Math.round(scorePercentage * 10 * multiplier);

    // Check for perfect score achievement
    if (scorePercentage === 1) {
      await awardAchievement(data.childId, "perfect-score");
    }

    // Update child's total points and level
    const previousLevel = child.level;
    const newTotalPoints = child.totalPoints + pointsEarned;
    const newLevel = calculateLevel(newTotalPoints);

    await Child.findByIdAndUpdate(data.childId, {
      totalPoints: newTotalPoints,
      level: newLevel,
    });

    // Check for level up achievement
    if (newLevel > previousLevel) {
      await awardAchievement(data.childId, "level-up");
    }

    // Check other achievements
    const newAchievements = await checkAchievements(data.childId);

    res.status(201).json({
      message: "Game session saved",
      session: {
        id: session._id,
        gameKey: session.gameKey,
        score: session.score,
        maxScore: session.maxScore,
        duration: session.duration,
        difficulty: session.difficulty,
      },
      pointsEarned,
      newTotalPoints,
      newLevel,
      leveledUp: newLevel > previousLevel,
      newAchievements,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      res.status(400).json({ error: firstIssue?.message || "Validation error" });
      return;
    }
    console.error("Save game session error:", error);
    res.status(500).json({ error: "Failed to save game session" });
  }
}

/**
 * Get game history for a child
 * GET /api/games/sessions/:childId
 */
export async function getGameSessions(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;
    const { limit = "20", offset = "0", gameKey } = req.query;

    const query: Record<string, unknown> = { childId };
    if (gameKey) {
      query.gameKey = gameKey;
    }

    const sessions = await GameSession.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await GameSession.countDocuments(query);

    res.json({
      sessions: sessions.map((s) => ({
        id: s._id,
        gameKey: s.gameKey,
        score: s.score,
        maxScore: s.maxScore,
        duration: s.duration,
        difficulty: s.difficulty,
        correctAnswers: s.correctAnswers,
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Get game sessions error:", error);
    res.status(500).json({ error: "Failed to get game sessions" });
  }
}

/**
 * Get achievements for a child
 * GET /api/games/achievements/:childId
 */
export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;

    const achievements = await Achievement.find({ childId }).sort({ unlockedAt: -1 });

    res.json({
      achievements: achievements.map((a) => ({
        id: a._id,
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        pointsAwarded: a.pointsAwarded,
        unlockedAt: a.unlockedAt,
      })),
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Failed to get achievements" });
  }
}
