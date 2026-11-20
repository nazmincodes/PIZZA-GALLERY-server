import type { Request, Response } from "express";
import { getMenuCollection } from "../models/menu.model.js";
import { getVendorCollection } from "../models/vendor.model.js";
import type { MenuItem } from "../types/menu.types.js";
import type { CreateMenuInput } from "../validators/menu.validator.js";
import { ObjectId } from "mongodb";
import type { UpdateMenuInput } from "../validators/menu.validator.js";
import type {
    UpdateMenuAvailabilityInput,
} from "../validators/menu.validator.js";

export const createMenuItem = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        // Find vendor profile
        const vendor = await getVendorCollection().findOne({
            userId: req.user.id,
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor profile not found.",
            });
            return;
        }

        // Check vendor approval
        if (vendor.status !== "approved") {
            res.status(403).json({
                success: false,
                message: "Your restaurant must be approved by admin before adding menu items.",
            });
            return;
        }

        const data = req.body as CreateMenuInput;

        // Check subscription plan
        const isPremium =
            vendor.subscriptionPlan === "premium" &&
            vendor.subscriptionStatus === "active";

        // Free vendor can have maximum 3 active items
        if (!isPremium) {
            const activeItems = await getMenuCollection().countDocuments({
                vendorId: req.user.id,
                isActive: true,
            });

            if (activeItems >= 3) {
                res.status(403).json({
                    success: false,
                    message: "Free plan allows maximum 3 active menu items. Upgrade to Premium for unlimited items.",
                });
                return;
            }
        }

        // Create new menu item
        const newMenuItem: MenuItem = {
            vendorId: req.user.id,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            image: data.image,

            restaurantName: vendor.restaurantName,
            location: vendor.location,

            status: "pending",
            isActive: true,
            isFeatured: false,
            rating: 0,
            totalReviews: 0,

            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await getMenuCollection().insertOne(newMenuItem);

        res.status(201).json({
            success: true,
            message: "Menu item created successfully. Waiting for admin approval.",
            menuItem: {
                ...newMenuItem,
                _id: result.insertedId,
            },
        });

    } catch (error) {
        console.error("Create menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create menu item.",
        });
    }
};

export const getMyMenuItems = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const menuItems = await getMenuCollection()
            .find({
                vendorId: req.user.id,
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Your menu items retrieved successfully.",
            total: menuItems.length,
            menuItems,
        });

    } catch (error) {
        console.error("Get vendor menu items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve your menu items.",
        });
    }
};


// Get All Approved and Active Menu Items
export const getPublicMenuItems = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItems = await getMenuCollection()
            .find({
                status: "approved",
                isActive: true,
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Menu items retrieved successfully.",
            total: menuItems.length,
            menuItems,
        });

    } catch (error) {
        console.error("Get public menu items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve menu items.",
        });
    }
};

// Delete Own Menu Item
export const deleteMenuItem = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItemId = req.params.menuItemId;

        if (
            typeof menuItemId !== "string" ||
            !ObjectId.isValid(menuItemId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid menu item ID.",
            });
            return;
        }

        const result = await getMenuCollection().deleteOne({
            _id: new ObjectId(menuItemId),
            vendorId: req.user!.id,
        });

        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Menu item not found or you do not have permission to delete it.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully.",
        });

    } catch (error) {
        console.error("Delete menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete menu item.",

        });

    }
};

// Update Own Menu Item
export const updateMenuItem = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItemId = req.params.menuItemId;

        if (
            typeof menuItemId !== "string" ||
            !ObjectId.isValid(menuItemId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid menu item ID.",
            });
            return;
        }

        const data = req.body as UpdateMenuInput;

        const result = await getMenuCollection().updateOne(
            {
                _id: new ObjectId(menuItemId),
                vendorId: req.user!.id,
            },
            {
                $set: {
                    ...data,
                    status: "pending",
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Menu item not found or you do not have permission to update it.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully. It is pending admin review.",
        });

    } catch (error) {
        console.error("Update menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update menu item.",
        });
    }
};

// Update Menu Availability
export const updateMenuAvailability = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItemId = req.params.menuItemId;

        if (
            typeof menuItemId !== "string" ||
            !ObjectId.isValid(menuItemId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid menu item ID.",
            });
            return;
        }

        const { isActive } = req.body as UpdateMenuAvailabilityInput;

        const result = await getMenuCollection().updateOne(
            {
                _id: new ObjectId(menuItemId),
                vendorId: req.user!.id,
                status: "approved",
            },
            {
                $set: {
                    isActive,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Approved menu item not found or you do not have permission.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Menu item ${isActive ? "activated" : "deactivated"} successfully.`,
        });

    } catch (error) {
        console.error("Update menu availability error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update menu availability.",
        });
    }
};