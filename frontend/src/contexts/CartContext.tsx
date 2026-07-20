import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "../types";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  cartCount: number;
  cartTotal: number;
  loadCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.get("/api/cart");
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load shopping cart from server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync cart state as user session changes
  useEffect(() => {
    loadCart();
  }, [user]);

  const addToCart = async (productId: number, quantity: number) => {
    if (!user) throw new Error("Auth required to add items to cart.");
    await api.post("/api/cart", { productId, quantity });
    await loadCart();
  };

  const updateCartQuantity = async (itemId: number, quantity: number) => {
    if (!user) return;
    await api.put(`/api/cart/${itemId}`, { quantity });
    await loadCart();
  };

  const removeFromCart = async (itemId: number) => {
    if (!user) return;
    await api.delete(`/api/cart/${itemId}`);
    await loadCart();
  };

  const clearCartItems = async () => {
    if (!user) return;
    await api.delete("/api/cart");
    setCartItems([]);
  };

  // Derive cart counts and basket subtotals dynamically
  const cartCount = cartItems.reduce((acc, obj) => acc + obj.quantity, 0);
  const cartTotal = cartItems.reduce((acc, obj) => acc + Number(obj.product_price) * obj.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        cartCount,
        cartTotal,
        loadCart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
