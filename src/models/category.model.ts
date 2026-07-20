import { query } from "../db/connection";

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at?: Date;
}

export const CategoryModel = {
  async getAll(): Promise<Category[]> {
    const res = await query<Category>("SELECT * FROM categories ORDER BY name ASC");
    return res.rows;
  },

  async getById(id: number): Promise<Category | null> {
    const res = await query<Category>("SELECT * FROM categories WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  async getBySlug(slug: string): Promise<Category | null> {
    const res = await query<Category>("SELECT * FROM categories WHERE slug = $1", [slug]);
    return res.rows[0] || null;
  },

  async create(name: string, slug: string): Promise<Category> {
    const cleanSlug = slug.toLowerCase().trim();
    const res = await query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2)",
      [name, cleanSlug]
    );
    const newId = res.insertId || 0;
    const item = await this.getById(newId);
    if (!item) {
      throw new Error("Failed to create category");
    }
    return item;
  },

  async update(id: number, name: string, slug: string): Promise<Category | null> {
    await query(
      "UPDATE categories SET name = $1, slug = $2 WHERE id = $3",
      [name, slug.toLowerCase().trim(), id]
    );
    return this.getById(id);
  },

  async delete(id: number): Promise<boolean> {
    const res = await query("DELETE FROM categories WHERE id = $1", [id]);
    return res.rowCount > 0;
  }
};
