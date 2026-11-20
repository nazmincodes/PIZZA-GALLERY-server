import type { ObjectId } from "mongodb";

export type MenuCategory =
    | "Classic"
    | "Vegetarian"
    | "Meat Lovers"
    | "Specialty";

export type MenuItemStatus =
    | "pending"
    | "approved"
    | "rejected";

export interface MenuItem {
    _id?: ObjectId;

    vendorId: string;

    name: string;
    description: string;

    price: number;
    category: MenuCategory;

    image: string;

    restaurantName: string;
    location: string;

    status: MenuItemStatus;
    isActive: boolean;
    isFeatured: boolean;

    rating: number;
    totalReviews: number;

    createdAt: Date;
    updatedAt: Date;
}

export type CreateMenuItemInput = Omit<
    MenuItem,
    | "_id"
    | "vendorId"
    | "status"
    | "isActive"
    | "isFeatured"
    | "rating"
    | "totalReviews"
    | "createdAt"
    | "updatedAt"
>;