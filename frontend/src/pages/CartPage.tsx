import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export const CartPage: React.FC = () => {
  const { cartItems, updateCartQuantity, removeFromCart, cartTotal, isLoading } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = async (itemId: number, currentQty: number, change: number, stock: number) => {
    const newVal = currentQty + change;
    if (newVal < 1) return;
    if (newVal > stock) {
      alert(`Cannot adjust quantity. Only ${stock} items available in stock.`);
      return;
    }

    try {
      await updateCartQuantity(itemId, newVal);
    } catch (err: any) {
      alert(err.message || "Failed to adjust basket count.");
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
    } catch (err: any) {
      alert(err.message || "Failed to remove item.");
    }
  };

  const taxAmount = cartTotal * 0.08; // 8% standard tax
  const grandTotal = cartTotal + taxAmount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright mb-8 flex items-center">
        <ShoppingBag className="mr-3 h-8 w-8 text-bento-accent animate-pulse" />
        Your Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-bento-border/70 p-16 text-center bg-bento-card">
          <span className="text-sm font-bold text-bento-text-bright">Your basket is currently empty</span>
          <p className="mt-1 text-xs text-bento-text-muted">Explore our dynamic product catalog to add items here!</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-bento-accent px-5 py-2.5 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to catalog explorer</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Cart items list column */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const itemImages = JSON.parse(item.product_images || "[]");
              const itemPrimary = itemImages[0] || "https://picsum.photos/600/400?random=3";
              
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 rounded-[24px] border border-bento-border bg-bento-card p-4 hover:border-bento-hover transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-bento-bg border border-bento-border/50">
                    <img src={itemPrimary} alt={item.product_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>

                  {/* Name and unit price */}
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/products/${item.product_id}`} className="block text-sm font-bold text-bento-text-bright hover:text-bento-accent transition-colors">
                      {item.product_name}
                    </Link>
                    <span className="font-mono text-xs text-bento-text-muted mt-1 block">
                      Price: ${Number(item.product_price).toFixed(2)} each
                    </span>
                  </div>

                  {/* Qty count controller */}
                  <div className="flex items-center border border-bento-border rounded-xl bg-bento-bg h-10 px-1">
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, -1, item.product_stock)}
                      disabled={item.quantity <= 1}
                      className="px-3 font-bold text-bento-text-muted hover:text-bento-accent transition text-md disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 font-mono text-xs font-bold text-bento-text-bright">{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, 1, item.product_stock)}
                      className="px-3 font-bold text-bento-text-muted hover:text-bento-accent transition text-md cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Total price & delete button */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-bento-border/20 sm:border-t-0 pt-3 sm:pt-0">
                    <span className="font-mono text-sm font-black text-bento-text-bright">
                      ${(Number(item.product_price) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sum total card column */}
          <div className="lg:col-span-1">
            <div className="rounded-[24px] border border-bento-border bg-bento-card p-6 space-y-4">
              <span className="font-sans text-xs font-black tracking-widest text-[#a3e635] uppercase block border-b border-bento-border/50 pb-3">
                Order Invoice Summary
              </span>

              <div className="space-y-3.5 text-xs text-bento-text-muted">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-mono font-bold text-bento-text-bright">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (8%)</span>
                  <span className="font-mono font-bold text-bento-text-bright">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-[#a3e635] font-black uppercase tracking-widest text-[9px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">Free Delivery</span>
                </div>

                <div className="flex justify-between border-t border-bento-border/50 pt-4 text-sm font-bold text-bento-text-bright">
                  <span>Invoice Total</span>
                  <span className="font-mono text-lg font-black text-bento-text-bright">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="mt-6 flex w-full h-12 items-center justify-center space-x-2 rounded-xl bg-bento-accent text-sm font-bold text-bento-bg shadow-sm transition hover:bg-bento-accent-hover cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
