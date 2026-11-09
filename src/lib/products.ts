import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./auth";

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
    ? categories.filter(
        (category): category is string => typeof category === "string",
      )
    : [];
}

export async function addStoreCategory(
  storeId: string,
  value: string,
): Promise<string> {
  const category = value.trim();
  if (!category) throw new Error("Informe o nome da categoria.");

  const existing = await getStoreCategories(storeId);
  const duplicate = existing.find(
    (item) =>
      item.toLocaleLowerCase("pt-BR") === category.toLocaleLowerCase("pt-BR"),
  );
  if (duplicate) return duplicate;

  await updateDoc(doc(db, "store", storeId), {
    categories: arrayUnion(category),
  });
  return category;
}

export async function createProduct(
  storeId: string,
  input: ProductInput,
): Promise<string> {
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
  const snapshot = await getDocs(
    query(productsCollection, where("storeId", "==", storeId)),
  );
  return snapshot.docs
    .map(
      (productDoc) => ({ id: productDoc.id, ...productDoc.data() }) as Product,
    )
    .sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    );
}

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

export class StockChangedError extends Error {
  constructor(
    public latestStock: number,
    public latestUpdatedAt?: Timestamp,
  ) {
    super("O estoque mudou. Revise a contagem e confirme novamente.");
  }
}

export async function adjustStock(
  storeId: string,
  productId: string,
  type: Exclude<StockMovementType, "sale" | "cancellation">,
  quantity: number,
  reason: string,
  expectedStock: number,
  expectedUpdatedAt?: Timestamp,
): Promise<number> {
  const user = auth.currentUser;
  if (!user) throw new Error("Faça login para ajustar o estoque.");
  if (!Number.isSafeInteger(quantity) || quantity < (type === "count" ? 0 : 1))
    throw new Error("Informe uma quantidade inteira válida.");
  if (reason.trim().length > 500)
    throw new Error("O motivo deve ter no máximo 500 caracteres.");
  const productRef = doc(db, "products", productId);
  const movementRef = doc(collection(productRef, "stockMovements"));
  return runTransaction(db, async (transaction) => {
    const product = await transaction.get(productRef);
    if (!product.exists() || product.data().storeId !== storeId)
      throw new Error("Produto não encontrado nesta loja.");
    const previousStock = product.data().stock;
    if (!Number.isSafeInteger(previousStock) || previousStock < 0)
      throw new Error("Estoque atual inválido.");
    const currentUpdatedAt = product.data().updatedAt as Timestamp | undefined;
    const sameVersion =
      currentUpdatedAt && expectedUpdatedAt
        ? currentUpdatedAt.isEqual(expectedUpdatedAt)
        : !currentUpdatedAt && !expectedUpdatedAt;
    if (type === "count" && (previousStock !== expectedStock || !sameVersion))
      throw new StockChangedError(previousStock, currentUpdatedAt);
    const resultingStock =
      type === "entry"
        ? previousStock + quantity
        : type === "removal"
          ? previousStock - quantity
          : quantity;
    if (!Number.isSafeInteger(resultingStock) || resultingStock < 0)
      throw new Error("A quantidade informada excede o estoque disponível.");
    transaction.update(productRef, {
      stock: resultingStock,
      updatedAt: serverTimestamp(),
      lastMovementId: movementRef.id,
    });
    transaction.set(movementRef, {
      type,
      quantity,
      previousStock,
      resultingStock,
      reason: reason.trim(),
      saleId: "",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return resultingStock;
  });
}

export async function listStockMovements(
  productId: string,
): Promise<StockMovement[]> {
  const snapshot = await getDocs(
    collection(db, "products", productId, "stockMovements"),
  );
  return snapshot.docs
    .map((record) => ({ id: record.id, ...record.data() }) as StockMovement)
    .sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    );
}

export async function getProductStock(
  productId: string,
): Promise<{ stock: number; updatedAt?: Timestamp }> {
  const snapshot = await getDoc(doc(db, "products", productId));
  if (!snapshot.exists()) throw new Error("Produto não encontrado.");
  return { stock: snapshot.data().stock, updatedAt: snapshot.data().updatedAt };
}
