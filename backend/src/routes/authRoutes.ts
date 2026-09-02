import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getCurrentAdminController, login, logout } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateLoginRequest } from "../validators/authValidator.js";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";
const loginRateLimitWindowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const loginRateLimitMax = Number(process.env.LOGIN_RATE_LIMIT_MAX || (isProduction ? 10 : 25));

const loginLimiter = rateLimit({
    windowMs:
        Number.isSafeInteger(loginRateLimitWindowMs) && loginRateLimitWindowMs > 0
            ? loginRateLimitWindowMs
            : 15 * 60 * 1000,
    max: Number.isSafeInteger(loginRateLimitMax) && loginRateLimitMax > 0 ? loginRateLimitMax : isProduction ? 10 : 25,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many login attempts. Please try again later.",
            },
        });
    },
});

router.post("/login", loginLimiter, validateLoginRequest, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentAdminController);

export default router;
