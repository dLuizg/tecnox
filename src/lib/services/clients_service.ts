import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

import type { Client, ClientInput } from "../types/clients_types";

const clientsCollection = collection(db, "clients");

export async function listClients(storeId: string): Promise<Client[]> {
  const snapshot = await getDocs(query(clientsCollection, where("storeId", "==", storeId)));
  return snapshot.docs
    .map((clientDoc) => ({ id: clientDoc.id, ...clientDoc.data() }) as Client)
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function createClient(storeId: string, input: ClientInput) {
  const normalized = normalizeClient(input);
  const reference = await addDoc(clientsCollection, {
    ...normalized,
    storeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateClient(clientId: string, input: ClientInput) {
  await updateDoc(doc(db, "clients", clientId), {
    ...normalizeClient(input),
    updatedAt: serverTimestamp(),
  });
}

function normalizeClient(input: ClientInput): ClientInput {
  return {
    name: input.name.trim(),
    cpf: input.cpf.replace(/\D/g, ""),
    birthDate: input.birthDate,
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: {
      cep: input.address.cep.trim(),
      street: input.address.street.trim(),
      number: input.address.number.trim(),
      complement: input.address.complement.trim(),
      neighborhood: input.address.neighborhood.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim().toUpperCase(),
    },
  };
}
