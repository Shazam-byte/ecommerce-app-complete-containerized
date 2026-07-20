import { Router } from "express";
import { CategoryController, CategorySchema } from "../controllers/category.controller";
import { validateBody } from "../middleware/validation";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);

// Admin-secured modification routes
router.post("/", requireAdmin, validateBody(CategorySchema), CategoryController.create);
router.put("/:id", requireAdmin, validateBody(CategorySchema), CategoryController.update);
router.delete("/:id", requireAdmin, CategoryController.delete);

export default router;
