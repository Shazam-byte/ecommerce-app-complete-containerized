"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdmin); // This entire routing system requires top-level admin credentials
router.get("/orders", admin_controller_1.AdminController.getGlobalOrders);
router.put("/orders/:id", (0, validation_1.validateBody)(admin_controller_1.UpdateOrderStatusSchema), admin_controller_1.AdminController.updateOrderStatus);
router.get("/stats", admin_controller_1.AdminController.getDashboardStats);
exports.default = router;
