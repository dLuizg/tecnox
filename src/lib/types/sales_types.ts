import type { Timestamp } from "firebase/firestore";

export type Payment = "Pix" | "Cartão" | "Dinheiro";
export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};
export type Sale = {
  id: string;
  orderNumber: number;
  storeId: string;
  clientId: string;
  customer: string;
  items: SaleItem[];
  totalCents: number;
  payment: Payment;
  status: "Concluída" | "Cancelado";
  cancelled?: boolean;
  cancelledBy?: string;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  stockRestored?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
export type Checkout = {
  storeId: string;
  clientId: string;
  saleId: string;
  payment: Payment;
  items: { productId: string; quantity: number; priceCents: number }[];
};
