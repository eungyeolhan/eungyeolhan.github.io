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
// To add photos/videos later: drop <img> or <video> tags straight into
// the relevant project's `media` string below (the placeholder text
// disappears automatically once media is non-empty).
const projectData = {
  'video-converter': {
    dot: '1',
    title: 'Video Converter',
    desc: 'Turns YouTube, Instagram, or TikTok links into MP3, MP4, WAV, FLAC, OPUS, WEBM, or MKV files. Built in Python with github user we3005.',
    link: 'https://github.com/eungyeolhan/Video-Converter',
    media: '',
  },
  'economic-shock': {
    dot: '2',
    title: 'Economic Shock Simulator',
    desc: 'A graph-based simulator that models economic shocks with a custom dashboard UI. Built in Python for a school project.',
    link: 'https://github.com/Tabel0112/CSC111-Project-2',
    media: '',
  },
  'hello-webcam': {
    dot: '3',
    title: 'Hello Webcam!',
    desc: 'A real-time hand gesture recognition tool built with OpenCV and MediaPipe. Recognizes gestures like thumbs up, peace sign, OK sign, prayer hands, waving, and a raised hand (with a playful face-scan gender guess for its emoji badge) — each shown with a live label, emoji, and a hand-drawn illustration.',
    link: 'https://github.com/we3005/Hello-Webcam',
    media: '',
  },
  'mystery-game': {
    dot: '?',
    title: '???',
    desc: 'Mystery/detective 2D game — in progress. More details coming soon!',
    link: '',
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
  projectModalMedia.innerHTML = data.media || '<span class="project-media-placeholder">screenshots / video coming soon</span>';
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
  card.addEventListener('click', () => openProjectModal(card.dataset.project));
});
projectModalClose.addEventListener('click', closeProjectModal);
projectModalOverlay.addEventListener('click', (e) => {
  if (e.target === projectModalOverlay) closeProjectModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProjectModal();
});

// ---- mystery mascot sprite (bottom-left) ----
const mcSprite = document.getElementById('mcSprite');
const mcImg = document.getElementById('mcImg');
const mcSpeech = document.getElementById('mcSpeech');
const mcModalOverlay = document.getElementById('mcModalOverlay');
const mcModalOk = document.getElementById('mcModalOk');

const mcWalkFrames = ['river_standing2.png', 'river_standing3.png'];
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
  mcImg.src = 'river_standing.png';
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
