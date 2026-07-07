"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.orderRouter = router;
router.use(auth_1.requireAuth); // Placing and viewing orders strictly mandate customer account presence
router.get("/", order_controller_1.OrderController.getMyOrders);
router.get("/:id", order_controller_1.OrderController.getOrderById);
router.post("/", (0, validation_1.validateBody)(order_controller_1.CreateOrderSchema), order_controller_1.OrderController.placeOrder);
exports.default = router;
