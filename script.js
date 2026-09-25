const toggleBtn = document.getElementById('themeToggle');
toggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  toggleBtn.textContent = isDark ? '☀️' : '🌙';
});

// world number = number of project entries (add a .project-block and it bumps automatically)
const projectBlocks = document.querySelectorAll('#projects .project-block');
const worldEl = document.querySelector('.world');
if (worldEl && projectBlocks.length) {
  worldEl.textContent = 'WORLD ' + projectBlocks.length + ' - 1';
}

// retro "coin" blip on hover, played via Web Audio (no audio file needed)
// NOTE: only attached to big blocks (.block.interactive) — skill items (.item)
// keep their color highlight via CSS only, with no sound.
let audioCtx;
function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
let lastPlay = 0;
function playBlip() {
  const now = Date.now();
  if (now - lastPlay < 90) return; // avoid overlapping/rapid re-fire
  lastPlay = now;
  const ctx = ensureAudioCtx();
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(988, t0);
  osc.frequency.setValueAtTime(1319, t0 + 0.06);
  // ramp gain up from silence (avoids the "click/pop" a hard start causes)
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.2);
}
document.querySelectorAll('.block.interactive').forEach((el) => {
  el.addEventListener('mouseenter', playBlip);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  let lastSpawn = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSpawn < 45) return;
    lastSpawn = now;
    const pixel = document.createElement('span');
    pixel.className = 'trail-pixel';
    pixel.style.left = e.clientX + 'px';
    pixel.style.top = e.clientY + 'px';
    document.body.appendChild(pixel);
    setTimeout(() => pixel.remove(), 750);
  });
}

// ---- project detail modal ----
// To add photos/videos later: drop an <img> or <video> tag (pointing at a
// file in assets/) into the relevant project's `media` string below. The
// media box sizes itself to whatever you put in it, and is skipped
// entirely (no empty box) when `media` is left as ''.
const projectData = {
  'hello-webcam': {
    dot: '1',
    title: 'Hello Webcam!',
    desc: 'A real-time hand gesture recognition tool built with OpenCV and MediaPipe. Recognizes gestures like thumbs up, peace sign, OK sign, prayer hands, waving, and a raised hand (with a playful face-scan gender guess for its emoji badge) — each shown with a live label, emoji, and a hand-drawn illustration.',
    link: 'https://github.com/we3005/Hello-Webcam',
    media: '',
  },
  'video-converter': {
    dot: '2',
    title: 'Video Converter',
    desc: 'Turns YouTube, Instagram, or TikTok links into MP3, MP4, WAV, FLAC, OPUS, WEBM, or MKV files. Built in Python with github user we3005.',
    link: 'https://github.com/eungyeolhan/Video-Converter',
    media: '<img src="assets/video-converter.png" alt="Video Converter app screenshot">',
  },
  'economic-shock': {
    dot: '3',
    title: 'Economic Shock Simulator',
    desc: 'A graph-based simulator that models economic shocks with a custom dashboard UI. Built in Python for a school project.',
    link: 'https://github.com/Tabel0112/CSC111-Project-2',
    media: '',
  },
};

const projectModalOverlay = document.getElementById('projectModalOverlay');
const projectModalClose = document.getElementById('projectModalClose');
const projectModalDot = document.getElementById('projectModalDot');
const projectModalTitle = document.getElementById('projectModalTitle');
const projectModalDesc = document.getElementById('projectModalDesc');
const projectModalMedia = document.getElementById('projectModalMedia');
const projectModalLink = document.getElementById('projectModalLink');

function openProjectModal(key) {
  const data = projectData[key];
  if (!data) return;
  projectModalDot.textContent = data.dot;
  projectModalTitle.textContent = data.title;
  projectModalDesc.textContent = data.desc;
  if (data.media) {
    projectModalMedia.innerHTML = data.media;
    projectModalMedia.style.display = '';
  } else {
    projectModalMedia.innerHTML = '';
    projectModalMedia.style.display = 'none';
  }
  if (data.link) {
    projectModalLink.href = data.link;
    projectModalLink.style.display = '';
  } else {
    projectModalLink.style.display = 'none';
  }
  projectModalOverlay.classList.add('show');
}
function closeProjectModal() {
  projectModalOverlay.classList.remove('show');
}

document.querySelectorAll('[data-project]').forEach((card) => {
  if (card.dataset.project === 'mystery-game') {
    card.addEventListener('click', triggerMysteryGlitch);
  } else {
    card.addEventListener('click', () => openProjectModal(card.dataset.project));
  }
});
projectModalClose.addEventListener('click', closeProjectModal);
projectModalOverlay.addEventListener('click', (e) => {
  if (e.target === projectModalOverlay) closeProjectModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProjectModal();
});

// ---- mystery game "??? " easter egg: a burst of fake 404 error windows,
// fast and dense enough to blanket the page, each with a little error
// blip, that all vanish together and get replaced by a bigger glitching
// "Coming Soon ........." window that disappears on its own ----
const MYSTERY_SPAWN_DELAY_MS = 45;    // gap between each error window appearing (fast)
const MYSTERY_HOLD_MS = 500;          // how long they all sit on screen together
const MYSTERY_WINDOW_W = 280;         // approx. window footprint, for coverage math
const MYSTERY_WINDOW_H = 170;
const MYSTERY_COMINGSOON_MS = 5000;   // how long "Coming Soon" stays up before it vanishes
let mysteryGlitchRunning = false;

function playMysteryBeep() {
  try {
    const ctx = ensureAudioCtx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    // classic descending "error" blip
    osc.frequency.setValueAtTime(700, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.09);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.11);
  } catch (err) {
    // audio isn't essential to the gag; fail silently
  }
}

