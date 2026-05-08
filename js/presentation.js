let current = 0;
const slides = document.querySelectorAll('.slide');
const total = slides.length;
const counter = document.getElementById('slide-counter');
const progressBar = document.getElementById('progress-bar');

/* ── Nav-controls buttons ── */
const navPrevBtn = document.getElementById('navPrev');
const navNextBtn = document.getElementById('navNext');
const navThemeSelect = document.getElementById('navTheme');

/* ── Simulation iframe overlay ── */
const simOverlay = document.getElementById('simOverlay');
const simFrame = document.getElementById('simFrame');
const simOverlayTitle = document.getElementById('simOverlayTitle');
const simOverlayClose = document.getElementById('simOverlayClose');
var simOpen = false;

/* ────────────────────────────────────────────────────────
   Slide Navigation
   ──────────────────────────────────────────────────────── */

function goTo(n) {
  if (n < 0 || n >= total) return;

  var outgoing = slides[current];
  if (outgoing) {
    outgoing.removeAttribute('data-active');
    outgoing.setAttribute('data-exit', '');
    setTimeout(function () { outgoing.removeAttribute('data-exit'); }, 160);
  }

  var incoming = slides[n];
  if (incoming) incoming.setAttribute('data-active', '');

  current = n;
  if (counter) counter.textContent = (n + 1) + ' / ' + total;
  if (progressBar) progressBar.style.width = ((n + 1) / total) * 100 + '%';

  var progress = total > 1 ? n / (total - 1) : 0;
  document.body.style.setProperty('--slide-progress', progress);

  if (navPrevBtn) navPrevBtn.disabled = n <= 0;
  if (navNextBtn) navNextBtn.disabled = n >= total - 1;
}

function next() { if (current < total - 1) goTo(current + 1); }
function prev() { if (current > 0) goTo(current - 1); }

/* ────────────────────────────────────────────────────────
   Keyboard Navigation
   ──────────────────────────────────────────────────────── */

document.addEventListener('keydown', function (e) {
  /* When the sim overlay is open, only Escape works */
  if (simOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeSim(); }
    return;
  }

  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  if (e.key === 'Escape') { location.href = 'index.html'; }
});

/* ────────────────────────────────────────────────────────
   Touch Swipe Navigation
   ──────────────────────────────────────────────────────── */

var touchStartX = 0;
document.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', function (e) {
  if (simOpen) return;
  var dx = e.changedTouches[0].clientX - touchStartX;
  if (dx < -50) next();
  if (dx > 50) prev();
});

/* ────────────────────────────────────────────────────────
   Clickable Nav Controls
   ──────────────────────────────────────────────────────── */

if (navPrevBtn) navPrevBtn.addEventListener('click', function () { prev(); });
if (navNextBtn) navNextBtn.addEventListener('click', function () { next(); });

/* ────────────────────────────────────────────────────────
   Theme Selector in Nav Controls
   ──────────────────────────────────────────────────────── */

if (navThemeSelect) {
  var currentTheme = document.body.getAttribute('data-theme') || 'dark';
  navThemeSelect.value = currentTheme;

  navThemeSelect.addEventListener('change', function () {
    document.body.setAttribute('data-theme', navThemeSelect.value);
    try { localStorage.setItem('sort-lab-theme', navThemeSelect.value); } catch (e) { /* */ }
  });

  try {
    var savedTheme = localStorage.getItem('sort-lab-theme');
    if (savedTheme) navThemeSelect.value = savedTheme;
  } catch (e) { /* */ }
}

/* ────────────────────────────────────────────────────────
   Simulation Iframe Overlay — Open / Close
   ──────────────────────────────────────────────────────── */

function openSim(page, title) {
  if (!simOverlay || !simFrame) return;

  simOverlayTitle.textContent = title || 'Simulation';
  simFrame.src = page;
  simOverlay.hidden = false;

  /* Trigger the slide-up animation (force reflow first) */
  simOverlay.classList.remove('overlay-enter', 'overlay-exit');
  void simOverlay.offsetWidth;
  simOverlay.classList.add('overlay-enter');

  simOpen = true;

  /* Hide nav controls while overlay is open */
  var navEl = document.getElementById('navControls');
  if (navEl) navEl.style.display = 'none';
}

function closeSim() {
  if (!simOverlay) return;

  simOverlay.classList.remove('overlay-enter');
  simOverlay.classList.add('overlay-exit');

  simOpen = false;

  /* Wait for exit animation then cleanup */
  setTimeout(function () {
    simOverlay.hidden = true;
    simOverlay.classList.remove('overlay-exit');
    simFrame.src = 'about:blank';

    /* Restore nav controls */
    var navEl = document.getElementById('navControls');
    if (navEl) navEl.style.display = '';
  }, 350);
}

if (simOverlayClose) {
  simOverlayClose.addEventListener('click', function () { closeSim(); });
}

/* Expose globally for onclick handlers */
window.openSim = openSim;
window.closeSim = closeSim;
window.goTo = goTo;

/* ────────────────────────────────────────────────────────
   Resolve Start Slide from Hash
   ──────────────────────────────────────────────────────── */

function resolveStartSlide(hash) {
  if (!hash || !/^#slide-\d+$/.test(hash)) return 0;
  var raw = parseInt(hash.slice(7), 10);
  if (isNaN(raw)) return 0;
  if (raw >= 1 && raw <= total) return raw - 1;
  return 0;
}

/* ────────────────────────────────────────────────────────
   Initialization
   ──────────────────────────────────────────────────────── */

var isReturning = /^#slide-\d+$/.test(location.hash);
var startSlide = resolveStartSlide(location.hash);
goTo(startSlide);

/* Apply entrance animation if returning from sim (legacy support) */
if (isReturning && startSlide > 0) {
  var returnSlide = slides[startSlide];
  if (returnSlide) {
    returnSlide.classList.add('slide-enter');
    setTimeout(function () { returnSlide.classList.remove('slide-enter'); }, 700);
  }
}
