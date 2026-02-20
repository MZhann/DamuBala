import { Request, Response } from "express";
/**
 * Save a game session result
 * POST /api/games/sessions
 */
export declare function saveGameSession(req: Request, res: Response): Promise<void>;
/**
 * Get game history for a child
 * GET /api/games/sessions/:childId
 */
export declare function getGameSessions(req: Request, res: Response): Promise<void>;
/**
 * Get achievements for a child
 * GET /api/games/achievements/:childId
 */
export declare function getAchievements(req: Request, res: Response): Promise<void>;
