import { query } from "../db/connection";

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product_name?: string;
  product_price?: number;
  product_images?: string; // JSON array string
  product_stock?: number;
  created_at?: Date;
}

export const CartModel = {
  async getByUserId(userId: number): Promise<CartItem[]> {
    const sql = `
      SELECT ci.*, 
             p.name as product_name, 
             p.price as product_price, 
             p.images as product_images, 
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at ASC
    `;
    const res = await query<CartItem>(sql, [userId]);
    return res.rows;
  },

  async addItem(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const sql = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON DUPLICATE KEY UPDATE quantity = quantity + $3
    `;
    await query(sql, [userId, productId, quantity]);
    const fetchSql = `
      SELECT ci.*, 
             p.name as product_name, 
             p.price as product_price, 
             p.images as product_images, 
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND ci.product_id = $2
    `;
    const res = await query<CartItem>(fetchSql, [userId, productId]);
    return res.rows[0];
  },

  async updateQuantity(itemId: number, userId: number, quantity: number): Promise<CartItem | null> {
    const sql = `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2 AND user_id = $3
    `;
    await query(sql, [quantity, itemId, userId]);
    const fetchSql = `
      SELECT ci.*, 
             p.name as product_name, 
             p.price as product_price, 
             p.images as product_images, 
             p.stock as product_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = $1 AND ci.user_id = $2
    `;
    const res = await query<CartItem>(fetchSql, [itemId, userId]);
    return res.rows[0] || null;
  },

  async removeItem(itemId: number, userId: number): Promise<boolean> {
    const sql = `
      DELETE FROM cart_items
      WHERE id = $1 AND user_id = $2
    `;
    const res = await query(sql, [itemId, userId]);
    return res.rowCount > 0;
  },

  async clearCart(userId: number): Promise<void> {
    await query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
  }
};
