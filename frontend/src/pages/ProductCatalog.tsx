import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Product, Category } from "../types";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Search, Filter, RefreshCcw, Star, ChevronLeft, ChevronRight, ShoppingCart, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export const ProductCatalog: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Catalog item and category lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter bindings states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Temp search binders
  const [searchQuery, setSearchQuery] = useState("");

  // Cart operations loggers
  const [addingId, setAddingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  // Load categories list on boot
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await api.get("/api/categories");
        setCategories(list);
      } catch (err) {
        console.error("Failed to load catalog categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch product matches
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "8"); // 8 per page fits beautifully
      
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await api.get(`/api/products?${params.toString()}`);
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalProducts(res.pagination?.totalProducts || 0);
    } catch (err) {
      console.error("Failed to fetch product catalog:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetch on filter and page changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, search, category, minPrice, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      alert("Please login to register shopping carts.");
      return;
    }
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      setSuccessId(product.id);
      setTimeout(() => setSuccessId(null), 1500);
    } catch (err: any) {
      alert(err.message || "Failed to add product to basket.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        
        {/* Filters Sidebar Column */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="sticky top-20 rounded-[24px] border border-bento-border bg-bento-card p-6 space-y-6 hover:border-bento-hover transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-bento-border pb-4">
              <span className="font-sans text-xs font-black tracking-widest text-bento-text-bright uppercase flex items-center">
                <Filter className="mr-2 h-4 w-4 text-bento-accent" />
                Filters
              </span>
              <button
                onClick={handleClearFilters}
                className="text-[10px] font-bold text-bento-text-muted hover:text-bento-accent flex items-center space-x-1 uppercase tracking-wider"
              >
                <RefreshCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Search Name</label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type product..."
                  className="w-full rounded-xl border border-bento-border bg-bento-bg py-2 pl-3 pr-10 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
                <button type="submit" className="absolute right-2 top-2 text-bento-text-muted hover:text-bento-accent transition-colors">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Categories Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Category</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => { setCategory(""); setCurrentPage(1); }}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-between border ${
                    category === "" 
                      ? "bg-bento-accent text-bento-bg border-bento-accent shadow-sm shadow-bento-accent/10" 
                      : "text-bento-text-muted bg-bento-bg border-bento-border/50 hover:bg-bento-hover hover:text-bento-text-bright hover:border-bento-border"
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.slug); setCurrentPage(1); }}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-between border ${
                      category === cat.slug 
                        ? "bg-bento-accent text-bento-bg border-bento-accent shadow-sm shadow-bento-accent/10" 
                        : "text-bento-text-muted bg-bento-bg border-bento-border/50 hover:bg-bento-hover hover:text-bento-text-bright hover:border-bento-border"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter range */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 rounded-xl border border-bento-border bg-bento-bg p-2 text-xs text-center text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 rounded-xl border border-bento-border bg-bento-bg p-2 text-xs text-center text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Grid View */}
        <main className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright">Catalog Products</h2>
              <p className="text-xs text-bento-text-muted">Showing {products.length} of {totalProducts} matches</p>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-bento-accent" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-[24px] border border-dashed border-bento-border bg-bento-card p-8 text-center">
              <span className="text-sm font-bold text-bento-text-bright">No products found</span>
              <p className="mt-1 text-xs text-bento-text-muted">Try adjusting your category selection or pricing bounds.</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 rounded-xl bg-bento-accent px-4 py-2 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
              >
                Clear All Filter Blocks
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Product cards grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => {
                  const imageList = JSON.parse(p.images || "[]");
                  const primaryImage = imageList[0] || "https://picsum.photos/600/400?random=1";
                  
                  return (
                    <motion.div
                      key={p.id}
                      whileHover={{ y: -4 }}
                      className="group flex flex-col overflow-hidden rounded-[24px] border border-bento-border bg-bento-card transition duration-300 hover:border-bento-hover"
                    >
                      {/* Image Frame */}
                      <Link to={`/products/${p.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-bento-bg border-b border-bento-border/40">
                        <img
                          src={primaryImage}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Category Badge */}
                        <span className="absolute left-3 top-3 rounded-lg bg-bento-card/90 border border-bento-border/70 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#a3e635] shadow-xs">
                          {p.category_name}
                        </span>

                        {/* Stock status badge */}
                        {p.stock === 0 ? (
                          <span className="absolute right-3 top-3 rounded-lg bg-red-950/85 border border-red-800/60 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-red-400 shadow-xs">
                            Sold Out
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="absolute right-3 top-3 rounded-lg bg-amber-950/85 border border-amber-800/60 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400 shadow-xs">
                            Only {p.stock} Left
                          </span>
                        ) : (
                          <span className="absolute right-3 top-3 rounded-lg bg-emerald-950/85 border border-emerald-800/60 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 shadow-xs">
                            In Stock
                          </span>
                        )}
                      </Link>

                      {/* Info Frame */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex-1 space-y-2">
                          <Link to={`/products/${p.slug}`} className="block font-sans text-sm font-bold tracking-tight text-bento-text-bright hover:text-bento-accent transition-colors">
                            {p.name}
                          </Link>
                          
                          {/* Rating aggregates */}
                          <div className="flex items-center space-x-1 pb-1">
                            <Star className={`h-3 w-3 ${p.average_rating && p.average_rating > 0 ? "fill-bento-accent text-bento-accent" : "text-bento-border"}`} />
                            <span className="text-[11px] font-bold text-bento-text-bright">
                              {p.average_rating && p.average_rating > 0 ? Number(p.average_rating).toFixed(1) : "No ratings"}
                            </span>
                            {p.reviews_count && p.reviews_count > 0 ? (
                              <span className="text-[10px] text-bento-text-muted">({p.reviews_count} reviews)</span>
                            ) : null}
                          </div>

                          <p className="line-clamp-2 text-xs text-bento-text-muted leading-relaxed">{p.description}</p>
                        </div>

                        {/* Price & Buy row */}
                        <div className="mt-4 flex items-center justify-between border-t border-bento-border/50 pt-4">
                          <span className="font-mono text-base font-black text-bento-text-bright">
                            ${Number(p.price).toFixed(2)}
                          </span>
                          
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock === 0 || addingId === p.id}
                            className={`flex items-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-bold transition duration-200 cursor-pointer ${
                              successId === p.id
                                ? "bg-emerald-600 text-white"
                                : p.stock === 0
                                ? "bg-[#151515] text-bento-text-muted cursor-not-allowed border border-bento-border"
                                : "bg-bento-accent text-bento-bg hover:bg-bento-accent-hover shadow-sm hover:shadow-bento-accent/10"
                            }`}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>
                              {successId === p.id
                                ? "Added!"
                                : addingId === p.id
                                ? "Adding..."
                                : "Add to Cart"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination indicators footer controller */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 border-t border-bento-border/40 pt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-bento-border bg-bento-card hover:bg-bento-hover hover:border-bento-hover transition disabled:opacity-40 text-bento-text-bright cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-bold text-bento-text-bright">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-bento-border bg-bento-card hover:bg-bento-hover hover:border-bento-hover transition disabled:opacity-40 text-bento-text-bright cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
