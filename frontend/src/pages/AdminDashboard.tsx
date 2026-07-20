import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Product, Category, Order } from "../types";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, BarChart3, Package, Layers, ClipboardList, Plus, Trash2, Edit3, Save, X, Loader2, RefreshCw, Upload, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Active dashboard tabs ('stats', 'products', 'categories', 'orders')
  const [activeTab, setActiveTab] = useState<"stats" | "products" | "categories" | "orders">("stats");
  const [isLoading, setIsLoading] = useState(true);

  // Stats dashboard states
  const [stats, setStats] = useState<{ totalRevenue: number; totalOrders: number; totalProducts: number; totalUsers: number } | null>(null);
  const [categoryMetrics, setCategoryMetrics] = useState<Array<{ category_name: string; sales: number }>>([]);

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modal Dialogs Control
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states Product
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  // Form states Category
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "stats") {
        const statsData = await api.get("/api/admin/stats");
        setStats(statsData.statistics);
        setCategoryMetrics(statsData.categoryMetrics || []);
      } else if (activeTab === "products") {
        const productsData = await api.get("/api/products?limit=100");
        setProducts(productsData.products || []);
        const categoriesData = await api.get("/api/categories");
        setCategories(categoriesData);
      } else if (activeTab === "categories") {
        const categoriesData = await api.get("/api/categories");
        setCategories(categoriesData);
      } else if (activeTab === "orders") {
        const ordersData = await api.get("/api/admin/orders");
        setOrders(ordersData);
      }
    } catch (err: any) {
      console.error("Failed to load admin telemetry dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  // Handle open Product Dialog
  const openProductForm = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdSlug(product.slug);
      setProdPrice(product.price.toString());
      setProdStock(product.stock.toString());
      setProdDesc(product.description);
      setProdCategoryId(product.category_id.toString());
    } else {
      setEditingProduct(null);
      setProdName("");
      setProdSlug("");
      setProdPrice("");
      setProdStock("");
      setProdDesc("");
      setProdCategoryId(categories[0]?.id.toString() || "");
    }
    setUploadFiles(null);
    setShowProductModal(true);
  };

  // Handle save Product with S3 multipart form uploads
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSlug || !prodPrice || !prodStock || !prodCategoryId) {
      alert("All fields are mandatory.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", prodName);
      formData.append("slug", prodSlug);
      formData.append("price", prodPrice);
      formData.append("stock", prodStock);
      formData.append("description", prodDesc);
      formData.append("category_id", prodCategoryId);

      // Append S3 files
      if (uploadFiles && uploadFiles.length > 0) {
        for (let i = 0; i < uploadFiles.length; i++) {
          formData.append("images", uploadFiles[i]);
        }
      }

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, formData);
      } else {
        await api.post("/api/products", formData);
      }

      setShowProductModal(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update product log.");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Permanently remove this product from the inventory database?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Deletion failed.");
    }
  };

  // Handle open Category Dialog
  const openCategoryForm = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatSlug(category.slug);
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatSlug("");
    }
    setShowCategoryModal(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, { name: catName, slug: catSlug });
      } else {
        await api.post("/api/categories", { name: catName, slug: catSlug });
      }
      setShowCategoryModal(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update categories lists.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Cascade-deleting this category might purge associated products. Continue?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Category deletion failed.");
    }
  };

  // Update order fulfillment status
  const handleOrderStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await api.put(`/api/admin/orders/${id}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update order fulfillment parameters.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-bento-border/50 pb-5 gap-4">
        <div>
          <span className="flex items-center text-[#a3e635] space-x-1.5 text-[10px] font-black uppercase tracking-widest mb-1.5 animate-pulse">
            <Shield className="h-4 w-4 text-bento-accent" />
            <span>AWS EC2 Admin Office</span>
          </span>
          <h1 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright">Administrative Center</h1>
        </div>

        {/* Sync loading */}
        <button
          onClick={loadAllAdminData}
          className="self-start rounded-xl border border-bento-border bg-bento-card px-4 py-2.5 text-xs font-bold text-bento-text-muted inline-flex items-center space-x-1.5 transition hover:bg-white/[0.01] hover:text-bento-accent cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>Reload Datastore</span>
        </button>
      </div>

      {/* Grid tabs layout selector */}
      <div className="mb-6 flex border-b border-bento-border/50 text-xs font-semibold overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3 border-b-2 flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "stats" ? "border-bento-accent text-bento-accent font-black" : "border-transparent text-bento-text-muted hover:text-bento-text-bright"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics Summary</span>
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 py-3 border-b-2 flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "products" ? "border-bento-accent text-bento-accent font-black" : "border-transparent text-bento-text-muted hover:text-bento-text-bright"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Product Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 py-3 border-b-2 flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "categories" ? "border-bento-accent text-bento-accent font-black" : "border-transparent text-bento-text-muted hover:text-bento-text-bright"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Categories Table</span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-3 border-b-2 flex items-center space-x-2 transition cursor-pointer ${
            activeTab === "orders" ? "border-bento-accent text-bento-accent font-black" : "border-transparent text-bento-text-muted hover:text-bento-text-bright"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Fulfillment Orders</span>
        </button>
      </div>

      {/* Loading spinners */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-bento-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Stats Telemetry Summary */}
          {activeTab === "stats" && stats && (
            <div className="space-y-6">
              
              {/* Four quick status grids */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-[20px] border border-bento-border bg-bento-card p-6 transition-all duration-350 hover:border-bento-hover">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted">Total Postgres Revenue</span>
                  <p className="mt-1 font-mono text-2xl font-black text-[#a3e635]">${Number(stats.totalRevenue).toFixed(2)}</p>
                </div>
                <div className="rounded-[20px] border border-bento-border bg-bento-card p-6 transition-all duration-350 hover:border-bento-hover">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted">Sales Order Velocity</span>
                  <p className="mt-1 font-mono text-2xl font-black text-bento-text-bright">{stats.totalOrders} total receipts</p>
                </div>
                <div className="rounded-[20px] border border-bento-border bg-bento-card p-6 transition-all duration-350 hover:border-bento-hover">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted">Warehouse SKU Count</span>
                  <p className="mt-1 font-mono text-2xl font-black text-bento-text-bright">{stats.totalProducts} items cataloged</p>
                </div>
                <div className="rounded-[20px] border border-bento-border bg-bento-card p-6 transition-all duration-350 hover:border-bento-hover">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted">Registered Accounts</span>
                  <p className="mt-1 font-mono text-2xl font-black text-bento-text-bright">{stats.totalUsers} profiles</p>
                </div>
              </div>

              {/* Advanced category charts bento bars */}
              {categoryMetrics.length > 0 && (
                <div className="rounded-[24px] border border-bento-border bg-bento-card p-6">
                  <span className="font-sans text-sm font-bold tracking-tight text-bento-text-bright block border-b border-bento-border/30 pb-3 mb-6">
                    Sales breakdown by Relational Catalog Category
                  </span>
                  <div className="space-y-4 max-w-xl text-xs sm:text-xs">
                    {categoryMetrics.map((cat, idx) => {
                      const totalEarned = Number(cat.sales || 0);
                      const percentageWidth = Math.min((totalEarned / (stats.totalRevenue || 1)) * 100, 100);
                      
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between font-semibold text-bento-text-bright">
                            <span>{cat.category_name}</span>
                            <span className="font-mono font-black text-[#a3e635]">${totalEarned.toFixed(2)}</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-bento-bg overflow-hidden border border-bento-border/30">
                            <div
                              style={{ width: `${percentageWidth}%` }}
                              className="h-full rounded-full bg-bento-accent transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Product Inventory CRUD Console */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center sm:py-0">
                <span className="text-sm font-bold text-bento-text-bright">In-Stock items ({products.length})</span>
                <button
                  onClick={() => openProductForm(null)}
                  className="rounded-xl bg-bento-accent px-4 py-2.5 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Standard SKU</span>
                </button>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto rounded-[20px] border border-bento-border bg-bento-card text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-bento-border/50 bg-white/[0.01] text-bento-text-muted font-black uppercase tracking-widest text-[9px]">
                      <th className="px-4 py-3.5">Thumbnail</th>
                      <th className="px-4 py-3.5">Item Name</th>
                      <th className="px-4 py-3.5">Sales Category</th>
                      <th className="px-4 py-3.5">Unit Price</th>
                      <th className="px-4 py-3.5">Available Stock</th>
                      <th className="px-4 py-3.5 text-right">Inventory Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bento-border/30 font-medium text-bento-text-bright">
                    {products.map((p) => {
                      const pImages = JSON.parse(p.images || "[]");
                      const pPrimary = pImages[0] || "https://picsum.photos/600/400?random=4";
                      
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3">
                            <div className="h-10 w-10 overflow-hidden rounded-xl bg-bento-bg border border-bento-border">
                              <img src={pPrimary} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <div>{p.name}</div>
                            <span className="text-[10px] text-bento-text-muted font-mono tracking-wide">{p.slug}</span>
                          </td>
                          <td className="px-4 py-3 text-bento-text-muted">{p.category_name}</td>
                          <td className="px-4 py-3 font-mono font-black text-[#a3e635]">${Number(p.price).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {p.stock === 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-950/80 text-red-400 border border-red-800/40 font-black text-[9px] uppercase tracking-wider">Sold Out</span>
                            ) : (
                              <span className="text-bento-text-muted">{p.stock} units</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => openProductForm(p)}
                                className="p-2 text-bento-text-muted hover:text-[#a3e635] hover:bg-[#1a2d10]/20 rounded-lg transition"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-red-450 hover:text-red-400 hover:bg-red-950/25 rounded-lg transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Category Configuration Panel */}
          {activeTab === "categories" && (
            <div className="space-y-4 max-w-xl">
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm font-bold text-bento-text-bright">Relational Categories Table ({categories.length})</span>
                <button
                  onClick={() => openCategoryForm(null)}
                  className="rounded-xl bg-bento-accent px-4 py-2.5 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Category Group</span>
                </button>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto rounded-[20px] border border-bento-border bg-bento-card text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-bento-border/50 bg-white/[0.01] text-bento-text-muted font-black uppercase tracking-widest text-[9px]">
                      <th className="px-4 py-3.5">Category Name</th>
                      <th className="px-4 py-3.5">URL Slug Link</th>
                      <th className="px-4 py-3.5 text-right">Actions Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bento-border/30 font-semibold text-bento-text-bright">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3 font-bold">{c.name}</td>
                        <td className="px-4 py-3 font-mono text-bento-text-muted select-all">{c.slug}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => openCategoryForm(c)}
                              className="p-2 text-bento-text-muted hover:text-[#a3e635] hover:bg-[#1a2d10]/20 rounded-lg transition"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-2 text-red-450 hover:text-red-400 hover:bg-red-950/25 rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Global Fulfillment Shipping Orders */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <span className="text-sm font-bold text-bento-text-bright block pb-2">Global receipts check ({orders.length} total orders)</span>

              {/* Orders global checklist table */}
              <div className="overflow-x-auto rounded-[20px] border border-bento-border bg-bento-card text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-bento-border/50 bg-white/[0.01] text-bento-text-muted font-black uppercase tracking-widest text-[9px]">
                      <th className="px-4 py-3.5">Order Number</th>
                      <th className="px-4 py-3.5">Date Record</th>
                      <th className="px-4 py-3.5">Shipping Destination</th>
                      <th className="px-4 py-3.5">Revenue total</th>
                      <th className="px-4 py-3.5">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bento-border/30 font-medium text-bento-text-bright">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold uppercase">{o.order_number}</td>
                        <td className="px-4 py-3 text-bento-text-muted">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : "Just Now"}
                        </td>
                        <td className="px-4 py-3 font-semibold leading-relaxed max-w-xs">{o.shipping_address}</td>
                        <td className="px-4 py-3 font-mono font-black text-[#a3e635]">${Number(o.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          
                          {/* Dropdown status changer updates postgres directly on click */}
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="rounded-xl border border-bento-border bg-bento-bg p-2 text-xs font-bold text-bento-text-bright focus:outline-none focus:ring-1 focus:ring-bento-accent transition-colors cursor-pointer"
                          >
                            <option value="pending" className="bg-[#0f0f0f] text-amber-400">Pending</option>
                            <option value="shipped" className="bg-[#0f0f0f] text-sky-400">Shipped</option>
                            <option value="delivered" className="bg-[#0f0f0f] text-emerald-400">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Product Form Dialogue Dialog */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[24px] border border-bento-border bg-bento-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-bento-border/50 pb-3">
                <span className="font-sans text-sm font-bold tracking-tight text-bento-text-bright">
                  {editingProduct ? "Edit Product Register" : "Register New Product"}
                </span>
                <button onClick={() => setShowProductModal(false)} className="text-bento-text-muted hover:text-bento-accent cursor-pointer transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Inventory Product Name</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Sony WH-1000XM5"
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Inventory Product Slug (URL pointer)</label>
                    <input
                      type="text"
                      required
                      value={prodSlug}
                      onChange={(e) => setProdSlug(e.target.value)}
                      placeholder="sony-wh-1000xm5"
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="348.00"
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Fulfillment Stock Count</label>
                    <input
                      type="number"
                      required
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="15"
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Relational Category Mapping</label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright focus:border-bento-accent focus:outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0f0f0f] text-bento-text-bright">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Product S3 Multipart Images Select</label>
                    <div className="mt-1.5 flex items-center justify-center rounded-xl border border-dashed border-bento-border/80 bg-bento-bg p-4 font-semibold text-bento-text-muted cursor-pointer hover:border-bento-accent transition duration-300">
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="h-6 w-6 text-bento-accent mb-1.5" />
                        <span className="text-xs">
                          {uploadFiles && uploadFiles.length > 0
                            ? `Selected ${uploadFiles.length} file(s)`
                            : "Upload images to S3 Bucket"}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setUploadFiles(e.target.files)}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Description Message</label>
                    <textarea
                      rows={3}
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Share particulars of features, styles, warranties, packaging..."
                      className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="rounded-xl border border-bento-border bg-transparent px-4 py-2.5 font-bold text-bento-text-muted hover:text-bento-text-bright hover:bg-[#151515] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-bento-accent px-4 py-2.5 font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Category Form Dialogue Tab */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[24px] border border-bento-border bg-bento-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-bento-border/50 pb-3">
                <span className="font-sans text-sm font-bold tracking-tight text-bento-text-bright">
                  {editingCategory ? "Edit Category Option" : "Register New Category Group"}
                </span>
                <button onClick={() => setShowCategoryModal(false)} className="text-bento-text-muted hover:text-bento-accent cursor-pointer transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Category Label Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Electronics"
                    className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1">Category URL Slug Link</label>
                  <input
                    type="text"
                    required
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="electronics"
                    className="mt-1.5 block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted/65 focus:border-bento-accent focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="rounded-xl border border-bento-border bg-transparent px-4 py-2.5 font-bold text-bento-text-muted hover:text-bento-text-bright hover:bg-[#151515] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-bento-accent px-4 py-2.5 font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
