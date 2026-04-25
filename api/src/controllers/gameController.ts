// api/src/controllers/gameController.ts
import { Request, Response } from "express";
import { GameSession, Child, Achievement, ACHIEVEMENT_DEFINITIONS } from "../models/index.js";
import { saveGameSessionSchema } from "../utils/validation.js";
import { ZodError } from "zod";
import type { AchievementKey } from "../models/Achievement.js";
import type { GameKey } from "../models/GameSession.js";
import { generatePostGameRecommendation } from "../services/aiRecommendationService.js";

const POINTS_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelThresholds() {
  return LEVEL_THRESHOLDS;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

async function awardAchievement(childId: string, key: AchievementKey): Promise<boolean> {
  try {
    const definition = ACHIEVEMENT_DEFINITIONS[key];
    if (!definition) return false;

    const existing = await Achievement.findOne({ childId, key });
    if (existing) return false;

    const achievement = new Achievement({
      childId,
      ...definition,
    });
    await achievement.save();

    await Child.findByIdAndUpdate(childId, {
      $inc: { totalPoints: definition.pointsAwarded },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Check and award all achievements after a game session.
 * Returns array of newly awarded achievement keys.
 */
async function checkAllAchievements(
  childId: string,
  gameKey: GameKey,
  scorePercentage: number,
  newLevel: number,
  previousLevel: number,
): Promise<string[]> {
  const awarded: string[] = [];
  const child = await Child.findById(childId);
  if (!child) return awarded;

  const gameCount = await GameSession.countDocuments({ childId });

  // --- Milestone achievements ---
  if (gameCount === 1 && await awardAchievement(childId, "first-game")) {
    awarded.push("first-game");
  }
  if (gameCount >= 10 && await awardAchievement(childId, "quick-learner")) {
    awarded.push("quick-learner");
  }
  if (gameCount >= 50 && await awardAchievement(childId, "super-player")) {
    awarded.push("super-player");
  }

  // --- Perfect score ---
  if (scorePercentage >= 1 && await awardAchievement(childId, "perfect-score")) {
    awarded.push("perfect-score");
  }

  // --- Level up ---
  if (newLevel > previousLevel && await awardAchievement(childId, "level-up")) {
    awarded.push("level-up");
  }

  // --- Game-specific high score achievements (90%+) ---
  if (scorePercentage >= 0.9) {
    if (gameKey === "memory-match" && await awardAchievement(childId, "memory-master")) {
      awarded.push("memory-master");
    }
    if (gameKey === "math-adventure" && await awardAchievement(childId, "math-wizard")) {
      awarded.push("math-wizard");
    }
    if (gameKey === "emotion-cards" && await awardAchievement(childId, "emotion-expert")) {
      awarded.push("emotion-expert");
    }
  }

  // --- Week streak (7+ days) ---
  if (child.currentStreak >= 7 && await awardAchievement(childId, "week-streak")) {
    awarded.push("week-streak");
  }

  return awarded;
}

/**
 * Update the child's play streak. Call BEFORE saving points/level.
 * Returns the updated streak values.
 */
async function updateStreak(childId: string): Promise<{ currentStreak: number; bestStreak: number }> {
  const child = await Child.findById(childId);
  if (!child) return { currentStreak: 0, bestStreak: 0 };

  const today = getTodayString();
  const yesterday = getYesterdayString();

  let newStreak = child.currentStreak || 0;

  if (child.lastPlayedDate === today) {
    // Already played today, streak unchanged
    return { currentStreak: newStreak, bestStreak: child.bestStreak || newStreak };
  } else if (child.lastPlayedDate === yesterday) {
    // Consecutive day - extend streak
    newStreak += 1;
  } else {
    // Streak broken (or first play ever)
    newStreak = 1;
  }

  const bestStreak = Math.max(child.bestStreak || 0, newStreak);

  await Child.findByIdAndUpdate(childId, {
    currentStreak: newStreak,
    bestStreak,
    lastPlayedDate: today,
  });

  return { currentStreak: newStreak, bestStreak };
}

/**
 * Save a game session result
 * POST /api/games/sessions
 */
export async function saveGameSession(req: Request, res: Response): Promise<void> {
  try {
    const data = saveGameSessionSchema.parse(req.body);

    const child = await Child.findById(data.childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

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

    // Update streak first
    const streakResult = await updateStreak(data.childId);

    // Calculate points
    const scorePercentage = data.maxScore > 0 ? data.score / data.maxScore : 0;
    const multiplier = POINTS_MULTIPLIER[data.difficulty] || 1;
    const pointsEarned = Math.round(scorePercentage * 10 * multiplier);

    const previousLevel = child.level;
    const newTotalPoints = child.totalPoints + pointsEarned;
    const newLevel = calculateLevel(newTotalPoints);

    await Child.findByIdAndUpdate(data.childId, {
      totalPoints: newTotalPoints,
      level: newLevel,
    });

    // Check ALL achievements
    const newAchievements = await checkAllAchievements(
      data.childId,
      data.gameKey,
      scorePercentage,
      newLevel,
      previousLevel,
    );

    // Compute final totalPoints after achievement bonuses
    const updatedChild = await Child.findById(data.childId);
    const finalTotalPoints = updatedChild?.totalPoints ?? newTotalPoints;
    const finalLevel = calculateLevel(finalTotalPoints);
    if (updatedChild && finalLevel !== updatedChild.level) {
      await Child.findByIdAndUpdate(data.childId, { level: finalLevel });
    }

    // Fetch full details of newly awarded achievements for the response
    const awardedDetails = newAchievements.length > 0
      ? await Achievement.find({ childId: data.childId, key: { $in: newAchievements } })
          .select("key name icon pointsAwarded")
          .lean()
      : [];

    // Generate post-game recommendation
    let postGameRecommendation = null;
    try {
      const accuracy = data.totalQuestions > 0 ? data.correctAnswers / data.totalQuestions : 0;
      postGameRecommendation = await generatePostGameRecommendation(
        {
          name: child.name,
          age: child.age,
          level: finalLevel,
          totalPoints: finalTotalPoints,
          language: child.language || "ru",
        },
        data.gameKey,
        data.score,
        data.maxScore,
        accuracy,
        data.difficulty || "easy",
      );
    } catch (error) {
      console.error("Post-game recommendation generation error:", error);
    }

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
      newTotalPoints: finalTotalPoints,
      newLevel: finalLevel,
      leveledUp: finalLevel > previousLevel,
      newAchievements,
      newAchievementDetails: awardedDetails.map((a) => ({
        key: a.key,
        name: a.name,
        icon: a.icon,
        pointsAwarded: a.pointsAwarded,
      })),
      streak: streakResult,
      recommendation: postGameRecommendation,
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
      allDefinitions: Object.values(ACHIEVEMENT_DEFINITIONS).map((d) => ({
        key: d.key,
        name: d.name,
        description: d.description,
        icon: d.icon,
        pointsAwarded: d.pointsAwarded,
      })),
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Failed to get achievements" });
  }
}
