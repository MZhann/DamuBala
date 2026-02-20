/**
 * Global error handling middleware
 */
export function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";
    console.error(`[ERROR] ${statusCode}: ${message}`, err.stack);
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
/**
 * Creates an operational error with status code
 */
export function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}
//# sourceMappingURL=errorHandler.js.map