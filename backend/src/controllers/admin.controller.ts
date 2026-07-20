import { Response } from "express";
import { z } from "zod";
import { query } from "../db/connection";
import { OrderModel } from "../models/order.model";
import { AuthenticatedRequest } from "../middleware/auth";

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["pending", "shipped", "delivered"], {
    message: "Status must be 'pending', 'shipped', or 'delivered'.",
  }),
});

export const AdminController = {
  /**
   * Retrieve all global orders for admin fulfillment
   */
  async getGlobalOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const orders = await OrderModel.getAll();
      return res.json(orders);
    } catch (err: any) {
      console.error("GET_GLOBAL_ORDERS_ERR:", err);
      return res.status(500).json({ error: "Failed to download global orders list." });
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID." });
      }

      const { status } = req.body;

      const updated = await OrderModel.updateStatus(orderId, status);
      if (!updated) {
        return res.status(404).json({ error: "Order record not found." });
      }

      return res.json({
        message: `Order status upgraded to '${status}' successfully.`,
        order: updated,
      });
    } catch (err: any) {
      console.error("UPDATE_ORDER_STATUS_ERR:", err);
      return res.status(500).json({ error: "Failed to update order status." });
    }
  },

  /**
   * Analytical statistics helper to populate charts and summaries
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      const salesQuery = await query("SELECT SUM(total_amount) as revenue, COUNT(id) as ord_count FROM orders");
      const productsQuery = await query("SELECT COUNT(id) as count FROM products");
      const usersQuery = await query("SELECT COUNT(id) as count FROM users");
      const categorySalesQuery = await query(`
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
    } catch (err: any) {
      console.error("GET_DASHBOARD_STATS_ERR:", err);
      return res.status(500).json({ error: "Failed to fetch dashboard analytical statistics." });
    }
  }
};
