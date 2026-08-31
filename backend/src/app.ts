import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import rateLimit from "express-rate-limit";
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
const sessionSecret = process.env.SESSION_SECRET || "development-session-secret";

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: sessionSecret,
        name: process.env.SESSION_NAME || "hockey_iitbhu_sid",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 12,
        },
    }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
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
