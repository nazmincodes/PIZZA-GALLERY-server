import { MongoClient, Db } from "mongodb";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "pizza";

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(MONGODB_URI);

let database: Db;
let connectionPromise: Promise<void> | null = null;

export const connectDB = async (): Promise<void> => {
    if (database) return;

    if (!connectionPromise) {
        connectionPromise = client.connect()
            .then(() => {
                database = client.db(DB_NAME);

                console.log("MongoDB connected successfully!");
                console.log(`Database: ${DB_NAME}`);
            })
            .catch((error) => {
                connectionPromise = null;
                console.error("MongoDB connection failed:", error);
                throw error;
            });
    }

    await connectionPromise;
};

export const getDB = (): Db => {
    if (!database) {
        throw new Error("Database is not connected yet!");
    }

    return database;
};