import { Request, Response } from "express";
/**
 * Register a new parent account
 * POST /api/auth/register
 */
export declare function register(req: Request, res: Response): Promise<void>;
/**
 * Login with existing account
 * POST /api/auth/login
 */
export declare function login(req: Request, res: Response): Promise<void>;
/**
 * Get current user profile
 * GET /api/auth/me
 */
export declare function getMe(req: Request, res: Response): Promise<void>;
