import type { Request, Response } from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { stripe } from "../config/stripe.js";
import { getVendorCollection } from "../models/vendor.model.js";
import { getTransactionCollection } from "../models/transaction.model.js";
import { getMenuCollection } from "../models/menu.model.js";

// Apply Free Plan menu restrictions
export const applyFreePlanRestrictions = async (userId: string) => {
        const menuCollection = getMenuCollection();

    // Get all active menu items, oldest first
    const activeItems = await menuCollection
        .find({
            vendorId: userId,
            isActive: true,
        })
        .sort({
            createdAt: 1,
            _id: 1,
        })
        .toArray();

    // Remove featured status from all vendor items
    await menuCollection.updateMany(
        { vendorId: userId },
        {
            $set: {
                isFeatured: false,
                updatedAt: new Date(),
            },
        }
    );

    // Keep only the first 3 active items
    const excessItemIds = activeItems
        .slice(3)
        .flatMap((item) => (item._id ? [item._id] : []));

    if (excessItemIds.length > 0) {
        await menuCollection.updateMany(
            {
                _id: { $in: excessItemIds },
            },
            {
                $set: {
                    isActive: false,
                    isFeatured: false,
                    updatedAt: new Date(),
                },
            }
        );
    }

    console.log("Free Plan menu restrictions applied:", userId);
};

export const handleStripeWebhook = async (
    req: Request,
    res: Response
): Promise<void> => {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (typeof signature !== "string" || !webhookSecret) {
        res.status(400).json({
            success: false,
            message: "Webhook signature or secret is missing.",
        });
        return;
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            webhookSecret
        );
    } catch (error) {
        console.error("Webhook signature verification failed:", error);

        res.status(400).json({
            success: false,
            message: "Invalid webhook signature.",
        });
        return;
    }

    console.log("Stripe Event Received:", event.type);

    try {
        const vendorCollection = getVendorCollection();

        // 1. Checkout completed
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            if (
                session.mode !== "subscription" ||
                !["paid", "no_payment_required"].includes(
                    session.payment_status
                )
            ) {
                res.status(200).json({ received: true });
                return;
            }

            const vendorId = session.metadata?.vendorId;
            const userId = session.metadata?.userId;

            const subscriptionId =
                typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription?.id;

            if (
                !vendorId ||
                !userId ||
                !ObjectId.isValid(vendorId) ||
                !subscriptionId
            ) {
                res.status(400).json({
                    success: false,
                    message: "Invalid subscription metadata.",
                });
                return;
            }

            const result = await vendorCollection.updateOne(
                {
                    _id: new ObjectId(vendorId),
                    userId,
                    status: "approved",
                },
                {
                    $set: {
                        subscriptionPlan: "premium",
                        subscriptionStatus: "active",
                        stripeSubscriptionId: subscriptionId,
                        updatedAt: new Date(),
                    },
                }
            );

            if (result.matchedCount === 0) {
                res.status(404).json({
                    success: false,
                    message: "Approved vendor not found.",
                });
                return;
            }

            const transactionCollection = getTransactionCollection();

            const existingTransaction =
                await transactionCollection.findOne({
                    stripeSessionId: session.id,
                });

            if (!existingTransaction) {
                const paymentIntentId =
                    typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id;

                await transactionCollection.insertOne({
                    userId,
                    vendorId,
                    type: "subscription",
                    plan: "premium",
                    amount: (session.amount_total || 0) / 100,
                    currency: session.currency?.toLowerCase() || "usd",
                    status: "succeeded",
                    stripeSessionId: session.id,
                    ...(paymentIntentId
                        ? { stripePaymentIntentId: paymentIntentId }
                        : {}),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            console.log("Vendor Premium Subscription Activated:", vendorId);
        }

        // 2. Subscription updated or deleted
        else if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
        ) {
            const subscription = event.data.object as Stripe.Subscription;

            const vendor = await vendorCollection.findOne({
                stripeSubscriptionId: subscription.id,
            });

            if (!vendor) {
                console.error(
                    "Vendor not found for subscription:",
                    subscription.id
                );

                res.status(200).json({ received: true });
                return;
            }

            let subscriptionPlan: "free" | "premium" = "free";

            let subscriptionStatus:
                | "inactive"
                | "active"
                | "cancelled"
                | "past_due" = "inactive";

            if (event.type === "customer.subscription.deleted") {
                subscriptionPlan = "free";
                subscriptionStatus = "cancelled";
            } else if (
                subscription.status === "active" ||
                subscription.status === "trialing"
            ) {
                subscriptionPlan = "premium";
                subscriptionStatus = "active";
            } else if (subscription.status === "past_due") {
                subscriptionPlan = "premium";
                subscriptionStatus = "past_due";
            } else if (subscription.status === "canceled") {
                subscriptionPlan = "free";
                subscriptionStatus = "cancelled";
            }

            await vendorCollection.updateOne(
                { _id: vendor._id },
                {
                    $set: {
                        subscriptionPlan,
                        subscriptionStatus,
                        updatedAt: new Date(),
                    },
                }
            );

            // Apply Free Plan restrictions after Premium ends
            if (subscriptionPlan === "free") {
                await applyFreePlanRestrictions(vendor.userId);
            }

            console.log("Vendor Subscription Updated:", {
                vendorId: vendor._id?.toString(),
                subscriptionPlan,
                subscriptionStatus,
            });
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error("Stripe webhook processing error:", error);

        res.status(500).json({
            success: false,
            message: "Webhook processing failed.",
        });
    }
};