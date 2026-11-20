import type { ObjectId } from "mongodb";

export type OrderStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";

export interface Order {
    _id?: ObjectId;

    customerId: string;
    vendorId: string;
    menuItemId: string;

    pizzaName: string;
    pizzaImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;

    deliveryDate: Date;
    deliveryAddress: string;
    message?: string;

    status: OrderStatus;
    statusHistory: OrderStatusHistory[];

    createdAt: Date;
    updatedAt: Date;

}

export interface OrderStatusHistory {
    status: OrderStatus;
    changedAt: Date;
    changedBy: string;
    note?: string;
}