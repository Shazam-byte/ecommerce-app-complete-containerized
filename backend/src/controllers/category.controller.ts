import { Request, Response } from "express";
import { z } from "zod";
import { CategoryModel } from "../models/category.model";

export const CategorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required." }),
  slug: z.string().min(1, { message: "Slug is required." }),
});

export const CategoryController = {
  async getAll(req: Request, res: Response) {
    try {
      const categories = await CategoryModel.getAll();
      return res.json(categories);
    } catch (err) {
      console.error("GET_CATEGORIES_ERR:", err);
      return res.status(500).json({ error: "Failed to retrieve categories." });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID parameter." });
      }

      const category = await CategoryModel.getById(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found." });
      }

      return res.json(category);
    } catch (err) {
      console.error("GET_CATEGORY_ID_ERR:", err);
      return res.status(500).json({ error: "Failed to fetch category details." });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, slug } = req.body;

      // Check unique slug
      const existing = await CategoryModel.getBySlug(slug);
      if (existing) {
        return res.status(400).json({ error: "A category with this URL slug already exists." });
      }

      const category = await CategoryModel.create(name, slug);
      return res.status(201).json(category);
    } catch (err) {
      console.error("CREATE_CATEGORY_ERR:", err);
      return res.status(500).json({ error: "Failed to create category." });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID." });
      }

      const { name, slug } = req.body;

      // Check duplicate slug for another category
      const existing = await CategoryModel.getBySlug(slug);
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: "A category with this URL slug already exists." });
      }

      const updated = await CategoryModel.update(id, name, slug);
      if (!updated) {
        return res.status(404).json({ error: "Category not found for update." });
      }

      return res.json(updated);
    } catch (err) {
      console.error("UPDATE_CATEGORY_ERR:", err);
      return res.status(500).json({ error: "Failed to update category." });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID." });
      }

      const success = await CategoryModel.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Category not found or already deleted." });
      }

      return res.json({ message: "Category deleted successfully." });
    } catch (err) {
      console.error("DELETE_CATEGORY_ERR:", err);
      return res.status(500).json({ error: "Failed to delete category." });
    }
  }
};
