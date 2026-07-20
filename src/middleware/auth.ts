import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_session_token_key";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Helper to parse cookies easily from header
 */
function parseCookies(cookieHeader: string | undefined): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  if (!cookieHeader) return result;
  
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      result[name] = decodeURIComponent(val);
    }
  });
  return result;
}

/**
 * Middleware: Verify JWT and attach user context to Request
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try to read token from cookies first
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies["token"];

  // If not in cookies, fallback to Authorization Bearer header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    // Keep raw request unauthenticated; let downstream requireAuth safeguard if needed
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("JWT: Invalid or expired token presented.");
    // Token is bad, clear it or ignore as unauthenticated
    next();
  }
}

/**
 * Middleware: Assert that the user is authenticated
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required. Please login first.",
      code: "UNAUTHORIZED",
    });
  }
  next();
}

/**
 * Middleware: Assert that the user is authenticated AND holds admin role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required.",
      code: "UNAUTHORIZED",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden. Admin access required.",
      code: "FORBIDDEN",
    });
  }
  next();
}
