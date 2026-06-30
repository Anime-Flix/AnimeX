// ============================================================
// ANIMEX — Recommendation Engine
// ============================================================
import { db, auth } from "../core/firebase.js";
import { getAnimes } from "./animeService.js";
import { getContinueWatching, getFavorites } from "./userService.js";
import {
  collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Score-based recommendation algorithm
// Factors: shared genres, same studio, popularity, ratings, history
export async function getRecommendations(limitN = 12) {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const [allAnimes, favorites, history] = await Promise.all([
    getAnimes(),
    getFavorites(),
    getContinueWatching(20),
  ]);

  // Get user's watched anime IDs
  const watchedIds = new Set([
    ...favorites.map(f => f.animeId),
    ...history.map(h => h.animeId),
  ]);

  // Build genre preference map from watched
  const genreScore = {};
  const studioScore = {};

  const watched = allAnimes.filter(a => watchedIds.has(a.id));
  watched.forEach(a => {
    (a.genres || []).forEach(g => {
      genreScore[g] = (genreScore[g] || 0) + 1;
    });
    if (a.studio) studioScore[a.studio] = (studioScore[a.studio] || 0) + 1;
  });

  // Score unwatched animes
  const candidates = allAnimes
    .filter(a => !watchedIds.has(a.id))
    .map(a => {
      let score = 0;

      // Genre match (most influential)
      (a.genres || []).forEach(g => {
        score += (genreScore[g] || 0) * 3;
      });

      // Studio match
      if (a.studio && studioScore[a.studio]) {
        score += studioScore[a.studio] * 2;
      }

      // Popularity bonus
      score += Math.log10((a.views || 0) + 1);

      // Rating bonus
      score += (a.rating || 0) * 0.5;

      return { ...a, _score: score };
    })
    .sort((a, b) => b._score - a._score);

  // If no history yet → return trending
  if (!watched.length) return allAnimes.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limitN);

  return candidates.slice(0, limitN);
}

// ── "Because you watched X" recommendations
export async function getBecauseYouWatched(animeId, limitN = 6) {
  const [anime, allAnimes] = await Promise.all([
    getDoc(doc(db, "animes", animeId)).then(s => s.exists() ? { id: s.id, ...s.data() } : null),
    getAnimes(),
  ]);

  if (!anime) return [];

  return allAnimes
    .filter(a => a.id !== animeId)
    .map(a => {
      let score = 0;
      const sharedGenres = (a.genres || []).filter(g => (anime.genres || []).includes(g));
      score += sharedGenres.length * 4;
      if (a.studio === anime.studio) score += 3;
      score += Math.log10((a.views || 0) + 1) * 0.5;
      return { ...a, _score: score, _reason: sharedGenres[0] };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limitN);
}
