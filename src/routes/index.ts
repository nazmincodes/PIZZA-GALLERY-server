import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";

import vendorRoutes from "./vendor.routes.js";
import menuRoutes from "./menu.routes.js";
import adminRoutes from "./admin.routes.js";
import orderRoutes from "./order.routes.js";

const router = Router();

// Health Check
router.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "PizzaHub API is healthy!",
    });
});

// Authentication Test
router.get("/me", authenticateUser, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Authentication successful!",
        user: req.user,
    });
});

// Vendor Routes
router.use("/vendors", vendorRoutes);

// Menu Routes
router.use("/menu", menuRoutes);

// Admin Routes
router.use("/admin", adminRoutes);

router.use("/orders", orderRoutes);

export default router;