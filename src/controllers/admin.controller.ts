import type { Request, Response } from "express";
import { getVendorCollection } from "../models/vendor.model.js";
import { ObjectId } from "mongodb";
import type { VendorApprovalInput } from "../validators/vendor.validator.js";
import { getMenuCollection } from "../models/menu.model.js";
import type { MenuApprovalInput } from "../validators/menu.validator.js";
import { getOrderCollection } from "../models/order.model.js";
import type { OrderStatus } from "../types/order.types.js";
import { getTransactionCollection } from "../models/transaction.model.js";
import { getDB } from "../config/db.js";

// Admin: Get All Pending Vendors
export const getPendingVendors = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const vendors = await getVendorCollection()
            .find({ status: "pending" })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Pending vendors retrieved successfully.",
            total: vendors.length,
            vendors,
        });
    } catch (error) {
        console.error("Get pending vendors error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve pending vendors.",
        });
    }
};

// Admin: Approve or Reject Vendor
export const updateVendorApprovalStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const vendorId = req.params.vendorId;

        if (typeof vendorId !== "string" || !ObjectId.isValid(vendorId)) {
            res.status(400).json({
                success: false,
                message: "Invalid vendor ID.",
            });
            return;
        }

        const { status } = req.body as VendorApprovalInput;

        const result = await getVendorCollection().updateOne(
            {
                _id: new ObjectId(vendorId),
                status: "pending",
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Pending vendor not found or already reviewed.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Vendor ${status} successfully.`,
        });
    } catch (error) {
        console.error("Update vendor approval error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update vendor approval status.",
        });
    }
};

// Get All Pending Menu Items
export const getPendingMenuItems = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItems = await getMenuCollection()
            .find({ status: "pending" })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Pending menu items retrieved successfully.",
            total: menuItems.length,
            menuItems,
        });
    } catch (error) {
        console.error("Get pending menu items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve pending menu items.",
        });
    }
};

// Approve or Reject Menu Item
export const updateMenuApprovalStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuItemId = req.params.menuItemId;

        if (typeof menuItemId !== "string" || !ObjectId.isValid(menuItemId)) {
            res.status(400).json({
                success: false,
                message: "Invalid menu item ID.",
            });
            return;
        }

        const { status } = req.body as MenuApprovalInput;

        const result = await getMenuCollection().updateOne(
            {
                _id: new ObjectId(menuItemId),
                status: "pending",
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Pending menu item not found or already reviewed.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Menu item ${status} successfully.`,
        });
    } catch (error) {
        console.error("Update menu approval error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update menu approval status.",
        });
    }
};

// Admin: Get All Orders with Status Filter
export const getAllOrders = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

        const skip = (page - 1) * limit;

        const validStatuses: OrderStatus[] = [
            "pending",
            "accepted",
            "rejected",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
        ];

        const status = req.query.status;

        const filter: { status?: OrderStatus } = {};

        if (status !== undefined) {
            if (
                typeof status !== "string" ||
                !validStatuses.includes(status as OrderStatus)
            ) {
                res.status(400).json({
                    success: false,
                    message: "Invalid order status.",
                });
                return;
            }

            filter.status = status as OrderStatus;
        }

        const orderCollection = getOrderCollection();

        const [orders, total] = await Promise.all([
            orderCollection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),

            orderCollection.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            orders,
        });
    } catch (error) {
        console.error("Get all orders error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve orders.",
        });
    }
};

// Admin: Get Order Statistics
export const getOrderStatistics = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const orderCollection = getOrderCollection();

        const [
            totalOrders,
            pendingOrders,
            acceptedOrders,
            deliveredOrders,
            cancelledOrders,
            revenueResult,
        ] = await Promise.all([
            orderCollection.countDocuments(),
            orderCollection.countDocuments({ status: "pending" }),
            orderCollection.countDocuments({ status: "accepted" }),
            orderCollection.countDocuments({ status: "delivered" }),
            orderCollection.countDocuments({ status: "cancelled" }),

            orderCollection
                .aggregate([
                    { $match: { status: "delivered" } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$totalPrice" },
                        },
                    },
                ])
                .toArray(),
        ]);

        const deliveredRevenue = revenueResult[0]?.totalRevenue || 0;

        res.status(200).json({
            success: true,
            message: "Order statistics retrieved successfully.",
            statistics: {
                totalOrders,
                pendingOrders,
                acceptedOrders,
                deliveredOrders,
                cancelledOrders,
                deliveredRevenue,
            },
        });
    } catch (error) {
        console.error("Get order statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve order statistics.",
        });
    }
};

// Admin: Get Vendor Statistics
export const getVendorStatistics = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const vendorCollection = getVendorCollection();

        const [
            totalVendors,
            pendingVendors,
            approvedVendors,
            rejectedVendors,
            freeVendors,
            premiumVendors,
        ] = await Promise.all([
            vendorCollection.countDocuments(),
            vendorCollection.countDocuments({ status: "pending" }),
            vendorCollection.countDocuments({ status: "approved" }),
            vendorCollection.countDocuments({ status: "rejected" }),
            vendorCollection.countDocuments({ subscriptionPlan: "free" }),
            vendorCollection.countDocuments({ subscriptionPlan: "premium" }),
        ]);

        res.status(200).json({
            success: true,
            message: "Vendor statistics retrieved successfully.",
            statistics: {
                totalVendors,
                pendingVendors,
                approvedVendors,
                rejectedVendors,
                freeVendors,
                premiumVendors,
            },
        });
    } catch (error) {
        console.error("Get vendor statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vendor statistics.",
        });
    }
};

