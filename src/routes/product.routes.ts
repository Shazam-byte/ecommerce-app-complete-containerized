import { Router } from "express";
import { ProductController, productUpload } from "../controllers/product.controller";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", ProductController.getAll);
router.get("/:idOrSlug", ProductController.getByIdOrSlug);

// Admin-protected product modification routes. Supporting multiple files upload named 'images'.
router.post("/", requireAdmin, productUpload.array("images", 5), ProductController.create);
router.put("/:id", requireAdmin, productUpload.array("images", 5), ProductController.update);
router.delete("/:id", requireAdmin, ProductController.delete);

export default router;
