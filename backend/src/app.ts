import "dotenv/config";
import { randomBytes } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import rateLimit, { type Options as RateLimitOptions } from "express-rate-limit";
import AppError from "./utils/appError.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import tournamentEditionRoutes from "./routes/tournamentEditionRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import historyEventRoutes from "./routes/historyEventRoutes.js";
import galleryItemRoutes from "./routes/galleryItemRoutes.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins =
    process.env.CLIENT_URL?.split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0) ?? [];
const defaultDevOrigins = ["http://localhost:5173", "http://localhost:3000"];
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : isProduction ? [] : defaultDevOrigins;

if (allowedOrigins.includes("*")) {
    throw new Error("CLIENT_URL must not contain '*' when credentials are enabled");
}

if (isProduction && allowedOrigins.length === 0) {
    throw new Error("CLIENT_URL must be configured in production");
}

const sessionSecretFromEnv = process.env.SESSION_SECRET?.trim();

if (isProduction && !sessionSecretFromEnv) {
    throw new Error("SESSION_SECRET must be configured in production");
}

const sessionSecret = sessionSecretFromEnv || randomBytes(32).toString("hex");

const buildRateLimitHandler =
    (message: string): NonNullable<RateLimitOptions["handler"]> =>
    (_req, res, _next, options) => {
        res.status(options.statusCode).json({
            success: false,
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message,
            },
        });
    };

app.use(helmet());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new AppError("CORS origin is not allowed", 403));
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (isProduction) {
    app.set("trust proxy", 1);
}

app.use(
    session({
        secret: sessionSecret,
        name: process.env.SESSION_NAME || "hockey_iitbhu_sid",
        proxy: isProduction,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction,
            maxAge: 1000 * 60 * 60 * 12,
        },
    }),
);

const globalRateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const defaultRateLimitMax = isProduction ? 1000 : 5000;
const globalRateLimitMax = Number(process.env.RATE_LIMIT_MAX || defaultRateLimitMax);

const limiter = rateLimit({
    windowMs:
        Number.isSafeInteger(globalRateLimitWindowMs) && globalRateLimitWindowMs > 0
            ? globalRateLimitWindowMs
            : 15 * 60 * 1000,
    max: Number.isSafeInteger(globalRateLimitMax) && globalRateLimitMax > 0 ? globalRateLimitMax : defaultRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: buildRateLimitHandler("Too many requests, please try again later."),
});

app.use(limiter);

app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
    });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/players", playerRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/tournaments", tournamentRoutes);
app.use("/api/v1/tournament-editions", tournamentEditionRoutes);
app.use("/api/v1/matches", matchRoutes);
app.use("/api/v1/achievements", achievementRoutes);
app.use("/api/v1/history", historyEventRoutes);
app.use("/api/v1/gallery", galleryItemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
