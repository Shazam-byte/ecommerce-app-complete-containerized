import { Response } from "express";
import { z } from "zod";
import { OrderModel } from "../models/order.model";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateOrderSchema = z.object({
  shippingAddress: z.string().min(10, { message: "Shipping address must be a complete, descriptive address (min 10 characters)." }),
});

export const OrderController = {
  /**
   * Fetch orders for current authenticated consumer
   */
  async getMyOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const orders = await OrderModel.getByUserId(userId);
      return res.json(orders);
    } catch (err: any) {
      console.error("GET_MY_ORDERS_ERR:", err);
      return res.status(500).json({ error: "Failed to fetch purchase histories." });
    }
  },

  /**
   * Fetch single order by ID
   */
  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const orderId = parseInt(req.params.id, 10);

      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID." });
      }

      const order = await OrderModel.getById(orderId, userId);
      if (!order) {
        return res.status(404).json({ error: "Order record not found." });
      }

      return res.json(order);
    } catch (err: any) {
      console.error("GET_ORDER_DETAIL_ERR:", err);
      return res.status(500).json({ error: "Failed to download order details." });
    }
  },

  /**
   * Place Order: Convert cart to order, enforce stock checks, update inventory, and clear cart
   */
  async placeOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { shippingAddress } = req.body;

      // 1. Fetch user's cart
      const cartItems = await CartModel.getByUserId(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({
          error: "Your shopping cart is empty.",
          code: "EMPTY_CART",
        });
      }

      // 2. Validate current stock levels for each cart line
      const checkedItems: Array<{ productId: number; name: string; price: number; quantity: number }> = [];
      let totalAmount = 0;

      for (const item of cartItems) {
        const product = await ProductModel.getById(item.product_id);
        if (!product) {
          return res.status(400).json({
            error: `Product '${item.product_name}' was not found in the catalog.`,
            code: "PRODUCT_MISSING",
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Cannot checkout. '${product.name}' has only ${product.stock} items remaining in stock.`,
            code: "OUT_OF_STOCK",
            details: {
              productId: product.id,
              productName: product.name,
              requested: item.quantity,
              available: product.stock,
            },
          });
        }

        checkedItems.push({
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: item.quantity,
        });

        totalAmount += Number(product.price) * item.quantity;
      }

      // 3. Create order, save order_items, and update product stocks
      const order = await OrderModel.create(userId, shippingAddress, totalAmount, checkedItems);

      // 4. Clear user's shopping cart upon successful creation
      await CartModel.clearCart(userId);

      return res.status(201).json({
        message: "Order placed and mock payment simulated successfully.",
        order,
      });
    } catch (err: any) {
      console.error("CHECKOUT_ERR:", err);
      return res.status(500).json({ error: "Failed to complete order checkout process." });
    }
  }
};
