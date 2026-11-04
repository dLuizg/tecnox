import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

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

const productsCollection = collection(db, "products");

export async function getStoreCategories(storeId: string): Promise<string[]> {
  const snapshot = await getDoc(doc(db, "store", storeId));
  if (!snapshot.exists()) throw new Error("Loja não encontrada.");
  const categories = snapshot.data().categories;
  return Array.isArray(categories)
    ? categories.filter((category): category is string => typeof category === "string")
    : [];
}

export async function addStoreCategory(storeId: string, value: string): Promise<string> {
  const category = value.trim();
  if (!category) throw new Error("Informe o nome da categoria.");

  const existing = await getStoreCategories(storeId);
  const duplicate = existing.find((item) => item.toLocaleLowerCase("pt-BR") === category.toLocaleLowerCase("pt-BR"));
  if (duplicate) return duplicate;

  await updateDoc(doc(db, "store", storeId), { categories: arrayUnion(category) });
  return category;
}

export async function createProduct(storeId: string, input: ProductInput): Promise<string> {
  const reference = await addDoc(productsCollection, {
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    sku: input.sku.trim().toUpperCase(),
    category: input.category.trim(),
    brand: input.brand.trim(),
    model: input.model.trim(),
    supplier: input.supplier.trim(),
    storeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function listProducts(storeId: string): Promise<Product[]> {
  const snapshot = await getDocs(query(productsCollection, where("storeId", "==", storeId)));
  return snapshot.docs
    .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }) as Product)
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}
