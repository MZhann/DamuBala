import { verifyToken } from "../utils/jwt.js";
/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and validates it
 */
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization token required" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Authorization token required" });
        return;
    }
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
/**
 * Middleware to require parent role
 * Must be used after requireAuth
 */
export function requireParent(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    if (req.user.role !== "parent") {
        res.status(403).json({ error: "Parent access required" });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map