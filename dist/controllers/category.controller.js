"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = exports.CategorySchema = void 0;
const zod_1 = require("zod");
const category_model_1 = require("../models/category.model");
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Category name is required." }),
    slug: zod_1.z.string().min(1, { message: "Slug is required." }),
});
exports.CategoryController = {
    async getAll(req, res) {
        try {
            const categories = await category_model_1.CategoryModel.getAll();
            return res.json(categories);
        }
        catch (err) {
            console.error("GET_CATEGORIES_ERR:", err);
            return res.status(500).json({ error: "Failed to retrieve categories." });
        }
    },
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid category ID parameter." });
            }
            const category = await category_model_1.CategoryModel.getById(id);
            if (!category) {
                return res.status(404).json({ error: "Category not found." });
            }
            return res.json(category);
        }
        catch (err) {
            console.error("GET_CATEGORY_ID_ERR:", err);
            return res.status(500).json({ error: "Failed to fetch category details." });
        }
    },
    async create(req, res) {
        try {
            const { name, slug } = req.body;
            // Check unique slug
            const existing = await category_model_1.CategoryModel.getBySlug(slug);
            if (existing) {
                return res.status(400).json({ error: "A category with this URL slug already exists." });
            }
            const category = await category_model_1.CategoryModel.create(name, slug);
            return res.status(201).json(category);
        }
        catch (err) {
            console.error("CREATE_CATEGORY_ERR:", err);
            return res.status(500).json({ error: "Failed to create category." });
        }
    },
    async update(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid category ID." });
            }
            const { name, slug } = req.body;
            // Check duplicate slug for another category
            const existing = await category_model_1.CategoryModel.getBySlug(slug);
            if (existing && existing.id !== id) {
                return res.status(400).json({ error: "A category with this URL slug already exists." });
            }
            const updated = await category_model_1.CategoryModel.update(id, name, slug);
            if (!updated) {
                return res.status(404).json({ error: "Category not found for update." });
            }
            return res.json(updated);
        }
        catch (err) {
            console.error("UPDATE_CATEGORY_ERR:", err);
            return res.status(500).json({ error: "Failed to update category." });
        }
    },
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: "Invalid category ID." });
            }
            const success = await category_model_1.CategoryModel.delete(id);
            if (!success) {
                return res.status(404).json({ error: "Category not found or already deleted." });
            }
            return res.json({ message: "Category deleted successfully." });
        }
        catch (err) {
            console.error("DELETE_CATEGORY_ERR:", err);
            return res.status(500).json({ error: "Failed to delete category." });
        }
    }
};
