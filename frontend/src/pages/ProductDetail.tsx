import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Product, Review } from "../types";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Star, ShoppingCart, ArrowLeft, Loader2, MessageSquare, ShieldCheck, Clock, Check } from "lucide-react";
import { motion } from "motion/react";

export const ProductDetail: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Detail states
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery slider state
  const [activeImage, setActiveImage] = useState("");

  // Buy quantities choice
  const [quantity, setQuantity] = useState(1);

  // Cart animation states
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Review submission states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadData = async () => {
    if (!idOrSlug) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/api/products/${idOrSlug}`);
      setProduct(data.product);
      setRelated(data.related || []);
      
      if (data.product) {
        // Set first gallery index as primary image
        const imgList = JSON.parse(data.product.images || "[]");
        setActiveImage(imgList[0] || "https://picsum.photos/600/400?random=1");
        
        // Load reviews for the product
        const reviewsData = await api.get(`/api/reviews/product/${data.product.id}`);
        setReviews(reviewsData);
      }
    } catch (err: any) {
      console.error("Failed to load product details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Scroll to top when identifier parameters shift
    window.scrollTo(0, 0);
  }, [idOrSlug]);

  const handleAddToCart = async () => {
    if (!user) {
      alert("Please login first to modify carts.");
      navigate("/login");
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to add items to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Login is required to write reviews.");
      return;
    }
    if (!product) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      await api.post("/api/reviews", {
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewSuccess(true);
      setReviewComment("");
      setReviewRating(5);
      
      // Reload reviews log
      const reviewsData = await api.get(`/api/reviews/product/${product.id}`);
      setReviews(reviewsData);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bento-accent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h3 className="font-sans text-xl font-bold text-bento-text-bright">Product not found</h3>
        <p className="mt-2 text-xs text-bento-text-muted">The requested catalog item could not be retrieved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-bento-accent px-4 py-2 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const images = JSON.parse(product.images || "[]");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link to="/" className="mb-6 inline-flex items-center space-x-2 text-xs font-bold text-bento-text-muted hover:text-bento-accent transition uppercase tracking-wider">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to catalog explorer</span>
      </Link>

      {/* Main product presentation layout */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        
        {/* Left Column: Image and Gallery */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] border border-bento-border bg-bento-bg aspect-[4/3] w-full">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover transition"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border bg-bento-bg transition hover:opacity-85 cursor-pointer ${
                    activeImage === img ? "border-bento-accent ring-1 ring-bento-accent" : "border-bento-border/60"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & actions */}
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="rounded-lg bg-bento-card border border-bento-border/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-bento-accent">
              {product.category_name}
            </span>
            <h1 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright">
              {product.name}
            </h1>
            
            {/* Rating aggregates */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      product.average_rating && product.average_rating >= s
                        ? "fill-bento-accent text-bento-accent"
                        : "text-bento-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-bento-text-bright">
                {product.average_rating && product.average_rating > 0
                  ? `${Number(product.average_rating).toFixed(1)} stars`
                  : "No reviews left yet"}
              </span>
              <span className="text-xs text-bento-text-muted">|</span>
              <span className="text-xs text-bento-text-muted">{reviews.length} total reviews</span>
            </div>
          </div>

          <p className="text-sm font-medium text-bento-text-muted leading-relaxed max-w-xl">{product.description}</p>

          <div className="border-t border-bento-border/50 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Price</p>
                <span className="font-mono text-3xl font-black text-bento-text-bright">
                  ${Number(product.price).toFixed(2)}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted text-right mb-1">Inventory</p>
                {product.stock === 0 ? (
                  <span className="rounded-lg bg-red-950/85 border border-red-800/60 px-2.5 py-1 text-xs font-bold text-red-400">
                    Temporarily Out of Stock
                  </span>
                ) : (
                  <span className="rounded-lg bg-emerald-950/85 border border-emerald-800/50 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    {product.stock} items available
                  </span>
                )}
              </div>
            </div>

            {/* Quantity selections and checkout buttons */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                <div className="flex items-center border border-bento-border rounded-xl bg-bento-bg h-12">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                    className="px-4 py-2 text-md font-bold text-bento-text-muted hover:text-bento-accent transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 font-mono text-sm font-bold text-bento-text-bright">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 1, product.stock))}
                    className="px-4 py-2 text-md font-bold text-bento-text-muted hover:text-bento-accent transition cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex flex-1 items-center justify-center space-x-2 rounded-xl py-3.5 text-sm font-bold text-bento-bg transition h-12 w-full cursor-pointer ${
                    addSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-bento-accent hover:bg-bento-accent-hover"
                  }`}
                >
                  {addSuccess ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Added to Basket!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 hover:scale-105" />
                      <span>{isAdding ? "Adding to Cart..." : "Add to Shopping Cart"}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="mt-16 border-t border-bento-border/50 pt-10">
        <h3 className="font-sans text-xl font-bold tracking-tight text-bento-text-bright mb-6 flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-bento-accent" />
          Buyer Assessments & Reviews ({reviews.length})
        </h3>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Write a review forms column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-[24px] border border-bento-border bg-bento-card p-6 space-y-4">
              <span className="font-sans text-xs font-black tracking-widest text-bento-text-bright uppercase block">Leave a Star Review</span>
              
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  
                  {/* Diagnosis errors */}
                  {reviewError && (
                    <div className="rounded-lg bg-red-950/80 p-3 text-xs font-semibold text-red-400 border border-red-800/60">
                      {reviewError}
                    </div>
                  )}

                  {/* Diagnoses Success */}
                  {reviewSuccess && (
                    <div className="rounded-lg bg-emerald-950/80 p-3 text-xs font-semibold text-emerald-400 border border-emerald-800/50">
                      Thank you! Your verified-purchase assessment was successfully uploaded!
                    </div>
                  )}

                  {/* Stars choice */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Select Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReviewRating(num)}
                          className="text-bento-border transition hover:scale-110 cursor-pointer"
                        >
                          <Star className={`h-6 w-6 ${reviewRating >= num ? "fill-bento-accent text-bento-accent" : "text-bento-border"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment box */}
                  <div>
                    <label htmlFor="comment" className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Review Message</label>
                    <textarea
                      id="comment"
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience (at least 5 characters)"
                      className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex w-full items-center justify-center rounded-xl bg-bento-accent py-2.5 text-xs font-bold text-bento-bg transition hover:bg-bento-accent-hover disabled:bg-[#151515] disabled:text-bento-text-muted cursor-pointer"
                  >
                    {isSubmittingReview ? "Submitting Review..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 bg-bento-bg rounded-xl border border-dashed border-bento-border/50">
                  <p className="text-xs text-bento-text-muted mb-3">Login to write a verified buyer review</p>
                  <Link to="/login" className="inline-flex rounded-xl bg-bento-accent px-4 py-2 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition">
                    Login Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* List of reviews column */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-bento-border/60 rounded-[24px] bg-bento-card">
                <span className="text-sm font-bold text-bento-text-bright block">No reviews yet</span>
                <p className="text-xs text-bento-text-muted mt-1">Purchasing custom users can leave the first review of this product.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-[24px] border border-bento-border bg-bento-card p-5 space-y-3 hover:border-bento-hover transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-bento-text-bright">{r.user_email}</span>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                r.rating >= s ? "fill-bento-accent text-bento-accent" : "text-bento-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-[9px] text-[#a3e635] bg-emerald-950/85 px-2 py-0.5 rounded-lg border border-emerald-800/60 font-black uppercase tracking-widest shadow-xs">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verified Buyer</span>
                      </div>
                    </div>

                    <p className="text-xs text-bento-text-muted leading-relaxed font-sans">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {related.length > 0 && (
        <div className="mt-16 border-t border-bento-border/50 pt-10">
          <h3 className="font-sans text-xl font-bold tracking-tight text-bento-text-bright mb-6">
            Explore Related Products
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => {
              const rImages = JSON.parse(p.images || "[]");
              const rPrimary = rImages[0] || "https://picsum.photos/600/400?random=2";
              
              return (
                <div key={p.id} className="group rounded-[24px] border border-bento-border bg-bento-card p-4 hover:border-bento-hover transition duration-350 flex flex-col hover:scale-[1.01]">
                  <Link to={`/products/${p.slug}`} className="block aspect-[4/3] overflow-hidden rounded-xl bg-bento-bg border border-bento-border/40">
                    <img src={rPrimary} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                  </Link>

                  <div className="mt-4 flex-1 flex flex-col justify-between space-y-2">
                    <Link to={`/products/${p.slug}`} className="block text-xs font-bold text-bento-text-bright hover:text-bento-accent transition-colors line-clamp-1">
                      {p.name}
                    </Link>
                    <div className="flex items-center justify-between border-t border-bento-border/30 pt-2.5">
                      <span className="font-mono text-xs font-extrabold text-bento-text-bright">${Number(p.price).toFixed(2)}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#a3e635]">View Detail</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
