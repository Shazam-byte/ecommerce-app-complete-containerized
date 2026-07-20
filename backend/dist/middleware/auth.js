"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_session_token_key";
/**
 * Helper to parse cookies easily from header
 */
function parseCookies(cookieHeader) {
    const result = {};
    if (!cookieHeader)
        return result;
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
function authenticateToken(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.warn("JWT: Invalid or expired token presented.");
        // Token is bad, clear it or ignore as unauthenticated
        next();
    }
}
/**
 * Middleware: Assert that the user is authenticated
 */
function requireAuth(req, res, next) {
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
function requireAdmin(req, res, next) {
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
