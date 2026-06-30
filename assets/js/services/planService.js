// ============================================================
// ANIMEX — Plan Service
// ============================================================
import { db } from "../core/firebase.js";
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Planes por defecto (fallback si Firestore está vacío)
export const DEFAULT_PLANS = [
  {
    id: "basic",
    name: "Básico",
    price: 4.99,
    currency: "USD",
    profiles: 1,
    quality: "HD",
    simultaneousScreens: 1,
    features: ["1 perfil", "Calidad HD", "1 pantalla simultánea"],
    codePrefix: "BSC",
    durationDays: 30,
    color: "#6366f1",
  },
  {
    id: "standard",
    name: "Estándar",
    price: 8.99,
    currency: "USD",
    profiles: 3,
    quality: "Full HD",
    simultaneousScreens: 2,
    features: ["3 perfiles", "Calidad Full HD", "2 pantallas simultáneas", "Sin anuncios"],
    codePrefix: "STD",
    durationDays: 30,
    color: "#8b5cf6",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 13.99,
    currency: "USD",
    profiles: 5,
    quality: "4K",
    simultaneousScreens: 4,
    features: ["5 perfiles", "Calidad 4K", "4 pantallas simultáneas", "Sin anuncios", "Descargas offline", "Acceso anticipado"],
    codePrefix: "PREM",
    durationDays: 30,
    color: "#a855f7",
  },
];

// Cache en memoria para evitar lecturas repetidas
let _plansCache = null;
let _plansCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getPlans() {
  // Usar cache si está fresco
  if (_plansCache && Date.now() - _plansCacheTime < CACHE_TTL) {
    return _plansCache;
  }
  try {
    const snap = await getDocs(collection(db, "plans"));
    if (snap.empty) return DEFAULT_PLANS;
    _plansCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _plansCacheTime = Date.now();
    return _plansCache;
  } catch {
    return DEFAULT_PLANS;
  }
}

export async function getPlan(planId) {
  if (!planId) return null;
  try {
    const snap = await getDoc(doc(db, "plans", planId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch {}
  return DEFAULT_PLANS.find(p => p.id === planId) || null;
}

// Inicializar planes en Firestore (llamar una vez desde admin)
export async function seedPlans() {
  for (const plan of DEFAULT_PLANS) {
    await setDoc(doc(db, "plans", plan.id), plan, { merge: true });
  }
  _plansCache = null; // invalidar cache
}
