"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = exports.UpdateOrderStatusSchema = void 0;
const zod_1 = require("zod");
const connection_1 = require("../db/connection");
const order_model_1 = require("../models/order.model");
exports.UpdateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "shipped", "delivered"], {
        message: "Status must be 'pending', 'shipped', or 'delivered'.",
    }),
});
exports.AdminController = {
    /**
     * Retrieve all global orders for admin fulfillment
     */
    async getGlobalOrders(req, res) {
        try {
            const orders = await order_model_1.OrderModel.getAll();
            return res.json(orders);
        }
        catch (err) {
            console.error("GET_GLOBAL_ORDERS_ERR:", err);
            return res.status(500).json({ error: "Failed to download global orders list." });
        }
    },
    /**
     * Update order status
     */
    async updateOrderStatus(req, res) {
        try {
            const orderId = parseInt(req.params.id, 10);
            if (isNaN(orderId)) {
                return res.status(400).json({ error: "Invalid order ID." });
            }
            const { status } = req.body;
            const updated = await order_model_1.OrderModel.updateStatus(orderId, status);
            if (!updated) {
                return res.status(404).json({ error: "Order record not found." });
            }
            return res.json({
                message: `Order status upgraded to '${status}' successfully.`,
                order: updated,
            });
        }
        catch (err) {
            console.error("UPDATE_ORDER_STATUS_ERR:", err);
            return res.status(500).json({ error: "Failed to update order status." });
        }
    },
    /**
     * Analytical statistics helper to populate charts and summaries
     */
    async getDashboardStats(req, res) {
        try {
            const salesQuery = await (0, connection_1.query)("SELECT SUM(total_amount) as revenue, COUNT(id) as ord_count FROM orders");
            const productsQuery = await (0, connection_1.query)("SELECT COUNT(id) as count FROM products");
            const usersQuery = await (0, connection_1.query)("SELECT COUNT(id) as count FROM users");
            const categorySalesQuery = await (0, connection_1.query)(`
         SELECT c.name as category_name, SUM(oi.product_price * oi.quantity) as sales
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN categories c ON p.category_id = c.id
         GROUP BY c.name
      `);
            const totalRevenue = parseFloat(salesQuery.rows[0]?.revenue || "0");
            const totalOrders = parseInt(salesQuery.rows[0]?.ord_count || "0", 10);
            const totalProducts = parseInt(productsQuery.rows[0]?.count || "0", 10);
            const totalUsers = parseInt(usersQuery.rows[0]?.count || "0", 10);
            return res.json({
                statistics: {
                    totalRevenue,
                    totalOrders,
                    totalProducts,
                    totalUsers,
                },
                categoryMetrics: categorySalesQuery.rows,
            });
        }
        catch (err) {
            console.error("GET_DASHBOARD_STATS_ERR:", err);
            return res.status(500).json({ error: "Failed to fetch dashboard analytical statistics." });
        }
    }
};
