import {
  createUserWithEmailAndPassword,
  type User,
  getAuth,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import app, { db } from "./firebase";

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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return {
    credential,
    isNewUser: getAdditionalUserInfo(credential)?.isNewUser ?? false,
  };
}

export async function saveUserProfile(user: User, profile: UserProfileInput) {
  const profileRef = doc(db, "users", user.uid);
  const existingProfile = await getDoc(profileRef);

  // Do not replace a previously selected role or profile data on later logins.
  if (existingProfile.exists()) return;

  await setDoc(profileRef, {
    uid: user.uid,
    name: profile.name.trim(),
    email: profile.email,
    role: profile.role,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const profileSnapshot = await getDoc(doc(db, "users", user.uid));
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};

  return {
    uid: user.uid,
    name: typeof profile.name === "string" && profile.name.trim() ? profile.name : user.displayName ?? "",
    email: typeof profile.email === "string" && profile.email.trim() ? profile.email : user.email ?? "",
    role: profile.role === "store_admin" || profile.role === "employee" ? profile.role : undefined,
    phone: typeof profile.phone === "string" ? profile.phone : "",
    storeId: typeof profile.storeId === "string" ? profile.storeId : undefined,
  };
}

export async function createStoreProfile(user: User, store: StoreProfileInput) {
  const userRef = doc(db, "users", user.uid);
  const storeRef = doc(collection(db, "store"));

  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists() || userSnapshot.data().role !== "store_admin") {
      throw new Error("Only store administrators can create a store profile.");
    }

    const existingStoreId = userSnapshot.data().storeId;
    if (typeof existingStoreId === "string" && existingStoreId) return existingStoreId;

    transaction.set(storeRef, {
      storeId: storeRef.id,
      ownerUid: user.uid,
      employeeUids: [],
      name: store.name.trim(),
      cnpj: store.cnpj.replace(/[^0-9A-Z]/gi, "").toUpperCase(),
      address: {
        cep: store.address.cep.trim(),
        street: store.address.street.trim(),
        number: store.address.number.trim(),
        complement: store.address.complement.trim(),
        neighborhood: store.address.neighborhood.trim(),
        city: store.address.city.trim(),
        state: store.address.state.trim().toUpperCase(),
      },
      phone: store.phone.trim(),
      email: store.email.trim(),
      createdAt: serverTimestamp(),
    });
    transaction.update(userRef, { storeId: storeRef.id });
    return storeRef.id;
  });
}

export async function updateUserProfile(user: User, profile: EditableUserProfile) {
  const profileRef = doc(db, "users", user.uid);
  const existingProfile = await getDoc(profileRef);
  const values = {
    uid: user.uid,
    name: profile.name.trim(),
    email: user.email ?? "",
    phone: profile.phone.trim(),
  };

  if (existingProfile.exists()) {
    await updateDoc(profileRef, values);
  } else {
    await setDoc(profileRef, { ...values, createdAt: serverTimestamp() }, { merge: true });
  }
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function signOutUser() {
  return signOut(auth);
}
