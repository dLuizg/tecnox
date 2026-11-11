import type { Timestamp } from "firebase/firestore";

export type ProductInput = {
  name: string;
  description: string;
  sku: string;
  category: string;
  brand: string;
  model: string;
  isPhysicalProduct: boolean;
  stock: number;
  purchasePrice: number;
  salePrice: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  supplier: string;
};

export type Product = ProductInput & {
  id: string;
  storeId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type StockMovementType = "entry" | "removal" | "count" | "sale" | "cancellation";
export type StockMovement = {
  id: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  createdBy: string;
  createdAt: Timestamp;
  reason: string;
  saleId: string;
};
