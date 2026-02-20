export interface TokenPayload {
    userId: string;
    email: string;
    role: "parent" | "child";
}
/**
 * Generates a JWT token for the given payload
 */
export declare function generateToken(payload: TokenPayload): string;
/**
 * Verifies and decodes a JWT token
 */
export declare function verifyToken(token: string): TokenPayload;
