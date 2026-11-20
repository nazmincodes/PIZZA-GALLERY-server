import { z } from "zod";

export const createOrderSchema = z.object({
    menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid menu item ID"),

    quantity: z.number()
        .int("Quantity must be a whole number")
        .min(1, "Minimum quantity is 1")
        .max(20, "Maximum quantity is 20"),

    deliveryDate: z.coerce.date()
        .refine(
            (date) => date > new Date(),
            "Delivery date must be in the future"
        ),

    deliveryAddress: z.string()
        .trim()
        .min(10, "Delivery address must be at least 10 characters")
        .max(300, "Delivery address is too long"),

    message: z.string()
        .trim()
        .max(300, "Message cannot exceed 300 characters")
        .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
    status: z.enum([
        "accepted",
        "rejected",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
    ]),
});

export type UpdateOrderStatusInput = z.infer<
    typeof updateOrderStatusSchema
>;