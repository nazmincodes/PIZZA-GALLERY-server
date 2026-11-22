import type { Request, Response } from "express";
import { stripe } from "../config/stripe.js";
import { getVendorCollection } from "../models/vendor.model.js";
import { getTransactionCollection } from "../models/transaction.model.js";
import { getMenuCollection } from "../models/menu.model.js";

export const createSubscriptionCheckout = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const vendorCollection = getVendorCollection();

        const vendor = await vendorCollection.findOne({
            userId: user.id,
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor profile not found.",
            });
            return;
        }

        if (vendor.status !== "approved") {
            res.status(403).json({
                success: false,
                message: "Your vendor account is not approved yet.",
            });
            return;
        }

        if (
            vendor.subscriptionPlan === "premium" &&
            vendor.subscriptionStatus === "active"
        ) {
            res.status(400).json({
                success: false,
                message: "You already have an active Premium subscription.",
            });
            return;
        }

        const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

        if (!priceId) {
            res.status(500).json({
                success: false,
                message: "Premium subscription price is not configured.",
            });
            return;
        }

        const clientUrl =
            process.env.CLIENT_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",

            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],

            customer_email: user.email,

            // Redirect to the existing subscription page
            success_url:
                `${clientUrl}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
                `${clientUrl}/dashboard/subscription?canceled=true`,

            metadata: {
                userId: user.id,
                vendorId: vendor._id!.toString(),
            },

            subscription_data: {
                metadata: {
                    userId: user.id,
                    vendorId: vendor._id!.toString(),
                },
            },
        });

        console.log("Created Stripe Checkout Session:", {
            id: session.id,
            mode: session.mode,
            metadata: session.metadata,
            url: session.url,
        });

        res.status(200).json({
            success: true,
            message: "Subscription checkout session created successfully.",
            checkoutUrl: session.url,
        });
    } catch (error) {
        console.error("Create subscription checkout error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create subscription checkout session.",
        });
    }
};

export const getMySubscription = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const vendor = await getVendorCollection().findOne({
            userId: user.id,
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor profile not found.",
            });
            return;
        }

        const [activeMenuCount, transactions] = await Promise.all([
            getMenuCollection().countDocuments({
                vendorId: user.id,
                isActive: true,
            }),

            getTransactionCollection()
                .find({ vendorId: vendor._id!.toString() })
                .sort({ createdAt: -1 })
                .limit(20)
                .toArray(),
        ]);

        let startDate: Date | null = null;
        let expiryDate: Date | null = null;
        let cancelAtPeriodEnd = false;

        if (vendor.stripeSubscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(
                    vendor.stripeSubscriptionId
                );

                const period = subscription as unknown as {
                    start_date?: number;
                    current_period_end?: number;
                    cancel_at_period_end?: boolean;
                };

                startDate = period.start_date
                    ? new Date(period.start_date * 1000)
                    : null;

                expiryDate = period.current_period_end
                    ? new Date(period.current_period_end * 1000)
                    : null;

                cancelAtPeriodEnd =
                    period.cancel_at_period_end ?? false;
            } catch (stripeError) {
                console.error(
                    "Stripe subscription retrieval failed:",
                    stripeError
                );
            }
        }

        const isPremium =
            vendor.subscriptionPlan === "premium";

        res.status(200).json({
            success: true,
            subscription: {
                plan: vendor.subscriptionPlan,
                status: vendor.subscriptionStatus,
                startDate,
                expiryDate,
                cancelAtPeriodEnd,
                activeMenuCount,
                menuLimit: isPremium ? null : 3,
                remainingMenuSlots: isPremium
                    ? null
                    : Math.max(0, 3 - activeMenuCount),
            },
            transactions,
        });
    } catch (error) {
        console.error("Get vendor subscription error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load subscription details.",
        });
    }
};