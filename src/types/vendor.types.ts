import type { ObjectId } from "mongodb";

export type VendorStatus = "pending" | "approved" | "rejected";

export type SubscriptionPlan = "free" | "premium";

export type SubscriptionStatus =
    | "inactive"
    | "active"
    | "cancelled"
    | "past_due";

export interface Vendor {
    _id?: ObjectId;
    userId: string;

    restaurantName: string;
    description: string;
    location: string;
    phone: string;
    logo: string;

    status: VendorStatus;

    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;

    createdAt: Date;
    updatedAt: Date;
}