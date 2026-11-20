import { Collection } from "mongodb";
import { getDB } from "../config/db.js";
import type { MenuItem } from "../types/menu.types.js";

const COLLECTION_NAME = "menuItems";

export const getMenuCollection = (): Collection<MenuItem> => {
    return getDB().collection<MenuItem>(COLLECTION_NAME);
};

export const createMenuIndexes = async (): Promise<void> => {
    const collection = getMenuCollection();

    await collection.createIndex({ vendorId: 1 });
    await collection.createIndex({ status: 1, isActive: 1 });
    await collection.createIndex({ category: 1, status: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ isFeatured: -1, rating: -1 });

    console.log("Menu collection indexes created successfully!");
};