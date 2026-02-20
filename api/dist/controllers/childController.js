import { Child } from "../models/index.js";
import { createChildSchema, updateChildSchema } from "../utils/validation.js";
import { ZodError } from "zod";
/**
 * Create a new child profile
 * POST /api/children
 */
export async function createChild(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const data = createChildSchema.parse(req.body);
        const child = new Child({
            parentId: req.user.userId,
            name: data.name,
            age: data.age,
            avatar: data.avatar,
            language: data.language,
            pin: data.pin,
        });
        await child.save();
        res.status(201).json({
            message: "Child profile created",
            child: {
                id: child._id,
                name: child.name,
                age: child.age,
                avatar: child.avatar,
                language: child.language,
                totalPoints: child.totalPoints,
                level: child.level,
                createdAt: child.createdAt,
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            const firstIssue = error.issues[0];
            res.status(400).json({ error: firstIssue?.message || "Validation error" });
            return;
        }
        console.error("Create child error:", error);
        res.status(500).json({ error: "Failed to create child profile" });
    }
}
/**
 * Get all children for the authenticated parent
 * GET /api/children
 */
export async function getChildren(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const children = await Child.find({ parentId: req.user.userId })
            .select("-pin")
            .sort({ createdAt: -1 });
        res.json({
            children: children.map((child) => ({
                id: child._id,
                name: child.name,
                age: child.age,
                avatar: child.avatar,
                language: child.language,
                totalPoints: child.totalPoints,
                level: child.level,
                createdAt: child.createdAt,
            })),
        });
    }
    catch (error) {
        console.error("Get children error:", error);
        res.status(500).json({ error: "Failed to get children" });
    }
}
/**
 * Get a single child by ID
 * GET /api/children/:id
 */
export async function getChild(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const child = await Child.findOne({
            _id: req.params.id,
            parentId: req.user.userId,
        }).select("-pin");
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        res.json({
            child: {
                id: child._id,
                name: child.name,
                age: child.age,
                avatar: child.avatar,
                language: child.language,
                totalPoints: child.totalPoints,
                level: child.level,
                createdAt: child.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Get child error:", error);
        res.status(500).json({ error: "Failed to get child" });
    }
}
/**
 * Update a child profile
 * PATCH /api/children/:id
 */
export async function updateChild(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const data = updateChildSchema.parse(req.body);
        const child = await Child.findOneAndUpdate({ _id: req.params.id, parentId: req.user.userId }, { $set: data }, { new: true }).select("-pin");
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        res.json({
            message: "Child profile updated",
            child: {
                id: child._id,
                name: child.name,
                age: child.age,
                avatar: child.avatar,
                language: child.language,
                totalPoints: child.totalPoints,
                level: child.level,
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            const firstIssue = error.issues[0];
            res.status(400).json({ error: firstIssue?.message || "Validation error" });
            return;
        }
        console.error("Update child error:", error);
        res.status(500).json({ error: "Failed to update child" });
    }
}
/**
 * Delete a child profile
 * DELETE /api/children/:id
 */
export async function deleteChild(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const child = await Child.findOneAndDelete({
            _id: req.params.id,
            parentId: req.user.userId,
        });
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        res.json({ message: "Child profile deleted" });
    }
    catch (error) {
        console.error("Delete child error:", error);
        res.status(500).json({ error: "Failed to delete child" });
    }
}
/**
 * Verify child PIN for child mode access
 * POST /api/children/:id/verify-pin
 */
export async function verifyChildPin(req, res) {
    try {
        const { pin } = req.body;
        if (!pin) {
            res.status(400).json({ error: "PIN is required" });
            return;
        }
        const child = await Child.findById(req.params.id);
        if (!child) {
            res.status(404).json({ error: "Child not found" });
            return;
        }
        // If no PIN is set, allow access
        if (!child.pin) {
            res.json({
                valid: true,
                child: {
                    id: child._id,
                    name: child.name,
                    age: child.age,
                    avatar: child.avatar,
                    language: child.language,
                    totalPoints: child.totalPoints,
                    level: child.level,
                },
            });
            return;
        }
        // Verify PIN
        if (child.pin !== pin) {
            res.status(401).json({ error: "Invalid PIN", valid: false });
            return;
        }
        res.json({
            valid: true,
            child: {
                id: child._id,
                name: child.name,
                age: child.age,
                avatar: child.avatar,
                language: child.language,
                totalPoints: child.totalPoints,
                level: child.level,
            },
        });
    }
    catch (error) {
        console.error("Verify PIN error:", error);
        res.status(500).json({ error: "Failed to verify PIN" });
    }
}
//# sourceMappingURL=childController.js.map