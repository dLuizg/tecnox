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
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import app, { db } from "./firebase";

export type UserRole = "store_admin" | "employee";

export type UserProfileInput = {
  name: string;
  email: string;
  role: UserRole;
};

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

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function signOutUser() {
  return signOut(auth);
}
