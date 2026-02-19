// api/src/routes/childRoutes.ts
import { Router } from "express";
import {
  createChild,
  getChildren,
  getChild,
  updateChild,
  deleteChild,
  verifyChildPin,
} from "../controllers/childController.js";
import { requireAuth, requireParent } from "../middleware/auth.js";

const router = Router();

// All routes require authentication as parent
router.post("/", requireAuth, requireParent, createChild);
router.get("/", requireAuth, requireParent, getChildren);
router.get("/:id", requireAuth, requireParent, getChild);
router.patch("/:id", requireAuth, requireParent, updateChild);
router.delete("/:id", requireAuth, requireParent, deleteChild);

// PIN verification for child mode (public - no auth required)
router.post("/:id/verify-pin", verifyChildPin);

export default router;

