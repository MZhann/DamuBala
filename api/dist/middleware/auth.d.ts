import { Request, Response, NextFunction } from "express";
import { TokenPayload } from "../utils/jwt.js";
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and validates it
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to require parent role
 * Must be used after requireAuth
 */
export declare function requireParent(req: Request, res: Response, next: NextFunction): void;
