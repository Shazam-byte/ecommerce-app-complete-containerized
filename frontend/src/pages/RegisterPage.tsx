import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, Mail, Lock, AlertCircle } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic structural checks
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please retype.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please attempt again.");
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
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-sans text-2xl font-black tracking-tight text-bento-text-bright">
            Create an account
          </h2>
          <p className="mt-1.5 text-xs text-bento-text-muted">
            Sign up to build lists and place orders
          </p>
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
                  placeholder="At least 6 characters"
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg px-4 py-3 pl-10 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent transition duration-300"
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-bento-text-muted/60" />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-[#a3e635] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
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
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Link Log in */}
        <p className="mt-4 text-center text-xs text-bento-text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-bento-accent hover:underline">
            Log in to session
          </Link>
        </p>
      </div>
    </div>
  );
};
