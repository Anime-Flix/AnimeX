// ============================================================
// ANIMEX — Carousel Component
// ============================================================

export function createCarousel({ title, animes, onCardClick, showProgress = false }) {
  if (!animes || !animes.length) return null;

  const section = document.createElement("section");
  section.className = "carousel-section";

  section.innerHTML = `
    <div class="carousel-header">
      <h2 class="carousel-title">${title}</h2>
      <div class="carousel-controls">
        <button class="carousel-btn carousel-prev" aria-label="Anterior">
          <svg viewBox="0 0 24 24" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="carousel-btn carousel-next" aria-label="Siguiente">
          <svg viewBox="0 0 24 24" width="20" height="20"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
    <div class="carousel-track-wrap">
      <div class="carousel-track"></div>
    </div>
  `;

  const track = section.querySelector(".carousel-track");

  animes.forEach((anime, idx) => {
    const card = createAnimeCard(anime, showProgress, idx);
    card.addEventListener("click", () => onCardClick && onCardClick(anime));
    track.appendChild(card);
  });

  // Drag scroll
  let isDown = false, startX, scrollLeft;

  track.addEventListener("mousedown", e => {
    isDown = true;
    track.style.cursor = "grabbing";
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener("mouseleave", () => { isDown = false; track.style.cursor = ""; });
  track.addEventListener("mouseup",    () => { isDown = false; track.style.cursor = ""; });
  track.addEventListener("mousemove",  e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.4;
  });

  // Touch
  let touchStartX = 0, touchScrollLeft = 0;
  track.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].pageX;
    touchScrollLeft = track.scrollLeft;
  }, { passive: true });
  track.addEventListener("touchmove", e => {
    const diff = touchStartX - e.touches[0].pageX;
    track.scrollLeft = touchScrollLeft + diff;
  }, { passive: true });

  // Arrow buttons
  const SCROLL_AMOUNT = 320;
  section.querySelector(".carousel-prev").addEventListener("click", () => {
    track.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
  });
  section.querySelector(".carousel-next").addEventListener("click", () => {
    track.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
  });

  // Show/hide arrows based on scroll
  function updateArrows() {
    const prev = section.querySelector(".carousel-prev");
    const next = section.querySelector(".carousel-next");
    prev.style.opacity = track.scrollLeft > 0 ? "1" : "0.3";
    next.style.opacity = track.scrollLeft < track.scrollWidth - track.clientWidth - 1 ? "1" : "0.3";
  }
  track.addEventListener("scroll", updateArrows, { passive: true });
  updateArrows();

  return section;
}

function createAnimeCard(anime, showProgress, idx) {
  const card = document.createElement("div");
  card.className = "anime-card";
  card.style.animationDelay = `${idx * 0.05}s`;

  const progress = anime.progress || 0;
  const cover = anime.cover || `https://picsum.photos/seed/${anime.id}/200/280`;

  card.innerHTML = `
    <div class="anime-card-img-wrap">
      <img
        class="anime-card-img skeleton"
        src="${cover}"
        alt="${anime.title}"
        loading="lazy"
        onload="this.classList.remove('skeleton')"
        onerror="this.src='https://picsum.photos/seed/${anime.id || idx}/200/280'"
      />
      <div class="anime-card-overlay">
        <div class="anime-card-play">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <div class="anime-card-info">
          ${anime.genres ? `<div class="anime-card-genres">${(anime.genres || []).slice(0,2).map(g => `<span>${g}</span>`).join("")}</div>` : ""}
          ${anime.rating ? `<div class="anime-card-rating">⭐ ${anime.rating.toFixed(1)}</div>` : ""}
        </div>
      </div>
      ${showProgress && progress > 0 ? `
        <div class="anime-card-progress">
          <div class="anime-card-progress-bar" style="width:${progress}%"></div>
        </div>
      ` : ""}
      ${anime.status === "ongoing" ? '<div class="anime-card-badge">EN EMISIÓN</div>' : ""}
    </div>
    <div class="anime-card-title">${anime.title}</div>
    ${showProgress && progress > 0 ? `<div class="anime-card-sub">${progress}% completado</div>` : ""}
  `;

  return card;
}
