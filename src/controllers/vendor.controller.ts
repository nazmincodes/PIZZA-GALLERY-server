import type { Request, Response } from "express";
import { getVendorCollection } from "../models/vendor.model.js";
import type {
    CreateVendorInput,
    UpdateVendorInput,
} from "../validators/vendor.validator.js";
export const createVendorProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const existingVendor = await getVendorCollection().findOne({
            userId: req.user.id,
        });

        if (existingVendor) {
            res.status(409).json({
                success: false,
                message: "Vendor profile already exists.",
            });
            return;
        }

        const data = req.body as CreateVendorInput;

        const newVendor = {
            userId: req.user.id,
            restaurantName: data.restaurantName,
            description: data.description,
            location: data.location,
            phone: data.phone,
            logo: data.logo,

            status: "pending" as const,

            subscriptionPlan: "free" as const,
            subscriptionStatus: "inactive" as const,

            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await getVendorCollection().insertOne(newVendor);

        res.status(201).json({
            success: true,
            message: "Vendor profile created successfully. Waiting for admin approval.",
            vendor: {
                id: result.insertedId,
                ...newVendor,
            },
        });
    } catch (error) {
        console.error("Create vendor profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create vendor profile.",
        });
    }
};

export const getVendorProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const vendor = await getVendorCollection().findOne({
            userId: req.user.id,
        });

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor profile not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Vendor profile retrieved successfully.",
            vendor,
        });

    } catch (error) {
        console.error("Get vendor profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vendor profile.",
        });
    }
};

export const updateVendorProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const data = req.body as UpdateVendorInput;

        const result = await getVendorCollection().updateOne(
            { userId: req.user.id },
            {
                $set: {
                    ...data,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Vendor profile not found.",
            });
            return;
        }

        const updatedVendor = await getVendorCollection().findOne({
            userId: req.user.id,
        });

        res.status(200).json({
            success: true,
            message: "Vendor profile updated successfully.",
            vendor: updatedVendor,
        });

    } catch (error) {
        console.error("Update vendor profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update vendor profile.",
        });
    }
};