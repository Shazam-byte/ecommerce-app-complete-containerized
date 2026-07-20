import { Request, Response } from "express";
import { z } from "zod";
import { ReviewModel } from "../models/review.model";
import { AuthenticatedRequest } from "../middleware/auth";

export const ReviewCreateSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5, { message: "Rating must be a whole number between 1 and 5 stars." }),
  comment: z.string().min(5, { message: "Review comment must contain at least 5 characters." }),
});

export const ReviewController = {
  /**
   * Fetch reviews for a specific catalog item
   */
  async getByProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID parameter." });
      }

      const reviews = await ReviewModel.getByProductId(productId);
      return res.json(reviews);
    } catch (err: any) {
      console.error("GET_REVIEWS_ERR:", err);
      return res.status(500).json({ error: "Failed to download reviews list." });
    }
  },

  /**
   * Write or edit item review. Enforces verified buyer protection.
   */
  async writeReview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { productId, rating, comment } = req.body;

      // 1. Enforce verified customer purchase constraint
      const hasBought = await ReviewModel.hasPurchasedProduct(userId, productId);
      if (!hasBought) {
        return res.status(403).json({
          error: "Purchase verification failed. You may only leave a review on products you have actually purchased.",
          code: "VERIFIED_PURCHASE_REQUIRED",
        });
      }

      // 2. Insert or update review (UPSERT mechanism)
      const review = await ReviewModel.create(userId, productId, rating, comment);
      
      return res.status(201).json({
        message: "Review submitted successfully.",
        review,
      });
    } catch (err: any) {
      console.error("SUBMIT_REVIEW_ERR:", err);
      return res.status(500).json({ error: "Failed to post product review." });
    }
  }
};
