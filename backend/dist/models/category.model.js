"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const connection_1 = require("../db/connection");
exports.CategoryModel = {
    async getAll() {
        const res = await (0, connection_1.query)("SELECT * FROM categories ORDER BY name ASC");
        return res.rows;
    },
    async getById(id) {
        const res = await (0, connection_1.query)("SELECT * FROM categories WHERE id = $1", [id]);
        return res.rows[0] || null;
    },
    async getBySlug(slug) {
        const res = await (0, connection_1.query)("SELECT * FROM categories WHERE slug = $1", [slug]);
        return res.rows[0] || null;
    },
    async create(name, slug) {
        const cleanSlug = slug.toLowerCase().trim();
        const res = await (0, connection_1.query)("INSERT INTO categories (name, slug) VALUES ($1, $2)", [name, cleanSlug]);
        const newId = res.insertId || 0;
        const item = await this.getById(newId);
        if (!item) {
            throw new Error("Failed to create category");
        }
        return item;
    },
    async update(id, name, slug) {
        await (0, connection_1.query)("UPDATE categories SET name = $1, slug = $2 WHERE id = $3", [name, slug.toLowerCase().trim(), id]);
        return this.getById(id);
    },
    async delete(id) {
        const res = await (0, connection_1.query)("DELETE FROM categories WHERE id = $1", [id]);
        return res.rowCount > 0;
    }
};
