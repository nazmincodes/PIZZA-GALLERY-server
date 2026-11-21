import { Router } from "express";
import { createSubscriptionCheckout } from "../controllers/subscription.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Create Premium Subscription Checkout
router.post(
    "/checkout",
    authenticateUser,
    authorizeRoles("vendor"),
    createSubscriptionCheckout
);

export default router;