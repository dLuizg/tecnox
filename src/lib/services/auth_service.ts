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
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction,
  serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";

import app, { db } from "../firebase";
import type { EditableUserProfile, StoreProfileInput, TeamEntry, UserProfile, UserProfileInput } from "../types/auth_types";

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const teamRoles = new Set(["Administrador", "Gerente", "Vendedor", "Financeiro", "Técnico"]);
const normalizedEmail = (email: string) => email.trim().toLocaleLowerCase("en-US");
const invitationRefForEmail = (email: string) => doc(db, "employeeInvitations", normalizedEmail(email));

export async function createStoreInvitation(owner: User, storeId: string, emailInput: string, jobTitle: string) {
  const email = normalizedEmail(emailInput);
  if (!/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(email) || !teamRoles.has(jobTitle)) {
    throw new Error("Informe um e-mail e um cargo válidos.");
  }

  const profileRef = doc(db, "users", owner.uid);
  const profile = await getDoc(profileRef);
  if (!profile.exists() || profile.data()?.role !== "store_admin" || !storeId) {
    throw new Error("Somente o administrador de uma loja pode convidar funcionários.");
  }

  const storeRef = doc(db, "store", storeId);
  const invitationRef = invitationRefForEmail(email);
  const storeSnapshot = await getDoc(storeRef);
  if (!storeSnapshot.exists() || storeSnapshot.data().ownerUid !== owner.uid) {
    throw new Error("Você não administra esta loja.");
  }

  await setDoc(invitationRef, {
    email,
    storeId,
    ownerUid: owner.uid,
    jobTitle,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function claimStoreInvitation(user: User, suppliedName = "") {
  const email = normalizedEmail(user.email ?? "");
  if (!email) return false;

  const invitationRef = invitationRefForEmail(email);
  const profileRef = doc(db, "users", user.uid);
  return runTransaction(db, async (transaction) => {
    const [invitationSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(invitationRef), transaction.get(profileRef),
    ]);
    if (!invitationSnapshot.exists()) return false;

    const invitation = invitationSnapshot.data();
    const storeId = invitation.storeId;
    const jobTitle = invitation.jobTitle;
    if (invitation.status !== "pending" || invitation.email !== email || typeof storeId !== "string" || !teamRoles.has(jobTitle)) return false;

    const memberRef = doc(db, "store", storeId, "members", user.uid);
    const memberSnapshot = await transaction.get(memberRef);
    const profile = profileSnapshot.data();
    if (profile?.role === "store_admin") return false;
    if (typeof profile?.storeId === "string" && profile.storeId && profile.storeId !== storeId) return false;

    const name = (typeof profile?.name === "string" && profile.name.trim())
      || suppliedName.trim()
      || user.displayName?.trim()
      || email.split("@")[0];
    const profileValues = profileSnapshot.exists()
      ? { storeId, jobTitle }
      : {
          uid: user.uid,
          name,
          email,
          role: "employee",
          storeId,
          jobTitle,
          createdAt: serverTimestamp(),
        };

    if (profileSnapshot.exists()) transaction.update(profileRef, profileValues);
    else transaction.set(profileRef, profileValues);
    transaction.set(memberRef, {
      uid: user.uid,
      storeId,
      email,
      name,
      jobTitle,
      status: "Ativo" as const,
      joinedAt: memberSnapshot.data()?.joinedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.delete(invitationRef);
    return true;
  });
}

export function subscribeToStoreInvitation(user: User, onInvitation: (exists: boolean) => void, onError: (error: Error) => void) {
  const ref = invitationRefForEmail(user.email ?? "");
  return onSnapshot(ref, (snapshot) => {
    const invitation = snapshot.data();
    onInvitation(snapshot.exists() && invitation?.status === "pending" && invitation.email === normalizedEmail(user.email ?? ""));
  }, onError);
}

export function subscribeToStoreTeam(storeId: string, onMembers: (members: TeamEntry[]) => void, onError: (error: Error) => void, onReady: () => void) {
  let members: TeamEntry[] = [];
  let invitations: TeamEntry[] = [];
  let membersReady = false;
  let invitationsReady = false;
  const publish = () => {
    if (!membersReady || !invitationsReady) return;
    onMembers([...members, ...invitations]);
    onReady();
  };
  const membersQuery = query(collection(db, "store", storeId, "members"));
  const invitationsQuery = query(collection(db, "employeeInvitations"), where("storeId", "==", storeId));
  const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
    membersReady = true;
    members = snapshot.docs.map((item) => ({
      id: item.id,
      name: typeof item.data().name === "string" ? item.data().name : "Funcionário",
      email: typeof item.data().email === "string" ? item.data().email : "",
      jobTitle: typeof item.data().jobTitle === "string" ? item.data().jobTitle : "Funcionário",
      status: "Ativo",
      pending: false,
    }));
    publish();
  }, onError);
  const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
    invitationsReady = true;
    invitations = snapshot.docs.filter((item) => item.data().status === "pending").map((item) => ({
      id: item.id,
      name: "Convite pendente",
      email: item.data().email,
      jobTitle: item.data().jobTitle,
      status: "Pendente" as const,
      pending: true,
    }));
    publish();
  }, onError);

  return () => { unsubscribeMembers(); unsubscribeInvitations(); };
}

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, normalizedEmail(email), password);
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
  await claimStoreInvitation(user, profile.name.trim());
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
    jobTitle: typeof profile.jobTitle === "string" ? profile.jobTitle : undefined,
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

    transaction.set(storeRef, {
      storeId: storeRef.id,
      ownerUid: user.uid,
      employeeUids: [],
      categories: [],
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

export async function listOwnedStores(user: User) {
  const snapshot = await getDocs(query(collection(db, "store"), where("ownerUid", "==", user.uid)));
  return snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name || "Loja"), city: String(item.data().address?.city || ""), state: String(item.data().address?.state || "") }));
}

export async function canAccessStore(user: User, storeId: string) {
  const profile = await getUserProfile(user);
  if (profile.role === "employee") {
    if (profile.storeId !== storeId) return false;
    const member = await getDoc(doc(db, "store", storeId, "members", user.uid));
    return member.exists() && member.data().uid === user.uid && member.data().storeId === storeId && member.data().status === "Ativo";
  }
  if (profile.role !== "store_admin") return false;
  const store = await getDoc(doc(db, "store", storeId));
  return store.exists() && store.data().ownerUid === user.uid;
}
