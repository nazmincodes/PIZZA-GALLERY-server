import { Router } from "express";
import {
    getPendingVendors,
    updateVendorApprovalStatus,
    getPendingMenuItems,
    updateMenuApprovalStatus,
    getAllOrders,
    getOrderStatistics,
    getVendorStatistics,
    getAllTransactions,
    getTransactionStatistics,
} from "../controllers/admin.controller.js";

import { menuApprovalSchema } from "../validators/menu.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import { vendorApprovalSchema } from "../validators/vendor.validator.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Get All Pending Vendors
router.get(
    "/vendors/pending",
    authenticateUser,
    authorizeRoles("admin"),
    getPendingVendors
);

// Approve or Reject Vendor
router.patch(
    "/vendors/:vendorId/status",
    authenticateUser,
    authorizeRoles("admin"),
    validate(vendorApprovalSchema),
    updateVendorApprovalStatus
);

// Get All Pending Menu Items
router.get(
    "/menu/pending",
    authenticateUser,
    authorizeRoles("admin"),
    getPendingMenuItems
);

// Approve or Reject Menu Item
router.patch(
    "/menu/:menuItemId/status",
    authenticateUser,
    authorizeRoles("admin"),
    validate(menuApprovalSchema),
    updateMenuApprovalStatus
);

// Admin: Get All Orders
router.get(
    "/orders",
    authenticateUser,
    authorizeRoles("admin"),
    getAllOrders
);

// Admin: Get Order Statistics
router.get(
    "/orders/statistics",
    authenticateUser,
    authorizeRoles("admin"),
    getOrderStatistics
);

// Admin: Get Vendor Statistics
router.get(
    "/vendors/statistics",
    authenticateUser,
    authorizeRoles("admin"),
    getVendorStatistics
);

// Admin: Get All Transactions
router.get(
    "/transactions",
    authenticateUser,
    authorizeRoles("admin"),
    getAllTransactions
);

// Admin: Get Transaction Statistics
router.get(
    "/transactions/statistics",
    authenticateUser,
    authorizeRoles("admin"),
    getTransactionStatistics
);

export default router;

