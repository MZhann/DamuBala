// api/src/routes/analyticsRoutes.ts
import { Router } from "express";
import { getAnalyticsSummary, getRecommendations, } from "../controllers/analyticsController.js";
import { requireAuth, requireParent } from "../middleware/auth.js";
const router = Router();
// All analytics routes require parent authentication
router.get("/summary/:childId", requireAuth, requireParent, getAnalyticsSummary);
router.get("/recommendations/:childId", requireAuth, requireParent, getRecommendations);
export default router;
//# sourceMappingURL=analyticsRoutes.js.map