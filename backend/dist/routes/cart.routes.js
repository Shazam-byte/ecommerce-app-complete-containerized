"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth); // All shopping cart operations mandate login session
router.get("/", cart_controller_1.CartController.getCart);
router.post("/", (0, validation_1.validateBody)(cart_controller_1.CartAddSchema), cart_controller_1.CartController.addItem);
router.put("/:itemId", (0, validation_1.validateBody)(cart_controller_1.CartQtySchema), cart_controller_1.CartController.updateQuantity);
router.delete("/:itemId", cart_controller_1.CartController.removeItem);
router.delete("/", cart_controller_1.CartController.clearCart);
exports.default = router;
