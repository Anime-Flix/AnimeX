// ============================================================
// ANIMEX — User Service
// ============================================================
import { db, auth } from "../core/firebase.js";
import {
  doc, setDoc, getDoc, getDocs, collection,
  deleteDoc, serverTimestamp, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function getActiveProfile() {
  return localStorage.getItem("animex_profile") || "default";
}

// ── Watch progress (stored directly under user for simpler rules)
export async function saveProgress(animeId, seasonId, episodeId, currentTime, duration) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const key = `${animeId}_${seasonId}_${episodeId}`;
  await setDoc(
    doc(db, "users", uid, "watchHistory", key),
    {
      animeId, seasonId, episodeId,
      currentTime, duration,
      progress:  duration ? Math.round((currentTime / duration) * 100) : 0,
      completed: duration ? (currentTime / duration) > 0.92 : false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Cache local
  const local = JSON.parse(localStorage.getItem("animex_progress") || "{}");
  local[key] = { animeId, seasonId, episodeId, currentTime, duration };
  localStorage.setItem("animex_progress", JSON.stringify(local));
}

export async function getProgress(animeId, seasonId, episodeId) {
  const key = `${animeId}_${seasonId}_${episodeId}`;
  const local = JSON.parse(localStorage.getItem("animex_progress") || "{}");
  if (local[key]) return local[key];

  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const s = await getDoc(doc(db, "users", uid, "watchHistory", key));
    return s.exists() ? s.data() : null;
  } catch { return null; }
}

export async function getContinueWatching(limitN = 10) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const s = await getDocs(
      query(collection(db, "users", uid, "watchHistory"),
        orderBy("updatedAt","desc"), limit(limitN))
    );
    return s.docs.map(d => d.data()).filter(d => !d.completed && (d.progress||0) > 2);
  } catch { return []; }
}

// ── Favorites (directly under user)
export async function toggleFavorite(animeId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const ref = doc(db, "users", uid, "favorites", animeId);
  const s   = await getDoc(ref);
  if (s.exists()) { await deleteDoc(ref); return false; }
  await setDoc(ref, { animeId, addedAt: serverTimestamp() });
  return true;
}

export async function isFavorite(animeId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  try {
    const s = await getDoc(doc(db, "users", uid, "favorites", animeId));
    return s.exists();
  } catch { return false; }
}

export async function getFavorites() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const s = await getDocs(collection(db, "users", uid, "favorites"));
    return s.docs.map(d => d.data());
  } catch { return []; }
}

// ── Ratings (directly under user)
export async function rateAnime(animeId, rating) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(
    doc(db, "users", uid, "ratings", animeId),
    { animeId, rating, ratedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getUserRating(animeId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;
  try {
    const s = await getDoc(doc(db, "users", uid, "ratings", animeId));
    return s.exists() ? s.data().rating : 0;
  } catch { return 0; }
}

// ── Profiles
export async function getProfiles() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const s = await getDocs(collection(db, "users", uid, "profiles"));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}
