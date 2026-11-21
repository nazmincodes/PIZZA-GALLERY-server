import {
    createRemoteJWKSet,
    jwtVerify,
    type JWTPayload,
} from "jose";

import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const BETTER_AUTH_URL =
    process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Better Auth Public Key
const JWKS = createRemoteJWKSet(
    new URL(`${BETTER_AUTH_URL}/api/auth/jwks`)
);

export interface AuthUser {
    id: string;
    email: string;
    role: "customer" | "vendor" | "admin";
}

interface PizzaHubJWTPayload extends JWTPayload {
    id?: string;
    email?: string;
    role?: string;
}

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
            return;
        }

        const { payload } = await jwtVerify(
            token,
            JWKS,
            {
                issuer: BETTER_AUTH_URL,
                audience: BETTER_AUTH_URL,
            }
        );

        const user = payload as PizzaHubJWTPayload;

        if (!user.id || !user.email) {
            res.status(401).json({
                success: false,
                message: "Invalid user information.",
            });
            return;
        }

        // Find the latest user information from MongoDB
        const userCollection = getDB().collection("user");

        const dbUser = await userCollection.findOne({
            $or: [
                { id: user.id },
                ...(ObjectId.isValid(user.id)
                    ? [{ _id: new ObjectId(user.id) }]
                    : []),
            ],
        });

        // Reject blocked or deleted users
        if (!dbUser || dbUser.banned === true) {
            res.status(403).json({
                success: false,
                message: "Your account is blocked or no longer available.",
            });
            return;
        }

        // Always use the current database role
        const role = dbUser.role;

        if (!["customer", "vendor", "admin"].includes(role)) {
            res.status(403).json({
                success: false,
                message: "Invalid user role.",
            });
            return;
        }

        req.user = {
            id: user.id,
            email: dbUser.email || user.email,
            role: role as AuthUser["role"],
        };

        next();

    } catch (error) {
        console.error("Authentication error:", error);

        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
};