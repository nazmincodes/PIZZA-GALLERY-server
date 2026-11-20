import type { ObjectId } from "mongodb";

export type TransactionType = "subscription";

export type TransactionStatus =
    | "pending"
    | "succeeded"
    | "failed"
    | "refunded";

export interface Transaction {
    _id?: ObjectId;

    userId: string;
    vendorId: string;

    type: TransactionType;
    plan: "premium";

    amount: number;
    currency: "usd";

    status: TransactionStatus;

    stripeSessionId: string;
    stripePaymentIntentId?: string;

    createdAt: Date;
    updatedAt: Date;
}