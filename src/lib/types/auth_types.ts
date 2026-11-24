export type UserRole = "store_admin" | "employee";

export type UserProfileInput = {
  name: string;
  email: string;
  role: UserRole;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role?: UserRole;
  phone: string;
  storeId?: string;
  jobTitle?: string;
};

export type StoreProfileInput = {
  name: string;
  cnpj: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  phone: string;
  email: string;
};

export type EditableUserProfile = Pick<UserProfile, "name" | "phone">;

export type TeamEntry = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  status: "Ativo" | "Pendente";
  pending: boolean;
};

