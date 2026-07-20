"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const connection_1 = require("../db/connection");
exports.CartModel = {
    async getByUserId(userId) {
        const sql = `
      SELECT ci.*, 
             p.name as product_name, 
             p.price as product_price, 
             p.images as product_images
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
        // Explicitly double-cast the database driver response array
        const result = (await (0, connection_1.query)(sql, [userId]));
        // Return the clean rows array or an empty fallback list
        return result || [];
    },
    async addItem(userId, productId, quantity) {
        // 1. Run the upsert query
        const sql = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + ?
    `;
        await (0, connection_1.query)(sql, [userId, productId, quantity, quantity]);
        try {
            // 2. Try to fetch the full updated item with product details for the frontend
            const fetchSql = `
        SELECT ci.*, 
               p.name as product_name, 
               p.price as product_price, 
               p.images as product_images
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ? AND ci.product_id = ?
      `;
            const rows = (await (0, connection_1.query)(fetchSql, [userId, productId]));
            // 3. If found, return it cleanly
            if (rows && rows.length > 0) {
                return rows[0];
            }
        }
        catch (fetchErr) {
            console.error("FETCH_AFTER_ADD_ERR:", fetchErr);
        }
        // 4. CRITICAL FALLBACK: If the SELECT query comes up empty or errors, 
        // return a mocked object so the frontend gets valid JSON and never panics!
        return {
            user_id: userId,
            product_id: productId,
            quantity: quantity,
            message: "Success"
        };
    },
    async updateQuantity(itemId, userId, quantity) {
        const sql = `
      UPDATE cart_items
      SET quantity = ?
      WHERE id = ? AND user_id = ?
    `;
        await (0, connection_1.query)(sql, [quantity, itemId, userId]);
        const fetchSql = `
      SELECT ci.*,
             p.name as product_name,
             p.price as product_price,
             p.images as product_images,
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND ci.user_id = ?
    `;
        const rows = (await (0, connection_1.query)(fetchSql, [itemId, userId]));
        return rows[0] || null;
    },
    async removeItem(itemId, userId) {
        const sql = `
      DELETE FROM cart_items
      WHERE id = ? AND user_id = ?
    `;
        const result = (await (0, connection_1.query)(sql, [itemId, userId]));
        return result && result.affectedRows > 0;
    },
    async clearCart(userId) {
        await (0, connection_1.query)("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    }
};
