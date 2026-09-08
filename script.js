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
mcModalOk.addEventListener('click', mcCloseModal);
mcModalOverlay.addEventListener('click', (e) => {
  if (e.target === mcModalOverlay) mcCloseModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') mcCloseModal();
});
