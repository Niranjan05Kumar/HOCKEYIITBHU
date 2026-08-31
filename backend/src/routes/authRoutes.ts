import { Router } from "express";
import { getCurrentAdminController, login, logout } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateLoginRequest } from "../validators/authValidator.js";

const router = Router();

router.post("/login", validateLoginRequest, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentAdminController);

export default router;