// Admin: Get All Transactions (with vendor name and email)
export const getAllTransactions = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const validStatuses = ["pending", "succeeded", "failed", "refunded"];

        const status = req.query.status;

        const filter: {
            status?: "pending" | "succeeded" | "failed" | "refunded";
        } = {};

        if (status !== undefined) {
            if (typeof status !== "string" || !validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid transaction status.",
                });
                return;
            }

            filter.status = status as typeof filter.status;
        }

        const transactionCollection = getTransactionCollection();

        const [transactions, total] = await Promise.all([
            transactionCollection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),

            transactionCollection.countDocuments(filter),
        ]);

        // Get vendors for these transactions
        const vendorIds = [
            ...new Set(transactions.map((transaction) => transaction.vendorId)),
        ];

        const validVendorIds = vendorIds
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        const vendors = await getVendorCollection()
            .find({ _id: { $in: validVendorIds } })
            .toArray();

        // Get users of those vendors (user _id is an ObjectId in the DB)
        const userObjectIds = [
            ...new Set(vendors.map((vendor) => vendor.userId)),
        ]
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        const users = await getDB()
            .collection("user")
            .find({ _id: { $in: userObjectIds } })
            .toArray();

        // Lookup maps
        const vendorMap = new Map(
            vendors.map((vendor) => [vendor._id!.toString(), vendor])
        );

        const userMap = new Map(
            users.map((user) => [String(user._id), user])
        );

        const formattedTransactions = transactions.map((transaction) => {
            const vendor = vendorMap.get(transaction.vendorId);
            const user = vendor ? userMap.get(vendor.userId) : undefined;

            return {
                ...transaction,
                id: transaction._id?.toString() || transaction.stripeSessionId,
                vendorName: vendor?.restaurantName || "Unknown Vendor",
                email: user?.email || "N/A",
                plan: transaction.plan,
                paymentMethod: "Stripe",
                date: transaction.createdAt,
            };
        });

        res.status(200).json({
            success: true,
            message: "Transactions retrieved successfully.",
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            transactions: formattedTransactions,
        });
    } catch (error) {
        console.error("Get all transactions error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve transactions.",
        });
    }
};

// Admin: Get Transaction Statistics
export const getTransactionStatistics = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const transactionCollection = getTransactionCollection();

        const [
            totalTransactions,
            pendingTransactions,
            successfulTransactions,
            failedTransactions,
            refundedTransactions,
            revenueResult,
        ] = await Promise.all([
            transactionCollection.countDocuments(),
            transactionCollection.countDocuments({ status: "pending" }),
            transactionCollection.countDocuments({ status: "succeeded" }),
            transactionCollection.countDocuments({ status: "failed" }),
            transactionCollection.countDocuments({ status: "refunded" }),

            transactionCollection
                .aggregate([
                    { $match: { status: "succeeded" } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$amount" },
                        },
                    },
                ])
                .toArray(),
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        res.status(200).json({
            success: true,
            message: "Transaction statistics retrieved successfully.",
            statistics: {
                totalTransactions,
                pendingTransactions,
                successfulTransactions,
                failedTransactions,
                refundedTransactions,
                totalRevenue,
                currency: "usd",
            },
        });
    } catch (error) {
        console.error("Get transaction statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve transaction statistics.",
        });
    }
};

// Admin: Get All Users
export const getAllUsers = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const userCollection = getDB().collection("user");

        const users = await userCollection
            .find(
                {},
                {
                    projection: {
                        name: 1,
                        email: 1,
                        role: 1,
                        banned: 1,
                        createdAt: 1,
                    },
                }
            )
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            total: users.length,
            users: users.map((user) => ({
                id: String(user._id ?? user.id),
                name: user.name,
                email: user.email,
                role: user.role || "customer",
                status: user.banned ? "Blocked" : "Active",
                joinedDate: user.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get all users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve users.",
        });
    }
};

// Admin: Block or Unblock User
export const updateUserBanStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = Array.isArray(req.params.userId)
            ? req.params.userId[0]
            : req.params.userId;

        const { banned } = req.body as { banned?: boolean };

        if (!userId || typeof banned !== "boolean") {
            res.status(400).json({
                success: false,
                message: "Valid user ID and banned status are required.",
            });
            return;
        }

        if (userId === req.user?.id) {
            res.status(400).json({
                success: false,
                message: "You cannot block your own account.",
            });
            return;
        }

        const userCollection = getDB().collection("user");

        const result = await userCollection.updateOne(
            {
                $or: [
                    { id: userId },
                    ...(ObjectId.isValid(userId)
                        ? [{ _id: new ObjectId(userId) }]
                        : []),
                ],
                role: { $in: ["customer", "vendor"] },
            },
            {
                $set: {
                    banned,
                    banReason: banned ? "Blocked by admin" : null,
                    banExpires: null,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not found or cannot be modified.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: banned
                ? "User blocked successfully."
                : "User unblocked successfully.",
        });
    } catch (error) {
        console.error("Update user ban status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user status.",
        });
    }
};

// Admin: Get Menu Statistics
export const getMenuStatistics = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const menuCollection = getMenuCollection();

        const [
            totalMenuItems,
            pendingMenuItems,
            approvedMenuItems,
            rejectedMenuItems,
        ] = await Promise.all([
            menuCollection.countDocuments(),
            menuCollection.countDocuments({ status: "pending" }),
            menuCollection.countDocuments({ status: "approved" }),
            menuCollection.countDocuments({ status: "rejected" }),
        ]);

        res.status(200).json({
            success: true,
            message: "Menu statistics retrieved successfully.",
            statistics: {
                totalMenuItems,
                pendingMenuItems,
                approvedMenuItems,
                rejectedMenuItems,
            },
        });
    } catch (error) {
        console.error("Get menu statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve menu statistics.",
        });
    }
};