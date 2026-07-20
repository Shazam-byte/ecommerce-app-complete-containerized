import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Order } from "../types";
import { ClipboardList, Clock, Truck, ShieldCheck, ChevronDown, ChevronUp, Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/api/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load user orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = async (order: Order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }

    try {
      // Fetch details of specific single order including items
      const details = await api.get(`/api/orders/${order.id}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, items: details.items } : o))
      );
      setExpandedId(order.id);
    } catch (err) {
      console.error("Failed to load order items details:", err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.trim().toLowerCase()) {
      case "delivered":
        return "bg-emerald-950/80 text-emerald-400 border border-emerald-850/50 shadow-xs";
      case "shipped":
        return "bg-sky-950/80 text-sky-400 border border-sky-850/50 shadow-xs";
      default:
        return "bg-amber-950/80 text-[#eab308] border border-amber-850/50 shadow-xs";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bento-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright mb-8 flex items-center">
        <ClipboardList className="mr-3 h-8 w-8 text-bento-accent animate-pulse" />
        Order Histories
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-bento-border/70 p-16 text-center bg-bento-card">
          <span className="text-sm font-bold text-bento-text-bright">No orders placed yet</span>
          <p className="mt-1 text-xs text-bento-text-muted">Your completed purchases will appear here for historical tracking.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-bento-accent px-5 py-2.5 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
          >
            <span>Browse catalogs now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : "Just Now";

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-[24px] border border-bento-border bg-bento-card shadow-sm transition hover:border-bento-hover duration-300"
              >
                {/* Header summary handle row */}
                <div
                  onClick={() => toggleExpand(order)}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/[0.01] transition select-none"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto text-xs">
                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Order Ref</span>
                      <span className="font-mono font-bold text-bento-text-bright uppercase">{order.order_number}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Date Placed</span>
                      <span className="font-bold text-bento-text-bright">{orderDate}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Bill Total</span>
                      <span className="font-mono font-black text-[#a3e635]">${Number(order.total_amount).toFixed(2)}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Fulfillment</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:border-l sm:border-bento-border/30 sm:pl-4">
                    <span className="text-[11px] font-bold text-bento-text-muted sm:block hidden mr-2">Click to view items</span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-bento-accent" /> : <ChevronDown className="h-5 w-5 text-bento-text-muted" />}
                  </div>
                </div>

                {/* Expanded items list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-bento-border/30 bg-[#070707] p-6 space-y-4 text-xs"
                    >
                      <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Shipping Destination</span>
                        <p className="text-bento-text-bright leading-relaxed font-bold">{order.shipping_address}</p>
                      </div>

                      <div className="space-y-2 border-t border-bento-border/30 pt-4">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-bento-text-muted mb-2">Purchased Products list</span>
                        
                        {order.items ? (
                          <div className="divide-y divide-bento-border/30 bg-bento-card rounded-xl border border-bento-border overflow-hidden">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between p-4 bg-bento-card items-center hover:bg-white/[0.01] transition-colors">
                                <div>
                                  <p className="font-bold text-bento-text-bright flex items-center">
                                    <Package className="h-3.5 w-3.5 mr-1.5 text-bento-accent" />
                                    {item.product_name}
                                  </p>
                                  <span className="text-[11px] text-bento-text-muted mt-1 block">quantity: {item.quantity}</span>
                                </div>
                                <span className="font-mono font-black text-bento-text-bright">${(Number(item.product_price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-center p-3">
                            <Loader2 className="h-5 w-5 animate-spin text-bento-accent" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
