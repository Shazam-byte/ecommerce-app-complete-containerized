"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const connection_1 = require("../db/connection");
exports.OrderModel = {
    async getByUserId(userId) {
        const sql = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
        const res = await (0, connection_1.query)(sql, [userId]);
        return res.rows;
    },
    async getAll() {
        const sql = `
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;
        const res = await (0, connection_1.query)(sql);
        return res.rows;
    },
    async getById(id, userId) {
        const params = [id];
        let sql = `SELECT * FROM orders WHERE id = $1`;
        if (userId !== undefined) {
            params.push(userId);
            sql += ` AND user_id = $2`;
        }
        const res = await (0, connection_1.query)(sql, params);
        const order = res.rows[0];
        if (!order)
            return null;
        // Fetch items associated with the order
        const itemsRes = await (0, connection_1.query)(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`, [order.id]);
        order.items = itemsRes.rows;
        return order;
    },
    /**
     * Complex Transaction-like Order Placement with inventory updates
     */
    async create(userId, shippingAddress, totalAmount, items) {
        // Generate order number
        const ordNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        // Create the master order record
        const orderRes = await (0, connection_1.query)(`INSERT INTO orders (user_id, order_number, total_amount, shipping_address, status, payment_status)
       VALUES ($1, $2, $3, $4, 'pending', 'paid')`, [userId, ordNumber, totalAmount, shippingAddress]);
        const orderId = orderRes.insertId || 0;
        const fetchOrderRes = await (0, connection_1.query)(`SELECT * FROM orders WHERE id = $1`, [orderId]);
        const order = fetchOrderRes.rows[0];
        // Create the order items and commit inventory reductions
        for (const item of items) {
            // 1. Snapshot into order_items
            await (0, connection_1.query)(`INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`, [order.id, item.productId, item.name, item.price, item.quantity]);
            // 2. Decrement physical inventory
            await (0, connection_1.query)(`UPDATE products 
         SET stock = stock - $1 
         WHERE id = $2 AND stock >= $1`, [item.quantity, item.productId]);
        }
        // Attach order items list
        const itemsRes = await (0, connection_1.query)(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
        order.items = itemsRes.rows;
        return order;
    },
    async updateStatus(id, status) {
        const sql = `
      UPDATE orders
      SET status = $1
      WHERE id = $2
    `;
        await (0, connection_1.query)(sql, [status, id]);
        return this.getById(id);
    }
};
