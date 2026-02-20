import { Request, Response } from "express";
/**
 * Save an emotion record
 * POST /api/emotions
 */
export declare function saveEmotion(req: Request, res: Response): Promise<void>;
/**
 * Get emotion history for a child
 * GET /api/emotions/:childId
 */
export declare function getEmotions(req: Request, res: Response): Promise<void>;
/**
 * Get emotion summary for a child (aggregated stats)
 * GET /api/emotions/:childId/summary
 */
export declare function getEmotionSummary(req: Request, res: Response): Promise<void>;
