import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth } from "./auth";
import { db } from "./firebase";

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

export class CheckoutError extends Error {}

export async function cancelSale(input: { storeId: string; saleId: string; reason: string; restoreStock: boolean }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Faça login para cancelar a venda.");
  const reason = input.reason.trim();
  if (!reason || reason.length > 500) throw new Error("Informe um motivo com até 500 caracteres.");

  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, "sales", input.saleId);
    const snapshot = await transaction.get(saleRef);
    if (!snapshot.exists() || snapshot.data().storeId !== input.storeId)
      throw new Error("Venda não encontrada nesta loja.");
    const sale = snapshot.data() as Sale;
    if (sale.status !== "Concluída" || sale.cancelled)
      throw new Error("Esta venda já foi cancelada ou não pode ser cancelada.");

    const products = input.restoreStock
      ? await Promise.all(sale.items.map((item) => transaction.get(doc(db, "products", item.productId))))
      : [];
    products.forEach((product, index) => {
      const data = product.data();
      const item = sale.items[index];
      if (!data || data.storeId !== input.storeId || !Number.isSafeInteger(data.stock) || !Number.isSafeInteger(data.stock + item.quantity))
        throw new Error(`Não foi possível devolver ${item.name} ao estoque.`);
      const movementRef = doc(collection(product.ref, "stockMovements"));
      const resultingStock = data.stock + item.quantity;
      transaction.update(product.ref, { stock: resultingStock, updatedAt: serverTimestamp(), lastMovementId: movementRef.id });
      transaction.set(movementRef, {
        type: "cancellation", quantity: item.quantity, previousStock: data.stock,
        resultingStock, reason, saleId: input.saleId, createdBy: user.uid, createdAt: serverTimestamp(),
      });
    });
    transaction.update(saleRef, {
      status: "Cancelado", cancelled: true, cancelledBy: user.uid,
      cancelledAt: serverTimestamp(), updatedAt: serverTimestamp(),
      cancellationReason: reason, stockRestored: input.restoreStock,
    });
  });
}

export async function completeSale(input: Checkout) {
  const user = auth.currentUser;
  if (!user) throw new CheckoutError("Faça login para finalizar a venda.");
  if (
    !input.items.length ||
    input.items.length > 5 ||
    new Set(input.items.map((item) => item.productId)).size !==
      input.items.length
  )
    throw new CheckoutError("Selecione de um a cinco produtos diferentes.");
  const saleRef = doc(db, "sales", input.saleId);
  const counterRef = doc(db, "salesCounters", input.storeId);
  const runCheckout = () =>
    runTransaction(db, async (transaction) => {
      const existing = await transaction.get(saleRef);
      if (existing.exists()) {
        const sale = existing.data();
        const matches =
          sale.createdBy === user.uid &&
          sale.storeId === input.storeId &&
          sale.clientId === input.clientId &&
          sale.payment === input.payment &&
          sale.items.length === input.items.length &&
          input.items.every((item) =>
            sale.items.some(
              (line: SaleItem) =>
                line.productId === item.productId &&
                line.quantity === item.quantity &&
                line.unitPriceCents === item.priceCents,
            ),
          );
        if (!matches)
          throw new CheckoutError(
            "Esta venda já foi registrada com outros dados.",
          );
        return {
          saleId: input.saleId,
          orderNumber: sale.orderNumber as number,
        };
      }
      const counter = await transaction.get(counterRef);
      const orderNumber =
        (counter.exists() ? counter.data().lastNumber : 0) + 1;
      if (!Number.isSafeInteger(orderNumber) || orderNumber < 1)
        throw new CheckoutError(
          "Não foi possível obter o próximo número de pedido.",
        );
      const customer = await transaction.get(
        doc(db, "clients", input.clientId),
      );
      const products = await Promise.all(
        input.items.map((item) =>
          transaction.get(doc(db, "products", item.productId)),
        ),
      );
      if (!customer.exists() || customer.data().storeId !== input.storeId)
        throw new CheckoutError("Cliente não encontrado nesta loja.");
      const items = products.map((snapshot, index) => {
        const product = snapshot.data();
        const requested = input.items[index];
        if (!product || product.storeId !== input.storeId)
          throw new CheckoutError("Um produto não está mais disponível.");
        if (
          !Number.isSafeInteger(requested.quantity) ||
          requested.quantity < 1 ||
          !Number.isSafeInteger(product.stock) ||
          product.stock < requested.quantity
        )
          throw new CheckoutError(`Estoque insuficiente para ${product.name}.`);
        const price = Math.round(product.salePrice * 100);
        if (
          !Number.isSafeInteger(price) ||
          price !== requested.priceCents ||
          price / 100 !== product.salePrice
        )
          throw new CheckoutError(
            `O preço de ${product.name} mudou. Revise o carrinho.`,
          );
        const total = price * requested.quantity;
        if (!Number.isSafeInteger(total))
          throw new CheckoutError("Valor da venda inválido.");
        return {
          productId: snapshot.id,
          name: product.name,
          quantity: requested.quantity,
          unitPriceCents: price,
          totalCents: total,
        };
      });
      const totalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
      if (!Number.isSafeInteger(totalCents))
        throw new CheckoutError("Valor da venda inválido.");
      const lines = Object.fromEntries(
        items.map((item) => [item.productId, item]),
      );
      products.forEach((product, index) => {
        const movementRef = doc(collection(product.ref, "stockMovements"));
        const previousStock = product.data()!.stock;
        const resultingStock = previousStock - items[index].quantity;
        transaction.update(product.ref, {
          stock: resultingStock,
          updatedAt: serverTimestamp(),
          lastSaleId: input.saleId,
          lastMovementId: movementRef.id,
        });
        transaction.set(movementRef, {
          type: "sale",
          quantity: items[index].quantity,
          previousStock,
          resultingStock,
          reason: "",
          saleId: input.saleId,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
      });
      transaction.set(counterRef, {
        lastNumber: orderNumber,
        lastSaleId: input.saleId,
      });
      transaction.set(saleRef, {
        orderNumber,
        storeId: input.storeId,
        clientId: input.clientId,
        customer: customer.data().name,
        items,
        lines,
        totalCents,
        payment: input.payment,
        status: "Concluída",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { saleId: input.saleId, orderNumber };
    });
  for (let attempt = 0; ; attempt++) {
    try {
      return await runCheckout();
    } catch (error) {
      if (
        attempt >= 2 ||
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "permission-denied"
      )
        throw error;
    }
  }
}

export async function listSales(storeId: string): Promise<Sale[]> {
  const snapshot = await getDocs(
    query(collection(db, "sales"), where("storeId", "==", storeId)),
  );
  return snapshot.docs
    .map((record) => ({ id: record.id, ...record.data() }) as Sale)
    .sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    );
}
