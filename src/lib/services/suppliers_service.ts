import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Supplier, SupplierInput } from "../types/suppliers_types";
import { isValidCnpj } from "@/src/helpers/cpf-cnpj";

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export async function listSuppliers(storeId: string): Promise<Supplier[]> {
  const snapshot = await getDocs(collection(db, "store", storeId, "suppliers"));
  return snapshot.docs.map((supplierDoc) => ({ id: supplierDoc.id, ...supplierDoc.data() }) as Supplier)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function saveSupplier(storeId: string, input: SupplierInput): Promise<Supplier> {
  const cnpj = normalizeCnpj(input.cnpj);
  if (!input.name.trim()) throw new Error("Informe o nome do fornecedor.");
  if (!isValidCnpj(cnpj)) throw new Error("Informe um CNPJ válido.");
  if (normalizeCnpj(input.phone).length < 10) throw new Error("Informe um telefone válido.");
  const reference = doc(db, "store", storeId, "suppliers", cnpj);
  const existing = await getDoc(reference);
  const payload = {
    name: input.name.trim(), cnpj, address: input.address.trim(), email: input.email.trim(),
    phone: input.phone.trim(), description: input.description.trim(), updatedAt: serverTimestamp(),
    ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
  };
  await setDoc(reference, payload, { merge: true });
  return { id: cnpj, ...input, ...payload } as Supplier;
}
