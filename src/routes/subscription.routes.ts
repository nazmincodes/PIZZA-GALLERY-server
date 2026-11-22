import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createSubscriptionCheckout,
    getMySubscription,
} from "../controllers/subscription.controller.js";
const router = Router();

router.get(
    "/me",
    authenticateUser,
    authorizeRoles("vendor"),
    getMySubscription
);

// Create Premium Subscription Checkout
router.post(
    "/checkout",
    authenticateUser,
    authorizeRoles("vendor"),
    createSubscriptionCheckout
);


export default router;