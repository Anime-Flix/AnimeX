// ============================================================
// ANIMEX — Auth Service
// ============================================================
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Register
export async function registerUser(email, password, planId) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    email, planId,
    status:         "pending",
    role:           "user",
    createdAt:      serverTimestamp(),
    activatedAt:    null,
    activationCode: null,
  });

  await setDoc(doc(db, "users", uid, "profiles", "default"), {
    name:      email.split("@")[0],
    avatar:    "default",
    color:     "#9333ea",
    language:  "es",
    isDefault: true,
    createdAt: serverTimestamp(),
  });

  return uid;
}

// ── Login with retry (Firestore token needs a moment)
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;

  for (let i = 0; i < 4; i++) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) return { uid, ...snap.data() };
    } catch (e) {
      if (i === 3) throw e;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return { uid, status: "pending", role: "user", email };
}

// ── Logout
export async function logoutUser() {
  await signOut(auth);
  localStorage.removeItem("animex_profile");
  localStorage.removeItem("animex_user");
  localStorage.removeItem("animex_progress");
}

// ── Get current user data
export async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? { uid: user.uid, ...snap.data() } : null;
  } catch { return null; }
}

// ── Auth observer
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Reset password email
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Activate account
export async function activateAccount(code) {
  const cleaned  = code.toUpperCase().trim();
  const codeRef  = doc(db, "activationCodes", cleaned);
  const codeSnap = await getDoc(codeRef);

  if (!codeSnap.exists())                throw new Error("Código inválido");
  const d = codeSnap.data();
  if (d.used)                            throw new Error("Este código ya fue utilizado");

  // Check expiration
  const expDate = d.expiresAt?.toDate ? d.expiresAt.toDate() : new Date(d.expiresAt);
  if (expDate < new Date())              throw new Error("Código expirado");

  const uid = auth.currentUser?.uid;
  if (!uid)                              throw new Error("No hay sesión activa");
  if (d.userId && d.userId !== uid)      throw new Error("Este código no te pertenece");

  // Step 1: Update user document (user can always update their own doc)
  await updateDoc(doc(db, "users", uid), {
    status:         "active",
    activatedAt:    serverTimestamp(),
    activationCode: cleaned,
    planId:         d.planId,
  });

  // Step 2: Mark code as used — try but don't fail activation if this fails
  try {
    await updateDoc(codeRef, {
      used:   true,
      usedAt: serverTimestamp(),
      usedBy: uid,
    });
  } catch (e) {
    // Rules might restrict this — log but don't block the user
    console.warn("Could not mark code as used:", e.message);
  }

  return d.planId;
}

// ── Change password (requires re-auth)
export async function changePassword(currentPass, newPass) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPass);
}

// ── Update user document fields
export async function updateUserProfile(data) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No hay sesión");
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}
