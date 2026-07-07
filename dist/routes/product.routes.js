"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", product_controller_1.ProductController.getAll);
router.get("/:idOrSlug", product_controller_1.ProductController.getByIdOrSlug);
// Admin-protected product modification routes. Supporting multiple files upload named 'images'.
router.post("/", auth_1.requireAdmin, product_controller_1.productUpload.array("images", 5), product_controller_1.ProductController.create);
router.put("/:id", auth_1.requireAdmin, product_controller_1.productUpload.array("images", 5), product_controller_1.ProductController.update);
router.delete("/:id", auth_1.requireAdmin, product_controller_1.ProductController.delete);
exports.default = router;
