import { Request, Response } from "express";
/**
 * Get analytics summary for a child
 * GET /api/analytics/summary/:childId
 */
export declare function getAnalyticsSummary(req: Request, res: Response): Promise<void>;
/**
 * Get AI-generated recommendations for a child
 * GET /api/analytics/recommendations/:childId
 */
export declare function getRecommendations(req: Request, res: Response): Promise<void>;
