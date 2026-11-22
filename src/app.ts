/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { handleStripeWebhook } from "./controllers/subscription-webhook.controller.js";
import { connectDB } from "./config/db.js";
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);

// Stripe Webhook - Raw Body Required
app.post(
    "/api/subscriptions/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

app.use(express.json());

// Root route
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "PizzaHub API is running!",
    });
});
// Ensure MongoDB is connected before API requests
app.use("/api", async (_req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
        });
    }
});
// API routes
app.use("/api", apiRoutes);

export default app;