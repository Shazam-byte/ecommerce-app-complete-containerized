import { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { ProductModel } from "../models/product.model";
import { uploadImageToS3 } from "../config/s3";

// Set up memory storage for Multer
export const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const ProductCreateSchema = z.object({
  category_id: z.coerce.number().int({ message: "Category ID must be an integer." }),
  name: z.string().min(1, { message: "Product name is required." }),
  slug: z.string().min(1, { message: "Product slug is required." }),
  description: z.string().default(""),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  stock: z.coerce.number().nonnegative({ message: "Stock cannot be negative." }),
});

export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(12),
});

export const ProductController = {
  /**
   * Filtered list of products with pagination metadata
   */
  async getAll(req: Request, res: Response) {
    try {
      // Validate query inputs
      const queryValidation = ProductQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: "Invalid catalog search parameters.",
          details: queryValidation.error.flatten().fieldErrors,
        });
      }

      const { category, minPrice, maxPrice, search, page, limit } = queryValidation.data;
      const offset = (page - 1) * limit;

      const [products, total] = await Promise.all([
        ProductModel.findFiltered({
          categorySlug: category,
          minPrice,
          maxPrice,
          search,
          limit,
          offset,
        }),
        ProductModel.countFiltered({
          categorySlug: category,
          minPrice,
          maxPrice,
          search,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.json({
        products,
        pagination: {
          page,
          limit,
          totalProducts: total,
          totalPages,
        },
      });
    } catch (err: any) {
      console.error("GET_PRODUCTS_ERROR:", err);
      return res.status(500).json({ error: "Failed to load product catalog." });
    }
  },

  async getByIdOrSlug(req: Request, res: Response) {
    try {
      const identifier = req.params.idOrSlug;
      let product = null;

      if (/^\s*\d+\s*$/.test(identifier)) {
        product = await ProductModel.getById(parseInt(identifier, 10));
      } else {
        product = await ProductModel.getBySlug(identifier);
      }

      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      // Fetch related products (e.g., in same category, up to 4 items)
      const related = await ProductModel.getRelatedProducts(product.category_id, product.id, 4);

      return res.json({
        product,
        related,
      });
    } catch (err) {
      console.error("GET_PRODUCT_DETAIL_ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch product." });
    }
  },

  /**
   * Create product with image uploads processed through S3 or local disk fallback
   */
  async create(req: Request, res: Response) {
    try {
      // Validate string fields
      const validation = ProductCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Product fields validation failed.",
          details: validation.error.flatten().fieldErrors,
        });
      }

      const verifiedBody = validation.data;

      // Check unique slug
      const existing = await ProductModel.getBySlug(verifiedBody.slug);
      if (existing) {
        return res.status(400).json({ error: "A product with this URL slug already exists." });
      }

      const imageUrls: string[] = [];

      // Process uploaded image files if uploaded
      const files = req.files as Express.Multer.File[] || [];
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

      if (files && files.length > 0) {
        for (const file of files) {
          const url = await uploadImageToS3(file, appUrl);
          imageUrls.push(url);
        }
      } else if (req.body.existingImages) {
        // Fallback or administrator-provided string URLs
        const provided = Array.isArray(req.body.existingImages)
          ? req.body.existingImages
          : JSON.parse(req.body.existingImages);
        imageUrls.push(...provided);
      }

      // Default stock image if none supplied
      if (imageUrls.length === 0) {
        imageUrls.push("https://picsum.photos/600/400?random=default");
      }

      const product = await ProductModel.create({
        category_id: verifiedBody.category_id,
        name: verifiedBody.name,
        slug: verifiedBody.slug,
        description: verifiedBody.description,
        price: verifiedBody.price,
        stock: verifiedBody.stock,
        images: JSON.stringify(imageUrls),
      });

      return res.status(201).json(product);
    } catch (err: any) {
      console.error("CREATE_PRODUCT_ERROR:", err);
      return res.status(500).json({ error: "Failed to create catalog product." });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
      }

      // Validate the fields present
      const incoming = req.body;
      const patchData: any = {};

      if (incoming.category_id !== undefined) patchData.category_id = parseInt(incoming.category_id, 10);
      if (incoming.name !== undefined) patchData.name = incoming.name;
      if (incoming.slug !== undefined) patchData.slug = incoming.slug.toLowerCase().trim();
      if (incoming.description !== undefined) patchData.description = incoming.description;
      if (incoming.price !== undefined) patchData.price = parseFloat(incoming.price);
      if (incoming.stock !== undefined) patchData.stock = parseInt(incoming.stock, 10);

      if (incoming.existingImages) {
        const provided = Array.isArray(incoming.existingImages)
          ? incoming.existingImages
          : JSON.parse(incoming.existingImages);
        patchData.images = JSON.stringify(provided);
      }

      // Process new files if appended
      const files = req.files as Express.Multer.File[] || [];
      if (files && files.length > 0) {
        const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
        const newUrls: string[] = [];
        for (const file of files) {
          const url = await uploadImageToS3(file, appUrl);
          newUrls.push(url);
        }
        
        let existingList: string[] = [];
        if (patchData.images) {
          existingList = JSON.parse(patchData.images);
        } else {
          const current = await ProductModel.getById(id);
          if (current) {
            existingList = JSON.parse(current.images || "[]");
          }
        }
        
        patchData.images = JSON.stringify([...existingList, ...newUrls]);
      }

      const updated = await ProductModel.update(id, patchData);
      if (!updated) {
        return res.status(404).json({ error: "Product not found for modification." });
      }

      return res.json(updated);
    } catch (err: any) {
      console.error("UPDATE_PRODUCT_ERROR:", err);
      return res.status(500).json({ error: "Failed to modify product." });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
      }

      const success = await ProductModel.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found or already deleted." });
      }

      return res.json({ message: "Product removed from catalog." });
    } catch (err: any) {
      console.error("DELETE_PRODUCT_ERROR:", err);
      return res.status(500).json({ error: "Failed to remove product from catalog." });
    }
  }
};
