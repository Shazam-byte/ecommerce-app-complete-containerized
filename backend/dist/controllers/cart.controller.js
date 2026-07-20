"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = exports.CartQtySchema = exports.CartAddSchema = void 0;
const zod_1 = require("zod");
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../models/product.model");
exports.CartAddSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive({ message: "Product ID must be specified." }),
    quantity: zod_1.z.number().int().positive({ message: "Quantity must be at least 1." }),
});
exports.CartQtySchema = zod_1.z.object({
    quantity: zod_1.z.number().int().positive({ message: "Quantity must be at least 1." }),
});
exports.CartController = {
    /**
     * Get active cart for current authenticated session
     */
    async getCart(req, res) {
        try {
            const userId = req.user.userId;
            const items = await cart_model_1.CartModel.getByUserId(userId);
            return res.json(items);
        }
        catch (err) {
            console.error("GET_CART_ERR:", err);
            return res.status(500).json({ error: "Failed to download your shopping cart." });
        }
    },
    /**
     * Append a catalog line to the persistent customer cart
     */
    async addItem(req, res) {
        try {
            const userId = req.user.userId;
            const { productId, quantity } = req.body;
            // Verify product exists and check stock limits
            const product = await product_model_1.ProductModel.getById(productId);
            if (!product) {
                return res.status(404).json({ error: "Product not found." });
            }
            if (product.stock < quantity) {
                return res.status(400).json({
                    error: `Insufficient stock. Only ${product.stock} items remaining.`,
                    code: "OUT_OF_STOCK"
                });
            }
            const item = await cart_model_1.CartModel.addItem(userId, productId, quantity);
            // DEBUG: This will print out exactly what is going to the frontend
            console.log("=== DEBUG ADD ITEM RESPONSE ===", item);
            return res.status(201).json(item);
        }
        catch (err) {
            console.error("ADD_CART_ERR:", err);
            return res.status(500).json({ error: "Failed to add product to catalog cart." });
        }
    },
    /**
     * Change quantity count on cart item
     */
    async updateQuantity(req, res) {
        try {
            const userId = req.user.userId;
            const itemId = parseInt(req.params.itemId, 10);
            const { quantity } = req.body;
            if (isNaN(itemId)) {
                return res.status(400).json({ error: "Invalid cart item ID." });
            }
            // Get item to find product ID
            const cartItems = await cart_model_1.CartModel.getByUserId(userId);
            const match = cartItems.find((ci) => ci.id === itemId);
            if (!match) {
                return res.status(404).json({ error: "Cart item not found in your account." });
            }
            // Check current physical stock
            const product = await product_model_1.ProductModel.getById(match.product_id);
            if (product && product.stock < quantity) {
                return res.status(400).json({
                    error: `Cannot update quantity. Only ${product.stock} items available in stock.`,
                    code: "OUT_OF_STOCK"
                });
            }
            const updated = await cart_model_1.CartModel.updateQuantity(itemId, userId, quantity);
            return res.json(updated);
        }
        catch (err) {
            console.error("UPDATE_CART_QTY_ERR:", err);
            return res.status(500).json({ error: "Failed to adjust cart element quantity." });
        }
    },
    /**
     * Remove a single entry by ID
     */
    async removeItem(req, res) {
        try {
            const userId = req.user.userId;
            const itemId = parseInt(req.params.itemId, 10);
            if (isNaN(itemId)) {
                return res.status(400).json({ error: "Invalid cart item ID." });
            }
            const success = await cart_model_1.CartModel.removeItem(itemId, userId);
            if (!success) {
                return res.status(404).json({ error: "Cart item not found or unauthorized deletion." });
            }
            return res.json({ message: "Product deleted from cart successfully." });
        }
        catch (err) {
            console.error("REMOVE_CART_ITEM_ERR:", err);
            return res.status(500).json({ error: "Failed to delete item from details." });
        }
    },
    /**
     * Clear user's entire cart
     */
    async clearCart(req, res) {
        try {
            const userId = req.user.userId;
            await cart_model_1.CartModel.clearCart(userId);
            return res.json({ message: "Cart emptied successfully." });
        }
        catch (err) {
            console.error("CLEAR_CART_ERR:", err);
            return res.status(500).json({ error: "Failed to empty user cart." });
        }
    }
};
