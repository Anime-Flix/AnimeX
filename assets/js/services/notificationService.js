// ============================================================
// ANIMEX — Notification Service (Realtime Database)
// ============================================================
import { rtdb, db } from "../core/firebase.js";
import {
  ref, onValue, set, push, update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Escuchar notificaciones en tiempo real (RTDB = instantáneo)
export function listenNotifications(uid, callback) {
  const r = ref(rtdb, `notifications/${uid}/items`);
  return onValue(r, snap => {
    const items = [];
    snap.forEach(child => items.push({ id: child.key, ...child.val() }));
    callback(items.reverse());
  });
}

export function listenUnreadCount(uid, callback) {
  const r = ref(rtdb, `notifications/${uid}/unread`);
  return onValue(r, snap => callback(snap.val() || 0));
}

// Enviar notificación (admin → usuario)
export async function sendNotification(userId, { type, title, body }) {
  // RTDB — llega al instante
  const itemsRef = ref(rtdb, `notifications/${userId}/items`);
  await push(itemsRef, { type, title, body, read: false, createdAt: Date.now() });

  // Incrementar contador de no leídas
  const countRef = ref(rtdb, `notifications/${userId}/unread`);
  onValue(countRef, snap => {
    set(countRef, (snap.val() || 0) + 1);
  }, { onlyOnce: true });

  // Firestore — para historial permanente
  try {
    await addDoc(collection(db, "notifications", userId, "items"), {
      type, title, body, read: false, createdAt: serverTimestamp()
    });
  } catch {}
}

export async function markRead(uid, notifId) {
  await update(ref(rtdb, `notifications/${uid}/items/${notifId}`), { read: true });
  const countRef = ref(rtdb, `notifications/${uid}/unread`);
  onValue(countRef, snap => {
    set(countRef, Math.max(0, (snap.val() || 0) - 1));
  }, { onlyOnce: true });
}

export async function markAllRead(uid) {
  await set(ref(rtdb, `notifications/${uid}/unread`), 0);
}
