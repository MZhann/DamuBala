// api/src/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes.js";
import childRoutes from "./childRoutes.js";
import gameRoutes from "./gameRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import emotionRoutes from "./emotionRoutes.js";
import aiFriendRoutes from "./aiFriendRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/children", childRoutes);
router.use("/games", gameRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/emotions", emotionRoutes);
router.use("/ai-friend", aiFriendRoutes);

export default router;

