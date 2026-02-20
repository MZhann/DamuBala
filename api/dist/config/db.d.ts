/**
 * Connects to MongoDB using the MONGODB_URI environment variable
 */
export declare function connectDB(): Promise<void>;
/**
 * Gracefully disconnects from MongoDB
 */
export declare function disconnectDB(): Promise<void>;
