import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());

// Root route
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "PizzaHub API is running!",
    });
});

// API routes
app.use("/api", apiRoutes);

export default app;