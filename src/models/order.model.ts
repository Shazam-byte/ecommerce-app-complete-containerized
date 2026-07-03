import { query } from "../db/connection";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  quantity: number;
  created_at?: Date;
}

export interface Order {
  id: number;
  user_id: number | null;
  order_number: string;
  total_amount: number;
  status: string; // 'pending', 'shipped', 'delivered'
  shipping_address: string;
  payment_status: string; // 'paid'
  created_at?: Date;
  items?: OrderItem[];
}

export const OrderModel = {
  async getByUserId(userId: number): Promise<Order[]> {
    const sql = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const res = await query<Order>(sql, [userId]);
    return res.rows;
  },

  async getAll(): Promise<Order[]> {
    const sql = `
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;
    const res = await query<Order>(sql);
    return res.rows;
  },

  async getById(id: number, userId?: number): Promise<Order | null> {
    const params: any[] = [id];
    let sql = `SELECT * FROM orders WHERE id = $1`;
    
    if (userId !== undefined) {
      params.push(userId);
      sql += ` AND user_id = $2`;
    }

    const res = await query<Order>(sql, params);
    const order = res.rows[0];

    if (!order) return null;

    // Fetch items associated with the order
    const itemsRes = await query<OrderItem>(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`, 
      [order.id]
    );
    order.items = itemsRes.rows;

    return order;
  },

  /**
   * Complex Transaction-like Order Placement with inventory updates
   */
  async create(
    userId: number, 
    shippingAddress: string, 
    totalAmount: number, 
    items: Array<{ productId: number; name: string; price: number; quantity: number }>
  ): Promise<Order> {
    // Generate order number
    const ordNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create the master order record
    const orderRes = await query(
      `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, status, payment_status)
       VALUES ($1, $2, $3, $4, 'pending', 'paid')`,
      [userId, ordNumber, totalAmount, shippingAddress]
    );
    const orderId = orderRes.insertId || 0;
    
    const fetchOrderRes = await query<Order>(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );
    const order = fetchOrderRes.rows[0];

    // Create the order items and commit inventory reductions
    for (const item of items) {
      // 1. Snapshot into order_items
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, item.name, item.price, item.quantity]
      );

      // 2. Decrement physical inventory
      await query(
        `UPDATE products 
         SET stock = stock - $1 
         WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.productId]
      );
    }

    // Attach order items list
    const itemsRes = await query<OrderItem>(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );
    order.items = itemsRes.rows;

    return order;
  },

  async updateStatus(id: number, status: string): Promise<Order | null> {
    const sql = `
      UPDATE orders
      SET status = $1
      WHERE id = $2
    `;
    await query(sql, [status, id]);
    return this.getById(id);
  }
};
