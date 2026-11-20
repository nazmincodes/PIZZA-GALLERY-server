import { z } from "zod";

export const createMenuSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Pizza name must be at least 3 characters")
        .max(80, "Pizza name cannot exceed 80 characters"),

    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(500, "Description cannot exceed 500 characters"),

    price: z
        .number()
        .positive("Price must be greater than zero")
        .max(100000, "Price is too high"),

    category: z.enum([
        "Classic",
        "Vegetarian",
        "Meat Lovers",
        "Specialty",
    ]),

    image: z
        .string()
        .url("Please provide a valid image URL"),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;

export const menuApprovalSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

export type MenuApprovalInput = z.infer<typeof menuApprovalSchema>;

export const updateMenuSchema = createMenuSchema
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required to update.",
        }
    );

export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

export const updateMenuAvailabilitySchema = z.object({
    isActive: z.boolean(),
});

export type UpdateMenuAvailabilityInput = z.infer<
    typeof updateMenuAvailabilitySchema
>;