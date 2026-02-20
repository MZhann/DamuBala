import { Request, Response } from "express";
/**
 * Create a new child profile
 * POST /api/children
 */
export declare function createChild(req: Request, res: Response): Promise<void>;
/**
 * Get all children for the authenticated parent
 * GET /api/children
 */
export declare function getChildren(req: Request, res: Response): Promise<void>;
/**
 * Get a single child by ID
 * GET /api/children/:id
 */
export declare function getChild(req: Request, res: Response): Promise<void>;
/**
 * Update a child profile
 * PATCH /api/children/:id
 */
export declare function updateChild(req: Request, res: Response): Promise<void>;
/**
 * Delete a child profile
 * DELETE /api/children/:id
 */
export declare function deleteChild(req: Request, res: Response): Promise<void>;
/**
 * Verify child PIN for child mode access
 * POST /api/children/:id/verify-pin
 */
export declare function verifyChildPin(req: Request, res: Response): Promise<void>;
