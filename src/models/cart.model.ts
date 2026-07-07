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
      WHERE ci.user_id = ?
      ORDER BY ci.created_at ASC
    `;

    // Double-cast through unknown to override strict type overlap rules
    const rows = (await query<any>(sql, [userId])) as unknown as any[];
    return rows || [];
  },

  async addItem(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const sql = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + ?
    `;

    // We pass quantity twice because we have 4 total '?' placeholders
    await query(sql, [userId, productId, quantity, quantity]);

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

    const rows = (await query<any>(fetchSql, [userId, productId])) as unknown as any[];
    return rows[0];
  },

  async updateQuantity(itemId: number, userId: number, quantity: number): Promise<CartItem | null> {
    const sql = `
      UPDATE cart_items
      SET quantity = ?
      WHERE id = ? AND user_id = ?
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
      WHERE ci.id = ? AND ci.user_id = ?
    `;

    const rows = (await query<any>(fetchSql, [itemId, userId])) as unknown as any[];
    return rows[0] || null;
  },

  async removeItem(itemId: number, userId: number): Promise<boolean> {
    const sql = `
      DELETE FROM cart_items
      WHERE id = ? AND user_id = ?
    `;

    const result = (await query<any>(sql, [itemId, userId])) as unknown as any;
    return result && result.affectedRows > 0;
  },

  async clearCart(userId: number): Promise<void> {
    await query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
  }
};
