// api/src/routes/aiFriendRoutes.ts
import { Router } from "express";
import {
  getAIFriendSettings,
  updateAIFriendSettings,
  sendMessageToAIFriend,
  getChatHistory,
} from "../controllers/aiFriendController.js";
import { requireAuth, requireParent } from "../middleware/auth.js";

const router = Router();

// Settings routes (parent only)
router.get("/settings/:childId", requireAuth, requireParent, getAIFriendSettings);
router.put("/settings/:childId", requireAuth, requireParent, updateAIFriendSettings);

// Chat routes (child can use, but parent can also view)
router.post("/chat/:childId", requireAuth, sendMessageToAIFriend);
router.get("/chat/:childId/history", requireAuth, getChatHistory);

export default router;

