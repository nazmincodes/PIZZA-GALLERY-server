import type { Collection } from "mongodb";
import { getDB } from "../config/db.js";
import type { Vendor } from "../types/vendor.types.js";

const COLLECTION_NAME = "vendors";

export const getVendorCollection = (): Collection<Vendor> => {
    return getDB().collection<Vendor>(COLLECTION_NAME);
};

export const createVendorIndexes = async (): Promise<void> => {
    const collection = getVendorCollection();

    // একজন User-এর জন্য একটি Vendor Profile
    await collection.createIndex(
        { userId: 1 },
        { unique: true }
    );

    // Vendor approval status অনুযায়ী খোঁজার জন্য
    await collection.createIndex({ status: 1 });

    // Subscription plan অনুযায়ী খোঁজার জন্য
    await collection.createIndex({
        subscriptionPlan: 1,
        subscriptionStatus: 1,
    });

    console.log("Vendor collection indexes created successfully!");
};