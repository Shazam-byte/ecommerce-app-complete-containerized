"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = exports.ReviewCreateSchema = void 0;
const zod_1 = require("zod");
const review_model_1 = require("../models/review.model");
exports.ReviewCreateSchema = zod_1.z.object({
    productId: zod_1.z.number().int().positive(),
    rating: zod_1.z.number().int().min(1).max(5, { message: "Rating must be a whole number between 1 and 5 stars." }),
    comment: zod_1.z.string().min(5, { message: "Review comment must contain at least 5 characters." }),
});
exports.ReviewController = {
    /**
     * Fetch reviews for a specific catalog item
     */
    async getByProduct(req, res) {
        try {
            const productId = parseInt(req.params.productId, 10);
            if (isNaN(productId)) {
                return res.status(400).json({ error: "Invalid product ID parameter." });
            }
            const reviews = await review_model_1.ReviewModel.getByProductId(productId);
            return res.json(reviews);
        }
        catch (err) {
            console.error("GET_REVIEWS_ERR:", err);
            return res.status(500).json({ error: "Failed to download reviews list." });
        }
    },
    /**
     * Write or edit item review. Enforces verified buyer protection.
     */
    async writeReview(req, res) {
        try {
            const userId = req.user.userId;
            const { productId, rating, comment } = req.body;
            // 1. Enforce verified customer purchase constraint
            const hasBought = await review_model_1.ReviewModel.hasPurchasedProduct(userId, productId);
            if (!hasBought) {
                return res.status(403).json({
                    error: "Purchase verification failed. You may only leave a review on products you have actually purchased.",
                    code: "VERIFIED_PURCHASE_REQUIRED",
                });
            }
            // 2. Insert or update review (UPSERT mechanism)
            const review = await review_model_1.ReviewModel.create(userId, productId, rating, comment);
            return res.status(201).json({
                message: "Review submitted successfully.",
                review,
            });
        }
        catch (err) {
            console.error("SUBMIT_REVIEW_ERR:", err);
            return res.status(500).json({ error: "Failed to post product review." });
        }
    }
};
