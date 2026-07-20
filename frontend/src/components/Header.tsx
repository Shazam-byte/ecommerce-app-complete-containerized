import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, LogOut, ShieldAlert, Package, LogIn, Store, UserCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-bento-border bg-bento-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-2 text-bento-text-bright transition hover:text-bento-accent">
          <Store className="h-6 w-6 text-bento-accent" />
          <span className="font-sans text-lg font-bold tracking-tight text-bento-text-bright">
            E-Catalog
          </span>
          <span className="rounded-md bg-bento-card border border-bento-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bento-accent">Bento Space</span>
        </Link>

        {/* Desktop Navigation Link Cluster */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`font-sans text-sm font-medium transition-colors ${
              isActive("/") ? "text-bento-accent font-semibold" : "text-bento-text-muted hover:text-bento-text-bright"
            }`}
          >
            Catalog
          </Link>
          {user && (
            <Link
              to="/orders"
              className={`font-sans text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive("/orders") ? "text-bento-accent font-semibold" : "text-bento-text-muted hover:text-bento-text-bright"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>My Orders</span>
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className={`font-sans text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive("/admin") ? "text-red-400 font-extrabold" : "text-red-500 hover:text-red-400"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Actions Cluster (Cart, Auth states) */}
        <div className="flex items-center space-x-4">
          
          {/* Active Cart Indicator Button */}
          <Link
            to="/cart"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-bento-border bg-bento-card text-bento-text-bright transition hover:bg-bento-hover hover:border-bento-hover"
          >
            <ShoppingCart className="h-5 w-5 text-bento-text-muted transition group-hover:text-bento-accent" />
            
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bento-accent text-[10px] font-black text-bento-bg shadow-sm"
                  id="checkout-live-cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* User Session States Trigger */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-bento-text-bright flex items-center justify-end space-x-1">
                  <UserCheck className="h-3.5 w-3.5 text-bento-accent mr-0.5" />
                  {user.email.split("@")[0]}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-bento-text-muted">
                  {user.role} role
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 rounded-lg border border-bento-border bg-bento-card px-3 py-1.5 text-xs font-medium text-bento-text-bright transition hover:bg-bento-hover hover:text-bento-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="flex items-center space-x-1 rounded-lg border border-bento-border bg-bento-card px-4 py-2 text-xs font-medium text-bento-text-bright transition hover:bg-bento-hover"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-bento-accent hover:bg-bento-accent-hover px-4 py-2 text-xs font-bold text-bento-bg transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation row (only shown when logged in) */}
      {user && (
        <div className="flex md:hidden border-t border-bento-border bg-bento-card px-4 py-2 space-x-4 justify-center text-xs">
          <Link
            to="/"
            className={`font-medium ${isActive("/") ? "text-bento-accent" : "text-bento-text-muted"}`}
          >
            Catalog
          </Link>
          <Link
            to="/orders"
            className={`font-medium ${isActive("/orders") ? "text-bento-accent" : "text-bento-text-muted"}`}
          >
            My Orders
          </Link>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`font-medium text-red-400 ${isActive("/admin") ? "font-bold" : ""}`}
            >
              Admin Office
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
