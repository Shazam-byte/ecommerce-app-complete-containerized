import { Router } from "express";
import { ReviewController, ReviewCreateSchema } from "../controllers/review.controller";
import { validateBody } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/product/:productId", ReviewController.getByProduct);
router.post("/", requireAuth, validateBody(ReviewCreateSchema), ReviewController.writeReview);

export default router;
