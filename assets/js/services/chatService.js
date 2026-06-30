// ============================================================
// ANIMEX — Chat Service (Usuario ↔ Admin)
// ============================================================
import { db, auth } from "../core/firebase.js";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Enviar mensaje (texto o imagen)
export async function sendMessage(text, imageBase64 = null) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sin sesión");

  await addDoc(collection(db, "users", uid, "messages"), {
    text,
    imageBase64,          // comprobante de pago (base64 pequeño)
    from: "user",
    uid,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Escuchar mensajes en tiempo real
export function listenMessages(uid, callback) {
  const q = query(
    collection(db, "users", uid, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

// Admin: enviar respuesta
export async function adminReply(userId, text) {
  await addDoc(collection(db, "users", userId, "messages"), {
    text,
    imageBase64: null,
    from: "admin",
    uid: "admin",
    read: false,
    createdAt: serverTimestamp(),
  });

  // Notificación
  await addDoc(collection(db, "notifications", userId, "items"), {
    type: "admin_reply",
    title: "Respuesta del administrador",
    body: text.substring(0, 80),
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Marcar mensajes como leídos
export async function markMessagesRead(uid) {
  // Solo actualiza el flag en el documento del usuario
  await updateDoc(doc(db, "users", uid), { unreadMessages: 0 });
}
