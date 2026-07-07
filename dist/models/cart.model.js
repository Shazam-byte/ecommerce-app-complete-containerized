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
             p.images as product_images,
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at ASC
    `;
        // Double-cast through unknown to override strict type overlap rules
        const rows = (await (0, connection_1.query)(sql, [userId]));
        return rows || [];
    },
    async addItem(userId, productId, quantity) {
        const sql = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + ?
    `;
        // We pass quantity twice because we have 4 total '?' placeholders
        await (0, connection_1.query)(sql, [userId, productId, quantity, quantity]);
        const fetchSql = `
      SELECT ci.*,
             p.name as product_name,
             p.price as product_price,
             p.images as product_images,
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND ci.product_id = ?
    `;
        const rows = (await (0, connection_1.query)(fetchSql, [userId, productId]));
        return rows[0];
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
