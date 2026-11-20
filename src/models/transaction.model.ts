import type { Collection } from "mongodb";
import { getDB } from "../config/db.js";
import type { Transaction } from "../types/transaction.types.js";

const COLLECTION_NAME = "transactions";

export const getTransactionCollection = (): Collection<Transaction> => {
    return getDB().collection<Transaction>(COLLECTION_NAME);
};

export const createTransactionIndexes = async (): Promise<void> => {
    const collection = getTransactionCollection();

    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ vendorId: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ createdAt: -1 });

    // Prevent duplicate Stripe Checkout Sessions
    await collection.createIndex(
        { stripeSessionId: 1 },
        { unique: true }
    );

    console.log("Transaction collection indexes created successfully!");
};