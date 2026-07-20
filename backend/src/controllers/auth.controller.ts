import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserModel } from "../models/user.model";
import { AuthenticatedRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_session_token_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Zod validation schemas
export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address format." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthController = {
  /**
   * Create account, sign JWT, issue httpOnly cookie
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Check duplicate
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          error: "An account with this email address is already registered.",
          code: "DUPLICATE_EMAIL",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Save user
      const user = await UserModel.createUser(email, passwordHash, "user");

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      // Set cookie (secure in production, httpOnly for XSS security)
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Lax supports our cross-frame development dev server routing perfectly
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(201).json({
        message: "User account registered successfully.",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error("REGISTER_ERROR:", err);
      return res.status(500).json({ error: "Internal server error during registration." });
    }
  },

  /**
   * Verify credentials, sign JWT, issue cookie
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password combination.",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          error: "Invalid email or password combination.",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Generate Token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: "Logged in successfully.",
        token, // Return token for flexible frontends, though cookie handles automatic sessions
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error("LOGIN_ERROR:", err);
      return res.status(500).json({ error: "Internal server login error." });
    }
  },

  /**
   * Clear JWT cookie
   */
  async logout(req: Request, res: Response) {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.json({ message: "Successfully logged out of session." });
  },

  /**
   * Fetch authenticated user details
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Not logged in.", code: "UNAUTHORIZED" });
    }
    return res.json({ user: req.user });
  }
};
