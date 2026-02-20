// api/src/utils/jwt.ts
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "damubala-secret-key-change-in-production";
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
/**
 * Generates a JWT token for the given payload
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN_SECONDS });
}
/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
//# sourceMappingURL=jwt.js.map