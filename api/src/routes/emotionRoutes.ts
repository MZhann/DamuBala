// api/src/routes/emotionRoutes.ts
import { Router } from "express";
import {
  saveEmotion,
  getEmotions,
  getEmotionSummary,
} from "../controllers/emotionController.js";

const router = Router();

// Save emotion (called from child mode / CV integration)
router.post("/", saveEmotion);

// Get emotion history
router.get("/:childId", getEmotions);

// Get emotion summary
router.get("/:childId/summary", getEmotionSummary);

export default router;

