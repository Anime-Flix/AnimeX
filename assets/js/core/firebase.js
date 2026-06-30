// ============================================================
// ANIMEX — Firebase Core
// Firestore + Realtime Database + Offline Cache
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDvJ0JNoakC4Ptpliyu-fy9w4zOarCNEeM",
  authDomain:        "animex-f9e35.firebaseapp.com",
  projectId:         "animex-f9e35",
  storageBucket:     "animex-f9e35.firebasestorage.app",
  messagingSenderId: "1038414607735",
  appId:             "1:1038414607735:web:36da98d55a2449bb0b5d72",
  databaseURL:       "https://animex-f9e35-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export const rtdb = getDatabase(app);

// Offline cache — datos disponibles sin internet
enableIndexedDbPersistence(db).catch(err => {
  if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
    console.warn('Persistence error:', err.code);
  }
});

export default app;
