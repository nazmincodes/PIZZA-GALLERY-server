import { Router } from "express";
import {
    createMenuItem,
    getMyMenuItems,
    getPublicMenuItems,
    deleteMenuItem,
    updateMenuItem,
    updateMenuAvailability,
} from "../controllers/menu.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createMenuSchema,
    updateMenuSchema,
    updateMenuAvailabilitySchema,
} from "../validators/menu.validator.js";
const router = Router();

// Get Vendor's Own Menu Items
router.get(
    "/my-items",
    authenticateUser,
    authorizeRoles("vendor"),
    getMyMenuItems
);

// Create Menu Item
router.post(
    "/",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(createMenuSchema),
    createMenuItem
);

// Delete Own Menu Item
router.delete(
    "/:menuItemId",
    authenticateUser,
    authorizeRoles("vendor"),
    deleteMenuItem
);

// Update Own Menu Item
router.patch(
    "/:menuItemId",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(updateMenuSchema),
    updateMenuItem
);
// Get Public Menu Items
router.get("/public", getPublicMenuItems);

// Update Menu Availability
router.patch(
    "/:menuItemId/availability",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(updateMenuAvailabilitySchema),
    updateMenuAvailability
);

export default router;



