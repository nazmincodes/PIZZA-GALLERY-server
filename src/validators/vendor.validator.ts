import { z } from "zod";

export const createVendorSchema = z.object({
    restaurantName: z
        .string()
        .trim()
        .min(3, "Restaurant name must be at least 3 characters")
        .max(100, "Restaurant name cannot exceed 100 characters"),

    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(500, "Description cannot exceed 500 characters"),

    location: z
        .string()
        .trim()
        .min(5, "Please provide a valid location")
        .max(200, "Location cannot exceed 200 characters"),

    phone: z
        .string()
        .trim()
        .regex(/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi phone number"),

    logo: z
        .string()
        .url("Please provide a valid logo URL"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required to update.",
        }
    );

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

export const vendorApprovalSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

export type VendorApprovalInput = z.infer<
    typeof vendorApprovalSchema
>;