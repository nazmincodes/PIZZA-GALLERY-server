import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { createMenuIndexes } from "./models/menu.model.js";
import { createVendorIndexes } from "./models/vendor.model.js";
import { createOrderIndexes } from "./models/order.model.js";
import { createTransactionIndexes } from "./models/transaction.model.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create database indexes
        await createMenuIndexes();
        await createVendorIndexes();
        await createOrderIndexes();
        await createTransactionIndexes();
        // Start Express server
        app.listen(PORT, () => {
            console.log(`PizzaHub Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();