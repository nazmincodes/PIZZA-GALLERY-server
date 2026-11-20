import { Router } from "express";
import {
    createOrder,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderDetails,
} from "../controllers/order.controller.js";
import { updateOrderStatusSchema } from "../validators/order.validator.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrderSchema } from "../validators/order.validator.js";

const router = Router();

// Customer: Place Order
router.post(
    "/",
    authenticateUser,
    authorizeRoles("customer"),
    validate(createOrderSchema),
    createOrder
);

// Customer: Get My Orders
router.get(
    "/my-orders",
    authenticateUser,
    authorizeRoles("customer"),
    getMyOrders
);

// Vendor: Get Restaurant Orders
router.get(
    "/vendor-orders",
    authenticateUser,
    authorizeRoles("vendor"),
    getVendorOrders
);

// Vendor: Update Order Status
router.patch(
    "/:orderId/status",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

// Customer: Cancel Pending Order
router.patch(
    "/:orderId/cancel",
    authenticateUser,
    authorizeRoles("customer"),
    cancelOrder
);

// Customer & Vendor: Get Order Details
router.get(
    "/:orderId",
    authenticateUser,
    getOrderDetails
);

export default router;