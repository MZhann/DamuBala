// api/src/routes/gameRoutes.ts
import { Router } from "express";
import {
  saveGameSession,
  getGameSessions,
  getAchievements,
} from "../controllers/gameController.js";

const router = Router();

// Save game session (called from child mode)
router.post("/sessions", saveGameSession);

// Get game history for a child
router.get("/sessions/:childId", getGameSessions);

// Get achievements for a child
router.get("/achievements/:childId", getAchievements);

export default router;

