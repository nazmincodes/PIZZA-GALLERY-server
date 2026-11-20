import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { UpdateOrderStatusInput } from "../validators/order.validator.js";
import { getOrderCollection } from "../models/order.model.js";
import { getMenuCollection } from "../models/menu.model.js";
import { getVendorCollection } from "../models/vendor.model.js";

import type { CreateOrderInput } from "../validators/order.validator.js";

export const createOrder = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "customer") {
            res.status(403).json({
                success: false,
                message: "Only customers can place orders.",
            });
            return;
        }

        const {
            menuItemId,
            quantity,
            deliveryDate,
            deliveryAddress,
            message,
        } = req.body as CreateOrderInput;

        // Find Menu Item
        const menuItem = await getMenuCollection().findOne({
            _id: new ObjectId(menuItemId),
            status: "approved",
            isActive: true,
        });

        if (!menuItem) {
            res.status(404).json({
                success: false,
                message: "Menu item not found or currently unavailable.",
            });
            return;
        }

        // Check Vendor Approval
        const vendor = await getVendorCollection().findOne({
            userId: menuItem.vendorId,
            status: "approved",
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Restaurant is currently unavailable.",
            });
            return;
        }

        // Prevent Duplicate Active Orders on the Same Date
        const startOfDay = new Date(
            Date.UTC(
                deliveryDate.getUTCFullYear(),
                deliveryDate.getUTCMonth(),
                deliveryDate.getUTCDate()
            )
        );

        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        const existingOrder = await getOrderCollection().findOne({
            customerId: req.user.id,
            menuItemId,
            deliveryDate: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            status: {
                $in: [
                    "pending",
                    "accepted",
                    "preparing",
                    "ready",
                    "out_for_delivery",
                ],
            },
        });

        if (existingOrder) {
            res.status(409).json({
                success: false,
                message: "You already have an active order for this pizza on the selected date.",
            });
            return;
        }

        // Calculate Price on Backend
        const totalPrice = menuItem.price * quantity;

        const newOrder = {
            customerId: req.user.id,
            vendorId: menuItem.vendorId,
            menuItemId,

            pizzaName: menuItem.name,
            pizzaImage: menuItem.image,
            quantity,
            unitPrice: menuItem.price,
            totalPrice,

            deliveryDate,
            deliveryAddress,
            ...(message ? { message } : {}),
            status: "pending" as const,

            statusHistory: [
                {
                    status: "pending" as const,
                    changedAt: new Date(),
                    changedBy: req.user.id,
                    note: "Order placed successfully.",
                },
            ],

            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await getOrderCollection().insertOne(newOrder);

        res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            order: {
                _id: result.insertedId,
                ...newOrder,
            },
        });

    } catch (error) {
        console.error("Create order error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to place order.",
        });
    }
};

export const getMyOrders = async (
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

        const orders = await getOrderCollection()
            .find({ customerId: req.user.id })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Your orders retrieved successfully.",
            total: orders.length,
            orders,
        });

    } catch (error) {
        console.error("Get customer orders error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve your orders.",
        });
    }
};

export const getVendorOrders = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "vendor") {
            res.status(403).json({
                success: false,
                message: "Only vendors can access this resource.",
            });
            return;
        }

        const vendor = await getVendorCollection().findOne({
            userId: req.user.id,
            status: "approved",
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Approved vendor profile not found.",
            });
            return;
        }

        const orders = await getOrderCollection()
            .find({ vendorId: req.user.id })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Vendor orders retrieved successfully.",
            total: orders.length,
            orders,
        });

    } catch (error) {
        console.error("Get vendor orders error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vendor orders.",
        });
    }
};

export const updateOrderStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "vendor") {
            res.status(403).json({
                success: false,
                message: "Only vendors can update order status.",
            });
            return;
        }

        const orderId = req.params.orderId;

        if (typeof orderId !== "string" || !ObjectId.isValid(orderId)) {
            res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
            return;
        }

        const { status } = req.body as UpdateOrderStatusInput;

        const orderCollection = getOrderCollection();

        const order = await orderCollection.findOne({
            _id: new ObjectId(orderId),
            vendorId: req.user.id,
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found.",
            });
            return;
        }

        const allowedTransitions: Record<string, string[]> = {
            pending: ["accepted", "rejected"],
            accepted: ["preparing"],
            preparing: ["ready"],
            ready: ["out_for_delivery"],
            out_for_delivery: ["delivered"],
        };

        const allowedStatuses = allowedTransitions[order.status] || [];

        if (!allowedStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Cannot change order status from ${order.status} to ${status}.`,
            });
            return;
        }

        const result = await orderCollection.updateOne(
            {
                _id: new ObjectId(orderId),
                vendorId: req.user.id,
                status: order.status,
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        status,
                        changedAt: new Date(),
                        changedBy: req.user.id,
                        note: `Order status changed to ${status}.`,
                    },
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(409).json({
                success: false,
                message: "Order status has already been changed. Please refresh.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Order ${status} successfully.`,
        });

    } catch (error) {
        console.error("Update order status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update order status.",
        });
    }
};

export const cancelOrder = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "customer") {
            res.status(403).json({
                success: false,
                message: "Only customers can cancel orders.",
            });
            return;
        }

        const orderId = req.params.orderId;

        if (typeof orderId !== "string" || !ObjectId.isValid(orderId)) {
            res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
            return;
        }

        const result = await getOrderCollection().updateOne(
            {
                _id: new ObjectId(orderId),
                customerId: req.user.id,
                status: "pending",
            },
            {
                $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        status: "cancelled",
                        changedAt: new Date(),
                        changedBy: req.user.id,
                        note: "Order cancelled by customer.",
                    },
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Pending order not found. You can only cancel pending orders.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel order.",
        });
    }
};

export const getOrderDetails = async (
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

        const orderId = req.params.orderId;

        if (typeof orderId !== "string" || !ObjectId.isValid(orderId)) {
            res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
            return;
        }

        const filter: {
            _id: ObjectId;
            customerId?: string;
            vendorId?: string;
        } = {
            _id: new ObjectId(orderId),
        };

        if (req.user.role === "customer") {
            filter.customerId = req.user.id;
        } else if (req.user.role === "vendor") {
            filter.vendorId = req.user.id;
        } else {
            res.status(403).json({
                success: false,
                message: "You do not have permission to view this order.",
            });
            return;
        }

        const order = await getOrderCollection().findOne(filter);

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Order details retrieved successfully.",
            order,
        });

    } catch (error) {
        console.error("Get order details error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve order details.",
        });
    }
};