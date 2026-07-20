"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", category_controller_1.CategoryController.getAll);
router.get("/:id", category_controller_1.CategoryController.getById);
// Admin-secured modification routes
router.post("/", auth_1.requireAdmin, (0, validation_1.validateBody)(category_controller_1.CategorySchema), category_controller_1.CategoryController.create);
router.put("/:id", auth_1.requireAdmin, (0, validation_1.validateBody)(category_controller_1.CategorySchema), category_controller_1.CategoryController.update);
router.delete("/:id", auth_1.requireAdmin, category_controller_1.CategoryController.delete);
exports.default = router;
