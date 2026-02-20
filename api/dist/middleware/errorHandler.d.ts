import { Request, Response, NextFunction } from "express";
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
/**
 * Global error handling middleware
 */
export declare function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void;
/**
 * Creates an operational error with status code
 */
export declare function createError(message: string, statusCode: number): AppError;
