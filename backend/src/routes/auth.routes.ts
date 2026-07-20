import { Router } from "express";
import { AuthController, RegisterSchema, LoginSchema } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validateBody(RegisterSchema), AuthController.register);
router.post("/login", validateBody(LoginSchema), AuthController.login);
router.post("/logout", requireAuth, AuthController.logout);
router.get("/me", AuthController.getMe);

export default router;
