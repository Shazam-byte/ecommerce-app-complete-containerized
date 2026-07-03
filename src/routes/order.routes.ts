import { Router } from "express";
import { OrderController, CreateOrderSchema } from "../controllers/order.controller";
import { validateBody } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // Placing and viewing orders strictly mandate customer account presence

router.get("/", OrderController.getMyOrders);
router.get("/:id", OrderController.getOrderById);
router.post("/", validateBody(CreateOrderSchema), OrderController.placeOrder);

export default router;
export { router as orderRouter };
