import { Router } from "express";
import { AdminController, UpdateOrderStatusSchema } from "../controllers/admin.controller";
import { validateBody } from "../middleware/validation";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAdmin); // This entire routing system requires top-level admin credentials

router.get("/orders", AdminController.getGlobalOrders);
router.put("/orders/:id", validateBody(UpdateOrderStatusSchema), AdminController.updateOrderStatus);
router.get("/stats", AdminController.getDashboardStats);

export default router;
