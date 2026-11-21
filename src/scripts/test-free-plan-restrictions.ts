import "dotenv/config";
import { connectDB } from "../config/db.js";
import { getMenuCollection } from "../models/menu.model.js";
import { applyFreePlanRestrictions } from "../controllers/subscription-webhook.controller.js";
import type { MenuItem } from "../types/menu.types.js";

const testFreePlanRestrictions = async () => {
    const testVendorId = `free-plan-test-${Date.now()}`;

    let menuCollection;

    try {
        await connectDB();

        menuCollection = getMenuCollection();

        const menuItems: Omit<MenuItem, "_id">[] = Array.from(
            { length: 5 },
            (_, index) => ({
                vendorId: testVendorId,
                name: `Test Pizza ${index + 1}`,
                description: "Temporary test pizza for Free Plan restrictions.",
                price: 400 + index * 50,
                category: "Classic",
                image: "https://example.com/test-pizza.jpg",
                restaurantName: "Test Restaurant",
                location: "Dhaka",
                status: "approved",
                isActive: true,
                isFeatured: true,
                rating: 0,
                totalReviews: 0,
                createdAt: new Date(Date.now() + index * 1000),
                updatedAt: new Date(),
            })
        );

        await menuCollection.insertMany(menuItems as MenuItem[]);

        console.log("5 test menu items created.");

        await applyFreePlanRestrictions(testVendorId);

        const updatedItems = await menuCollection
            .find({ vendorId: testVendorId })
            .sort({ createdAt: 1 })
            .toArray();

        const activeCount = updatedItems.filter(
            (item) => item.isActive
        ).length;

        const featuredCount = updatedItems.filter(
            (item) => item.isFeatured
        ).length;

        console.log("Total items:", updatedItems.length);
        console.log("Active items:", activeCount);
        console.log("Featured items:", featuredCount);

        if (activeCount !== 3 || featuredCount !== 0) {
            throw new Error("Free Plan restriction test failed.");
        }

        console.log("SUCCESS: Free Plan restrictions work correctly!");

    } catch (error) {
        console.error("Test failed:", error);
        process.exitCode = 1;

       } finally {
        if (menuCollection) {
            await menuCollection.deleteMany({
                vendorId: testVendorId,
            });
        }

        console.log("Temporary test data cleaned up.");
        process.exit();
    }
}
testFreePlanRestrictions();