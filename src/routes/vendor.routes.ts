import { Router } from "express";
import {
    createVendorProfile,
    getVendorProfile,
    updateVendorProfile,
} from "../controllers/vendor.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import { createVendorSchema, updateVendorSchema } from "../validators/vendor.validator.js";

const router = Router();

// Create Vendor Profile
router.post(
    "/profile",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(createVendorSchema),
    createVendorProfile
);

// Get Vendor Profile
router.get(
    "/profile",
    authenticateUser,
    authorizeRoles("vendor"),
    getVendorProfile
);

// Update Vendor Profile
router.patch(
    "/profile",
    authenticateUser,
    authorizeRoles("vendor"),
    validate(updateVendorSchema),
    updateVendorProfile
);

export default router;
