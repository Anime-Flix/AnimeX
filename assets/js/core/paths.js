// ============================================================
// ANIMEX — Smart Path Resolver
// Funciona en Live Server (localhost) Y GitHub Pages (/AnimeX/)
// ============================================================

const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// En GitHub Pages el repo se llama AnimeX → base es /AnimeX/
// En Live Server no hay subfolder → base es /
export const BASE = isLocalhost ? '/' : '/AnimeX/';

// Navegar a una ruta
export function navigate(path) {
  // path ejemplos: 'index.html', 'admin/index.html', 'anime.html?id=xxx'
  window.location.href = BASE + path;
}

// Resolver una URL de asset (CSS, JS, imagen)
export function asset(path) {
  return BASE + path;
}
