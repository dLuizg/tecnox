import type { Timestamp } from "firebase/firestore";

export type ClientAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ClientInput = {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  address: ClientAddress;
};

export type Client = ClientInput & {
  id: string;
  storeId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
