// api/src/controllers/authController.ts
import { Request, Response } from "express";
import { User } from "../models/index.js";
import { generateToken } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../utils/validation.js";
import { ZodError } from "zod";

/**
 * Register a new parent account
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    // Create new user
    const user = new User({
      email: data.email,
      passwordHash: data.password, // Will be hashed by pre-save hook
      name: data.name,
      language: data.language,
      role: "parent",
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: "parent",
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      res.status(400).json({ error: firstIssue?.message || "Validation error" });
      return;
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

/**
 * Login with existing account
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: data.email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check password
    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: "parent",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      res.status(400).json({ error: firstIssue?.message || "Validation error" });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
}
