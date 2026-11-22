/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { handleStripeWebhook } from "./controllers/subscription-webhook.controller.js";

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

// API routes
app.use("/api", apiRoutes);

export default app;