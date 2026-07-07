"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const connection_1 = require("../db/connection");
exports.ReviewModel = {
    async getByProductId(productId) {
        const sql = `
      SELECT r.*, u.email as user_email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `;
        const res = await (0, connection_1.query)(sql, [productId]);
        return res.rows;
    },
    /**
     * Check if a user has completed purchase for a given product
     */
    async hasPurchasedProduct(userId, productId) {
        const sql = `
      SELECT COUNT(oi.id) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1 AND oi.product_id = $2
    `;
        const res = await (0, connection_1.query)(sql, [userId, productId]);
        const purchaseCount = parseInt(res.rows[0]?.count || "0", 10);
        return purchaseCount > 0;
    },
    async create(userId, productId, rating, comment) {
        const sql = `
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON DUPLICATE KEY UPDATE rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP
    `;
        await (0, connection_1.query)(sql, [userId, productId, rating, comment]);
        const fetchSql = `
      SELECT r.*, u.email as user_email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = $1 AND r.product_id = $2
    `;
        const res = await (0, connection_1.query)(fetchSql, [userId, productId]);
        return res.rows[0];
    },
    async delete(id, userId) {
        const sql = `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2
    `;
        const res = await (0, connection_1.query)(sql, [id, userId]);
        return res.rowCount > 0;
    }
};
