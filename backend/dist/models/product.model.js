"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const connection_1 = require("../db/connection");
exports.ProductModel = {
    async findFiltered(options) {
        const { categorySlug, minPrice, maxPrice, search, limit = 12, offset = 0 } = options;
        const conditions = [];
        const params = [];
        if (categorySlug) {
            params.push(categorySlug);
            conditions.push(`c.slug = $${params.length}`);
        }
        if (minPrice !== undefined) {
            params.push(minPrice);
            conditions.push(`p.price >= $${params.length}`);
        }
        if (maxPrice !== undefined) {
            params.push(maxPrice);
            conditions.push(`p.price <= $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`p.name ILIKE $${params.length}`);
        }
        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = "WHERE " + conditions.join(" AND ");
        }
        const sql = `
      SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereClause}
      GROUP BY p.id, c.name
      ORDER BY p.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        const queryParams = [...params, limit, offset];
        const res = await (0, connection_1.query)(sql, queryParams);
        return res.rows;
    },
    async countFiltered(options) {
        const { categorySlug, minPrice, maxPrice, search } = options;
        const conditions = [];
        const params = [];
        if (categorySlug) {
            params.push(categorySlug);
            conditions.push(`c.slug = $${params.length}`);
        }
        if (minPrice !== undefined) {
            params.push(minPrice);
            conditions.push(`p.price >= $${params.length}`);
        }
        if (maxPrice !== undefined) {
            params.push(maxPrice);
            conditions.push(`p.price <= $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`p.name ILIKE $${params.length}`);
        }
        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = "WHERE " + conditions.join(" AND ");
        }
        const sql = `
      SELECT COUNT(DISTINCT p.id) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
        const res = await (0, connection_1.query)(sql, params);
        return parseInt(res.rows[0]?.count || "0", 10);
    },
    async getById(id) {
        const sql = `
      SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `;
        const res = await (0, connection_1.query)(sql, [id]);
        return res.rows[0] || null;
    },
    async getBySlug(slug) {
        const sql = `
      SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.slug = $1
      GROUP BY p.id, c.name
    `;
        const res = await (0, connection_1.query)(sql, [slug]);
        return res.rows[0] || null;
    },
    async getRelatedProducts(categoryId, currentProductId, limit = 4) {
        const sql = `
      SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.category_id = $1 AND p.id != $2
      GROUP BY p.id, c.name
      LIMIT $3
    `;
        const res = await (0, connection_1.query)(sql, [categoryId, currentProductId, limit]);
        return res.rows;
    },
    async create(product) {
        const sql = `
      INSERT INTO products (category_id, name, slug, description, price, stock, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
        const res = await (0, connection_1.query)(sql, [
            product.category_id,
            product.name,
            product.slug.toLowerCase().trim(),
            product.description,
            product.price,
            product.stock,
            product.images,
        ]);
        const newId = res.insertId || 0;
        const created = await this.getById(newId);
        if (!created) {
            throw new Error("Failed to create product");
        }
        return created;
    },
    async update(id, product) {
        const fields = [];
        const params = [];
        Object.entries(product).forEach(([key, val]) => {
            params.push(val);
            fields.push(`${key} = $${params.length}`);
        });
        if (fields.length === 0)
            return this.getById(id);
        params.push(id);
        const sql = `
      UPDATE products 
      SET ${fields.join(", ")} 
      WHERE id = $${params.length}
    `;
        await (0, connection_1.query)(sql, params);
        return this.getById(id);
    },
    async delete(id) {
        const res = await (0, connection_1.query)("DELETE FROM products WHERE id = $1", [id]);
        return res.rowCount > 0;
    },
    async decrementStock(id, quantity) {
        const sql = `
      UPDATE products 
      SET stock = stock - $1 
      WHERE id = $2 AND stock >= $1
    `;
        const res = await (0, connection_1.query)(sql, [quantity, id]);
        return res.rowCount > 0;
    }
};
