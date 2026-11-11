import type { Timestamp } from "firebase/firestore";

export type SupplierInput = {
  name: string;
  cnpj: string;
  address: string;
  email: string;
  phone: string;
  description: string;
};

export type Supplier = SupplierInput & {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
