import type { Collection } from "mongodb";
import { getDB } from "../config/db.js";
import type { Order } from "../types/order.types.js";

const COLLECTION_NAME = "orders";

// Get Order Collection
export const getOrderCollection = (): Collection<Order> => {
    return getDB().collection<Order>(COLLECTION_NAME);
};

// Create Order Indexes
export const createOrderIndexes = async (): Promise<void> => {
    const collection = getOrderCollection();

    await collection.createIndex({ customerId: 1 });
    await collection.createIndex({ vendorId: 1 });
    await collection.createIndex({ menuItemId: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ vendorId: 1, status: 1 });
    await collection.createIndex({ customerId: 1, createdAt: -1 });

    console.log("Order collection indexes created successfully!");
};