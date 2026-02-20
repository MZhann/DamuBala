// api/src/config/db.ts
import mongoose from "mongoose";
/**
 * Connects to MongoDB using the MONGODB_URI environment variable
 */
export async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI environment variable is not set");
    }
    try {
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}
/**
 * Gracefully disconnects from MongoDB
 */
export async function disconnectDB() {
    await mongoose.disconnect();
    console.log("📴 Disconnected from MongoDB");
}
//# sourceMappingURL=db.js.map