function makeMysteryWindow(x, y, { title, body, variant = 'error' }) {
  const win = document.createElement('div');
  win.className = 'mystery-window' + (variant === 'comingsoon' ? ' comingsoon' : '');
  win.style.left = x + 'px';
  win.style.top = y + 'px';
  win.innerHTML =
    '<div class="mystery-window-bar"><span>' + title + '</span><span class="mystery-window-x">✕</span></div>' +
    '<div class="mystery-window-body">' + body + '</div>';
  document.body.appendChild(win);
  return win;
}

function triggerMysteryGlitch() {
  if (mysteryGlitchRunning) return;
  mysteryGlitchRunning = true;

  const windows = [];
  const margin = 30;
  // enough windows (with overlap) to blanket the current viewport
  const errorCount = Math.min(
    70,
    Math.max(24, Math.ceil((window.innerWidth * window.innerHeight) / (MYSTERY_WINDOW_W * MYSTERY_WINDOW_H) * 1.6))
  );

  for (let i = 0; i < errorCount; i++) {
    setTimeout(() => {
      const maxX = Math.max(window.innerWidth - MYSTERY_WINDOW_W + margin, margin);
      const maxY = Math.max(window.innerHeight - MYSTERY_WINDOW_H + margin, margin);
      const x = -margin + Math.random() * (maxX + margin);
      const y = -margin + Math.random() * (maxY + margin);
      windows.push(makeMysteryWindow(x, y, {
        title: 'Error',
        body: '404 - Not Found',
        variant: 'error',
      }));
      playMysteryBeep();
    }, i * MYSTERY_SPAWN_DELAY_MS);
  }

  setTimeout(() => {
    windows.forEach((w) => w.remove());

    const comingSoon = makeMysteryWindow(
      window.innerWidth / 2 - 190,
      window.innerHeight / 2 - 90,
      { title: 'System', body: 'Coming Soon .........', variant: 'comingsoon' }
    );
    comingSoon.classList.add('glitching');

    let closed = false;
    const closeIt = () => {
      if (closed) return;
      closed = true;
      comingSoon.remove();
      mysteryGlitchRunning = false;
    };
    comingSoon.querySelector('.mystery-window-x').addEventListener('click', closeIt);
    comingSoon.addEventListener('click', closeIt);
    setTimeout(closeIt, MYSTERY_COMINGSOON_MS);
  }, errorCount * MYSTERY_SPAWN_DELAY_MS + MYSTERY_HOLD_MS);
}

// ---- mystery mascot sprite (bottom-left) ----
const mcSprite = document.getElementById('mcSprite');
const mcImg = document.getElementById('mcImg');
const mcSpeech = document.getElementById('mcSpeech');
const mcModalOverlay = document.getElementById('mcModalOverlay');
const mcModalOk = document.getElementById('mcModalOk');

const mcWalkFrames = ['assets/river_standing2.png', 'assets/river_standing3.png'];
let mcWalkFrameIndex = 0;
let mcWalkTimer = null;
let mcSpeechTimer = null;

function mcStartWalking() {
  mcSprite.classList.add('walking'); // only float while actually walking
  mcWalkFrameIndex = 0;
  mcWalkTimer = setInterval(() => {
    mcImg.src = mcWalkFrames[mcWalkFrameIndex % mcWalkFrames.length];
    mcWalkFrameIndex++;
  }, 260);
}
function mcStopWalking() {
  clearInterval(mcWalkTimer);
  mcWalkTimer = null;
  mcImg.src = 'assets/river_standing.png';
  mcSprite.classList.remove('walking'); // stand still, feet on the ground
}

function mcPopSpeech() {
  mcSpeech.classList.add('show');
  setTimeout(() => mcSpeech.classList.remove('show'), 2200);
}
function mcStartSpeechLoop() {
  mcPopSpeech();
  mcSpeechTimer = setInterval(mcPopSpeech, 4500);
}
function mcStopSpeechLoop() {
  clearInterval(mcSpeechTimer);
  mcSpeechTimer = null;
  mcSpeech.classList.remove('show');
}

function mcOpenModal() {
  mcModalOverlay.classList.add('show');
}
function mcCloseModal() {
  mcModalOverlay.classList.remove('show');
}

mcSprite.addEventListener('mouseenter', () => {
  mcStartWalking();
  mcStartSpeechLoop();
});
mcSprite.addEventListener('mouseleave', () => {
  mcStopWalking();
  mcStopSpeechLoop();
});
mcSprite.addEventListener('click', mcOpenModal);
mcSprite.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    mcOpenModal();
  }
});
mcModalOk.addEventListener('click', () => {
  window.location.href = 'https://viaxshan.github.io/';
});
mcModalOverlay.addEventListener('click', (e) => {
  if (e.target === mcModalOverlay) mcCloseModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') mcCloseModal();
});

// ---- PRESS START TO CONTINUE bumps the heart count ----
const pressStart = document.getElementById('pressStart');
const heartCount = document.getElementById('heartCount');
if (pressStart && heartCount) {
  pressStart.addEventListener('click', (e) => {
    e.preventDefault(); // stay on the page so the heart bump is visible instead of navigating away
    const current = parseInt(heartCount.textContent.replace('×', ''), 10) || 0;
    heartCount.textContent = '×' + (current + 1);
  });
}

// ---- nav links: scroll so the section's header sits just below the sticky nav ----
const navBar = document.querySelector('.nav-bar');
document.querySelectorAll('nav.qblocks a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target || !navBar) return;
    e.preventDefault();
    const gap = 16; // breathing room between the nav bar and the section's top edge
    const top = target.getBoundingClientRect().top + window.scrollY - navBar.offsetHeight - gap;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});
