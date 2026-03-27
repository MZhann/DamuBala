// api/src/controllers/aiFriendController.ts
import { Request, Response } from "express";
import { AIFriendSettings, AIFriendMessage, Child, GameSession, Achievement } from "../models/index.js";
import { generateAIFriendResponse } from "../services/aiFriendService.js";
import { ZodError } from "zod";
import { z } from "zod";

const GAME_NAMES: Record<string, string> = {
  "memory-match": "Память",
  "math-adventure": "Математика",
  "pattern-sequence": "Узоры",
  "word-builder": "Слова",
  "emotion-cards": "Эмоции",
  "puzzle-solve": "Головоломки",
  "fruit-ninja-nose": "Фруктовый Ниндзя",
  "pose-match": "Повтори Позу",
};

// Validation schemas
const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).max(20).optional(),
  personality: z.enum(["friendly", "playful", "supportive", "wise", "funny"]).optional(),
  ageLevel: z.enum(["same", "older", "peer"]).optional(),
  topics: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  customInstructions: z.string().max(500).optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

/**
 * Get AI friend settings for a child
 * GET /api/ai-friend/settings/:childId
 */
export async function getAIFriendSettings(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;

    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Check if user is the parent of this child
    if (child.parentId.toString() !== req.user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Get or create default settings
    let settings = await AIFriendSettings.findOne({ childId });
    if (!settings) {
      settings = new AIFriendSettings({
        childId,
        enabled: true,
        name: "Даму",
        personality: "friendly",
        ageLevel: "same",
        topics: ["игры", "учеба", "друзья", "хобби", "эмоции"],
        restrictions: [],
      });
      await settings.save();
    }

    res.json({
      settings: {
        id: settings._id,
        childId: settings.childId,
        enabled: settings.enabled,
        name: settings.name,
        personality: settings.personality,
        ageLevel: settings.ageLevel,
        topics: settings.topics,
        restrictions: settings.restrictions,
        customInstructions: settings.customInstructions,
      },
    });
  } catch (error) {
    console.error("Get AI friend settings error:", error);
    res.status(500).json({ error: "Failed to get AI friend settings" });
  }
}

/**
 * Update AI friend settings (parent only)
 * PUT /api/ai-friend/settings/:childId
 */
export async function updateAIFriendSettings(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;
    const data = updateSettingsSchema.parse(req.body);

    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Check if user is the parent of this child
    if (child.parentId.toString() !== req.user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Get or create settings
    let settings = await AIFriendSettings.findOne({ childId });
    if (!settings) {
      settings = new AIFriendSettings({ childId });
    }

    // Update fields
    if (data.enabled !== undefined) settings.enabled = data.enabled;
    if (data.name !== undefined) settings.name = data.name;
    if (data.personality !== undefined) settings.personality = data.personality;
    if (data.ageLevel !== undefined) settings.ageLevel = data.ageLevel;
    if (data.topics !== undefined) settings.topics = data.topics;
    if (data.restrictions !== undefined) settings.restrictions = data.restrictions;
    if (data.customInstructions !== undefined) settings.customInstructions = data.customInstructions;

    await settings.save();

    res.json({
      message: "AI friend settings updated",
      settings: {
        id: settings._id,
        childId: settings.childId,
        enabled: settings.enabled,
        name: settings.name,
        personality: settings.personality,
        ageLevel: settings.ageLevel,
        topics: settings.topics,
        restrictions: settings.restrictions,
        customInstructions: settings.customInstructions,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      res.status(400).json({ error: firstIssue?.message || "Validation error" });
      return;
    }
    console.error("Update AI friend settings error:", error);
    res.status(500).json({ error: "Failed to update AI friend settings" });
  }
}

/**
 * Send message to AI friend (child)
 * POST /api/ai-friend/chat/:childId
 */
export async function sendMessageToAIFriend(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;
    const { message } = sendMessageSchema.parse(req.body);

    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Check if user is the parent of this child (parent can send messages on behalf of child)
    if (child.parentId.toString() !== req.user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Check if AI friend is enabled
    const settings = await AIFriendSettings.findOne({ childId });
    if (!settings || !settings.enabled) {
      res.status(403).json({ error: "AI friend is not enabled for this child" });
      return;
    }

    // Save child's message
    const childMessage = new AIFriendMessage({
      childId,
      role: "child",
      content: message,
    });
    await childMessage.save();

    // Get recent messages for context
    const recentMessages = await AIFriendMessage.find({ childId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("role content")
      .lean();

    // Build child progress context for encouragement
    const [totalGamesPlayed, achievementCount, lastSession] = await Promise.all([
      GameSession.countDocuments({ childId }),
      Achievement.countDocuments({ childId }),
      GameSession.findOne({ childId }).sort({ createdAt: -1 }).lean(),
    ]);

    const progressContext = {
      totalPoints: child.totalPoints,
      level: child.level,
      currentStreak: child.currentStreak || 0,
      bestStreak: child.bestStreak || 0,
      recentGameName: lastSession ? (GAME_NAMES[lastSession.gameKey] || lastSession.gameKey) : undefined,
      recentScore: lastSession && lastSession.maxScore > 0
        ? Math.round((lastSession.score / lastSession.maxScore) * 100)
        : undefined,
      totalGamesPlayed,
      achievementCount,
    };

    // Generate AI response with progress context
    const aiResponse = await generateAIFriendResponse(
      child,
      settings,
      message,
      recentMessages.reverse().map((m) => ({ role: m.role as "child" | "ai", content: m.content })),
      progressContext,
    );

    // Save AI's response
    const aiMessage = new AIFriendMessage({
      childId,
      role: "ai",
      content: aiResponse,
    });
    await aiMessage.save();

    res.json({
      message: "Message sent",
      response: aiResponse,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      res.status(400).json({ error: firstIssue?.message || "Validation error" });
      return;
    }
    console.error("Send message to AI friend error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
}

/**
 * Get chat history
 * GET /api/ai-friend/chat/:childId/history
 */
export async function getChatHistory(req: Request, res: Response): Promise<void> {
  try {
    const { childId } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const child = await Child.findById(childId);
    if (!child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    // Check if user is the parent of this child
    if (child.parentId.toString() !== req.user.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const messages = await AIFriendMessage.find({ childId })
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AIFriendMessage.countDocuments({ childId });

    res.json({
      messages: messages.reverse().map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Failed to get chat history" });
  }
}

