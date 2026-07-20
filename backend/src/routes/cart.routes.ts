import { Router } from "express";
import { CartController, CartAddSchema, CartQtySchema } from "../controllers/cart.controller";
import { validateBody } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth); // All shopping cart operations mandate login session

router.get("/", CartController.getCart);
router.post("/", validateBody(CartAddSchema), CartController.addItem);
router.put("/:itemId", validateBody(CartQtySchema), CartController.updateQuantity);
router.delete("/:itemId", CartController.removeItem);
router.delete("/", CartController.clearCart);

export default router;
