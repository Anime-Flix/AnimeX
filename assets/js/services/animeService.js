// ============================================================
// ANIMEX — Anime Service (con caché en memoria)
// ============================================================
import { db } from "../core/firebase.js";
import {
  collection, getDocs, getDoc, doc, query,
  orderBy, updateDoc, increment, serverTimestamp, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Cache en memoria (evita lecturas repetidas)
let _cache = null;
let _cacheTs = 0;
const TTL = 5 * 60 * 1000; // 5 min

async function _all() {
  if (_cache && Date.now() - _cacheTs < TTL) return _cache;
  const snap = await getDocs(collection(db, "animes"));
  _cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  _cacheTs = Date.now();
  return _cache;
}

export function invalidateCache() { _cache = null; }

// ── Obtener animes con filtros avanzados
export async function getAnimes(filters = {}) {
  try {
    let list = await _all();

    if (filters.genre)   list = list.filter(a => (a.genres||[]).includes(filters.genre));
    if (filters.status)  list = list.filter(a => a.status === filters.status);
    if (filters.year)    list = list.filter(a => String(a.year) === String(filters.year));
    if (filters.studio)  list = list.filter(a => a.studio === filters.studio);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(s) ||
        a.studio?.toLowerCase().includes(s) ||
        (a.genres||[]).some(g => g.toLowerCase().includes(s))
      );
    }

    if (filters.sortBy === 'views')  list = [...list].sort((a,b) => (b.views||0) - (a.views||0));
    if (filters.sortBy === 'rating') list = [...list].sort((a,b) => (b.rating||0) - (a.rating||0));
    if (filters.sortBy === 'newest') list = [...list].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    if (filters.sortBy === 'alpha')  list = [...list].sort((a,b) => (a.title||'').localeCompare(b.title||''));

    if (filters.limit) list = list.slice(0, filters.limit);
    return list;
  } catch { return []; }
}

export async function getAnime(id) {
  if (_cache) { const c = _cache.find(a => a.id === id); if (c) return c; }
  try {
    const s = await getDoc(doc(db, "animes", id));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch { return null; }
}

export async function getSeasons(animeId) {
  try {
    const s = await getDocs(query(collection(db, "animes", animeId, "seasons"), orderBy("number","asc")));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function getEpisodes(animeId, seasonId) {
  try {
    const s = await getDocs(query(collection(db, "animes", animeId, "seasons", seasonId, "episodes"), orderBy("number","asc")));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function getEpisode(animeId, seasonId, epId) {
  try {
    const s = await getDoc(doc(db, "animes", animeId, "seasons", seasonId, "episodes", epId));
    return s.exists() ? { id: s.id, ...s.data() } : null;
  } catch { return null; }
}

export async function registerView(animeId) {
  try { await updateDoc(doc(db, "animes", animeId), { views: increment(1) }); invalidateCache(); } catch {}
}

export async function getTrending(n=10)     { return getAnimes({ sortBy:'views',  limit: n }); }
export async function getNewReleases(n=10)  { return getAnimes({ sortBy:'newest', limit: n }); }
export async function getByGenre(g, n=10)   { return getAnimes({ genre: g, sortBy:'views', limit: n }); }

export async function getAllGenres() {
  const a = await _all();
  return [...new Set(a.flatMap(x => x.genres||[]))].sort();
}

export async function getAllYears() {
  const a = await _all();
  return [...new Set(a.map(x => x.year).filter(Boolean))].sort((a,b) => b-a);
}

export async function getAllStudios() {
  const a = await _all();
  return [...new Set(a.map(x => x.studio).filter(Boolean))].sort();
}
