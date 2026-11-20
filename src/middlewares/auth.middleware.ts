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

        if (
            !user.id ||
            !user.email ||
            !["customer", "vendor", "admin"].includes(user.role || "")
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid user information.",
            });
            return;
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role as AuthUser["role"],
        };

        next();

    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
};