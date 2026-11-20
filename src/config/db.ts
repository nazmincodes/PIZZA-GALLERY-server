import { MongoClient, Db } from "mongodb";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "pizzahub";

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(MONGODB_URI);

let database: Db;

export const connectDB = async (): Promise<void> => {
    try {
        await client.connect();

        database = client.db(DB_NAME);

        console.log("MongoDB connected successfully!");
        console.log(`Database: ${DB_NAME}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export const getDB = (): Db => {
    if (!database) {
        throw new Error("Database is not connected yet!");
    }

    return database;
};