let current = 0;
const slides = document.querySelectorAll('.slide');
const total = slides.length;
const counter = document.getElementById('slide-counter');
const progressBar = document.getElementById('progress-bar');

function goTo(n) {
  if (n < 0 || n >= total) {
    return;
  }

  const outgoing = slides[current];
  if (outgoing) {
    outgoing.removeAttribute('data-active');
    outgoing.setAttribute('data-exit', '');
    setTimeout(() => {
      outgoing.removeAttribute('data-exit');
    }, 160);
  }

  const incoming = slides[n];
  if (incoming) {
    incoming.setAttribute('data-active', '');
  }

  current = n;
  if (counter) {
    counter.textContent = n + 1 + ' / ' + total;
  }
  if (progressBar) {
    progressBar.style.width = ((n + 1) / total) * 100 + '%';
  }
  
  // Update global slide progress for dynamic CSS background transitions (0 to 1)
  const progress = total > 1 ? n / (total - 1) : 0;
  document.body.style.setProperty('--slide-progress', progress);
}

function next() {
  if (current < total - 1) goTo(current + 1);
}

function prev() {
  if (current > 0) goTo(current - 1);
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  if (e.key === 'Escape') { location.href = 'index.html'; }
});

let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx < -50) next();
  if (dx > 50) prev();
});

function launchSim(page) {
  try {
    sessionStorage.setItem('returnSlide', current + 1);
  } catch (error) {
    void error;
  }
  location.href = page + '?from=presentation';
}
window.launchSim = launchSim;

function resolveStartSlide(hash) {
  if (!hash || !/^#slide-\d+$/.test(hash)) {
    return 0;
  }

  const raw = parseInt(hash.slice(7), 10);
  if (isNaN(raw)) {
    return 0;
  }

  if (raw >= 1 && raw <= total) {
    return raw - 1;
  }

  if (raw === 0) {
    return 0;
  }

  return 0;
}

goTo(resolveStartSlide(location.hash));

window.goTo = goTo;
