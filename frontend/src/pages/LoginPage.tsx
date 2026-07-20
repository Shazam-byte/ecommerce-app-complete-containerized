import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Get redirect path
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-[24px] border border-bento-border bg-bento-card p-8 shadow-xl">
        
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-bento-bg text-bento-accent border border-bento-border/50 shadow-xs">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-sans text-2xl font-black tracking-tight text-bento-text-bright">
            Welcome back
          </h2>
          <p className="mt-1.5 text-xs text-bento-text-muted">
            Log in to manage your shopping cart and place orders
          </p>
        </div>

        {/* Demo Accounts Card */}
        <div className="rounded-xl bg-bento-bg border border-bento-border/70 p-4 text-xs text-bento-text-muted space-y-2">
          <div className="flex items-center font-bold">
            <Sparkles className="h-4 w-4 mr-1.5 text-bento-accent animate-pulse" />
            <span>Simulate demo account profiles:</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setEmail("user@catalog.com"); setPassword("user123"); }}
              className="px-2.5 py-1.5 bg-bento-card border border-bento-border/80 rounded-lg text-bento-accent hover:border-bento-accent hover:bg-emerald-950/20 transition-colors cursor-pointer font-bold text-[10px]"
            >
              Customer Session
            </button>
            <button
              onClick={() => { setEmail("admin@catalog.com"); setPassword("admin123"); }}
              className="px-2.5 py-1.5 bg-bento-card border border-bento-border/80 rounded-lg text-red-400 hover:border-red-400 hover:bg-red-950/20 transition-colors cursor-pointer font-bold text-[10px]"
            >
              Administrator Config
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-950/80 p-3 text-xs font-semibold text-red-400 border border-red-800/60">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg px-4 py-3 pl-10 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent transition duration-300"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-bento-text-muted/60" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg px-4 py-3 pl-10 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent transition duration-300"
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-bento-text-muted/60" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-bento-accent py-3 text-xs font-bold text-bento-bg transition hover:bg-bento-accent-hover disabled:bg-[#151515] disabled:text-bento-text-muted cursor-pointer"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Link Sign up */}
        <p className="mt-4 text-center text-xs text-bento-text-muted">
          Not registered?{" "}
          <Link to="/register" className="font-bold text-bento-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
