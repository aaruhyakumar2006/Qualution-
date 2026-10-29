import { createTimeline } from 'animejs';
import katex from 'katex';

// Total Duration: 99.624s = 99624ms (1:40)
export const TOTAL_DURATION_MS = 99624;

export const captionScenes = [
  { id: 'cap-1', start: 0, end: 14712 },
  { id: 'cap-2', start: 14712, end: 35832 },
  { id: 'cap-3', start: 35832, end: 45744 },
  { id: 'cap-4', start: 45744, end: 62832 },
  { id: 'cap-5', start: 62832, end: 79584 },
  { id: 'cap-6', start: 79584, end: 89232 },
  { id: 'cap-7', start: 89232, end: 99624 }
];

// Deterministic state management for all bits so seeking forward/back is 100% accurate
export function updateBitVisualStates(t) {
  const bit0 = document.getElementById('bit-text-0');
  const rect0 = document.getElementById('bit-rect-0');
  if (bit0 && rect0) {
    if (t >= 10880 && t < 23580) {
      bit0.textContent = '1';
      bit0.style.fill = '#040914';
      rect0.setAttribute('fill', '#38bdf8');
    } else {
      bit0.textContent = '0';
      bit0.style.fill = '#38bdf8';
      rect0.setAttribute('fill', '#0f1e35');
    }
  }

  const bit1 = document.getElementById('bit-text-1');
  const rect1 = document.getElementById('bit-rect-1');
  if (bit1 && rect1) {
    if (t >= 26580) {
      bit1.textContent = '0';
      bit1.style.fill = '#38bdf8';
      rect1.setAttribute('fill', '#0f1e35');
    } else {
      bit1.textContent = '1';
      bit1.style.fill = '#040914';
      rect1.setAttribute('fill', '#38bdf8');
    }
  }

  const bit2 = document.getElementById('bit-text-2');
  const rect2 = document.getElementById('bit-rect-2');
  if (bit2 && rect2) {
    if (t >= 29580) {
      bit2.textContent = '1';
      bit2.style.fill = '#040914';
      rect2.setAttribute('fill', '#38bdf8');
    } else {
      bit2.textContent = '0';
      bit2.style.fill = '#38bdf8';
      rect2.setAttribute('fill', '#0f1e35');
    }
  }

  const bit3 = document.getElementById('bit-text-3');
  const rect3 = document.getElementById('bit-rect-3');
  if (bit3 && rect3) {
    if (t >= 32080) {
      bit3.textContent = '0';
      bit3.style.fill = '#38bdf8';
      rect3.setAttribute('fill', '#0f1e35');
    } else {
      bit3.textContent = '1';
      bit3.style.fill = '#040914';
      rect3.setAttribute('fill', '#38bdf8');
    }
  }
}

// Format time mm:ss
export function formatTime(ms) {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function initPlayer() {
  const container = document.getElementById('stage-container');
  const viewport = document.getElementById('stage-viewport');
  const canvas = document.getElementById('bg-canvas');
  const audio = document.getElementById('lesson-audio');

  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const rewindBtn = document.getElementById('rewind-btn');
  const forwardBtn = document.getElementById('forward-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  const playOverlay = document.getElementById('play-overlay');
  const bigPlayBtn = document.getElementById('big-play-btn');
  const progressTrack = document.getElementById('progress-track');
  const progressFill = document.getElementById('progress-fill');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');

  if (!container || !viewport) {
    console.warn('QUALUTION Player: Stage elements not found yet.');
    return;
  }

  let isPlaying = false;
  let narrationEnabled = true;
  let currentTimeMs = 0;
  let lastRafTimestamp = null;
  let animFrame = null;

  // Pre-render KaTeX Equations safely
  const math0 = document.getElementById('math-0');
  const mathSuper = document.getElementById('math-superposition');
  const mathBell = document.getElementById('math-bell');

  if (math0) katex.render('|0\\rangle', math0, { displayMode: true, throwOnError: false });
  if (mathSuper) katex.render('|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle', mathSuper, { displayMode: true, throwOnError: false });
  if (mathBell) katex.render('|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}', mathBell, { displayMode: true, throwOnError: false });

  // Responsive 16:9 Viewport Scaler
  function updateScale() {
    if (!container || !viewport) return;
    const containerWidth = container.clientWidth;
    const scale = containerWidth / 1600;
    viewport.style.transform = `scale(${scale})`;
  }

  window.addEventListener('resize', updateScale);
  if (window.ResizeObserver) {
    new ResizeObserver(updateScale).observe(container);
  }
  updateScale();

  // Particle Drift Background
  if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = 1600;
    canvas.height = 900;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 1600,
      y: Math.random() * 900,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      color: Math.random() > 0.4 ? 'rgba(56,189,248,' : 'rgba(167,139,250,',
      alpha: Math.random() * 0.35 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: 0.015
    }));

    function drawParticles() {
      ctx.clearRect(0, 0, 1600, 900);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1600;
        if (p.x > 1600) p.x = 0;
        if (p.y < 0) p.y = 900;
        if (p.y > 900) p.y = 0;
        p.phase += p.speed;
        const a = p.alpha + Math.sin(p.phase) * 0.1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, a)})`;
        ctx.fill();
      }
      requestAnimationFrame(drawParticles);
    }
    requestAnimationFrame(drawParticles);
  }

  if (timeTotal) {
    timeTotal.textContent = formatTime(TOTAL_DURATION_MS);
  }

  function updateCaptions(t) {
    captionScenes.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) {
        el.classList.toggle('active', t >= c.start && t < c.end);
      }
    });
  }

  // Single Master Anime.js Timeline (Continuous Presentation)
  const tl = createTimeline({ autoplay: false });

  // Initial absolute coordinates for actors
  tl.set('#actor-classical-root', { translateX: 800, translateY: 380, scale: 0.88, opacity: 0 });
  tl.set('#actor-extra-bits', { opacity: 0 });
  tl.set('#actor-qubit-1-root', { translateX: 800, translateY: 320, scale: 0.1, opacity: 0 });
  tl.set('#qubit-1-label', { opacity: 0 });
  tl.set('#actor-qubit-2-root', { translateX: 480, translateY: 330, scale: 0.1, opacity: 0 });
  tl.set('#actor-link-root', { opacity: 0 });
  tl.set('#actor-cmp-root', { translateX: 420, translateY: 540, opacity: 0 });

  // === SCENE 1 (0 to 14,712 ms) ===
  tl.add('#actor-classical-root', { opacity: [0, 1], scale: [0.88, 1], duration: 900, ease: 'outQuart' }, 200);
  tl.add('#hl-bits', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 3200);
  tl.add('#hl-switch-1', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 6800);
  tl.add('#bit-rect-0', { fill: '#38bdf8', scale: [1, 1.18, 1], duration: 480, ease: 'outBack(1.4)' }, 10800);
  tl.add('#bit-glow-0', { stroke: 'rgba(56,189,248,0.8)', opacity: [0.4, 0.9, 0.6], duration: 480 }, 10800);
  tl.add('#bit-text-0', { opacity: [1, 0, 1], duration: 280 }, 10880);

  // === SCENE 2 (14,712 to 35,832 ms) ===
  tl.add('#actor-classical-root', { translateX: [800, 470], duration: 1100, ease: 'inOutQuint' }, 15500);
  tl.add('#actor-extra-bits', { opacity: [0, 1], duration: 800, ease: 'outQuart' }, 15900);
  tl.add('#hl-deterministic', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 17500);
  tl.add('#hl-state', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 21000);

  // Sequence of flips with smooth micro-animations
  tl.add('#bit-rect-0', { fill: '#0f1e35', stroke: 'rgba(255,255,255,0.12)', scale: [1, 1.15, 1], duration: 400 }, 23500);
  tl.add('#bit-text-0', { opacity: [1, 0, 1], duration: 220 }, 23580);

  tl.add('#bit-rect-1', { fill: '#0f1e35', stroke: 'rgba(255,255,255,0.12)', scale: [1, 1.15, 1], duration: 400 }, 26500);
  tl.add('#bit-text-1', { opacity: [1, 0, 1], duration: 220 }, 26580);

  tl.add('#bit-rect-2', { fill: '#38bdf8', stroke: '#38bdf8', scale: [1, 1.15, 1], duration: 400 }, 29500);
  tl.add('#bit-text-2', { opacity: [1, 0, 1], duration: 220 }, 29580);

  tl.add('#bit-rect-3', { fill: '#0f1e35', stroke: 'rgba(255,255,255,0.12)', scale: [1, 1.15, 1], duration: 400 }, 32000);
  tl.add('#bit-text-3', { opacity: [1, 0, 1], duration: 220 }, 32080);

  // Register folds back into single bit with purple glow
  tl.add('#actor-extra-bits', { opacity: [1, 0], duration: 600, ease: 'inQuart' }, 33800);
  tl.add('#actor-classical-root', { translateX: [470, 800], duration: 1100, ease: 'inOutQuint' }, 33800);
  tl.add('#bit-glow-0', { stroke: '#a78bfa', opacity: [0.4, 0.85], duration: 1000 }, 34200);

  // === SCENE 3 (35,832 to 45,744 ms) ===
  tl.add('#actor-classical-root', { translateY: [380, 320], duration: 1200, ease: 'inOutQuint' }, 36000);
  tl.add('#math-0', { opacity: [0, 1], translateY: [15, 0], duration: 700, ease: 'outQuart' }, 38000);
  tl.add('#hl-switch-3', { color: [{ to: '#a78bfa' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 41500);

  // === SCENE 4 (45,744 to 62,832 ms) ===
  tl.add('#actor-classical-root', { opacity: [1, 0], scale: [1, 0.1], duration: 800, ease: 'inQuart' }, 45744);
  tl.add('#math-0', { opacity: [1, 0], duration: 400 }, 45744);
  tl.add('#actor-qubit-1-root', { opacity: [0, 1], scale: [0.1, 1], duration: 1200, ease: 'outBack(1.2)' }, 46200);
  tl.add('#hl-qubit-4', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 47500);
  tl.add('#math-superposition', { opacity: [0, 1], translateY: [15, 0], duration: 800, ease: 'outQuart' }, 49500);
  tl.add('#hl-superposition-4', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 53000);

  // Superposition vector oscillation
  tl.add('#qvec-1', {
    rotate: [0, 48, -35, 20, 0],
    duration: 5000,
    ease: 'inOutSine'
  }, 53500);
  tl.add('#hl-measurement-4', { color: [{ to: '#a78bfa' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 58500);
  // Snap to 0 on measurement
  tl.add('#qvec-1', { rotate: -45, duration: 400, ease: 'outBack(1.5)' }, 60000);

  // === SCENE 5 (62,832 to 79,584 ms) ===
  tl.add('#math-superposition', { opacity: [1, 0], duration: 400 }, 62832);
  tl.add('#actor-qubit-1-root', { translateX: [800, 1150], translateY: [320, 260], scale: [1, 0.85], duration: 1300, ease: 'inOutQuint' }, 63000);
  tl.add('#qubit-1-label', { opacity: [0, 1], duration: 600 }, 64000);
  tl.add('#actor-classical-root', {
    translateX: [100, 450],
    translateY: [260, 260],
    scale: [0.1, 0.85],
    opacity: [0, 1],
    duration: 1300,
    ease: 'inOutQuint'
  }, 63000);
  tl.add('#actor-cmp-root', { opacity: [0, 1], translateY: [570, 540], duration: 900, ease: 'outQuart' }, 66500);
  tl.add('#hl-bit-5', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 900, ease: 'inOutQuint' }, 69000);
  tl.add('#hl-qubit-5', { color: [{ to: '#a78bfa' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 900, ease: 'inOutQuint' }, 72500);
  tl.add('#hl-measurement-5', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 900, ease: 'inOutQuint' }, 75500);

  // === SCENE 6 (79,584 to 89,232 ms) ===
  tl.add('#actor-cmp-root', { opacity: [1, 0], duration: 500 }, 79584);
  tl.add('#qubit-1-label', { opacity: [1, 0], duration: 400 }, 79584);
  tl.add('#actor-classical-root', { opacity: [1, 0], scale: [0.85, 0.1], duration: 800, ease: 'inQuart' }, 79584);
  tl.add('#actor-qubit-2-root', { opacity: [0, 1], scale: [0.1, 1], duration: 1000, ease: 'outBack(1.2)' }, 80200);
  tl.add('#actor-qubit-1-root', { translateX: [1150, 1120], translateY: [260, 330], scale: [0.85, 1], duration: 1000, ease: 'inOutQuint' }, 79800);
  tl.add('#actor-link-root', { opacity: [0, 1], duration: 600 }, 80800);
  tl.add('#link-beam', { strokeDashoffset: [0, -60], duration: 9000, ease: 'linear' }, 80800);
  tl.add('#math-bell', { opacity: [0, 1], translateY: [15, 0], duration: 800, ease: 'outQuart' }, 81800);
  tl.add('#hl-entangled-6', { color: [{ to: '#a78bfa' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 83000);
  tl.add('#qvec-1', { rotate: [0, 45, -30, 0], duration: 5500, ease: 'inOutSine' }, 83500);
  tl.add('#qvec-2', { rotate: [0, -45, 30, 0], duration: 5500, ease: 'inOutSine' }, 83500);

  // === SCENE 7 (89,232 to 99,624 ms) ===
  tl.add('#math-bell', { opacity: [1, 0], duration: 400 }, 89232);
  tl.add('#actor-link-root', { opacity: [1, 0], duration: 600 }, 89232);
  tl.add('#actor-qubit-2-root', { translateX: [480, 740], translateY: [330, 320], duration: 1600, ease: 'inOutQuint' }, 89500);
  tl.add('#actor-qubit-1-root', { translateX: [1120, 860], translateY: [330, 320], duration: 1600, ease: 'inOutQuint' }, 89500);
  tl.add('#badge-bar', { opacity: [0, 1], translateY: [-15, 0], duration: 800, ease: 'outQuart' }, 91500);
  tl.add('#hl-qubit-7', { color: [{ to: '#38bdf8' }, { to: '#f8fafc' }], scale: [1, 1.15, 1], duration: 1000, ease: 'inOutQuint' }, 93500);

  function updateProgressUI() {
    if (progressFill) {
      const pct = (currentTimeMs / TOTAL_DURATION_MS) * 100;
      progressFill.style.width = `${pct}%`;
    }
    if (timeCurrent) {
      timeCurrent.textContent = formatTime(currentTimeMs);
    }
  }

  // Seek Function with 100% deterministic visual refresh
  function seekTo(targetMs) {
    targetMs = Math.max(0, Math.min(targetMs, TOTAL_DURATION_MS));
    currentTimeMs = targetMs;
    tl.seek(targetMs);
    updateBitVisualStates(targetMs);
    updateCaptions(targetMs);

    if (narrationEnabled && audio) {
      audio.currentTime = targetMs / 1000;
      if (isPlaying) {
        audio.play().catch(e => console.log('Audio resume waiting for action:', e));
      }
    }

    updateProgressUI();
  }

  // Playback Loop
  function playbackLoop(timestamp) {
    if (!isPlaying) return;

    if (!lastRafTimestamp) lastRafTimestamp = timestamp;

    if (narrationEnabled && audio && !audio.paused && !audio.ended && audio.currentTime > 0) {
      currentTimeMs = audio.currentTime * 1000;
      lastRafTimestamp = timestamp;
    } else {
      const delta = timestamp - lastRafTimestamp;
      lastRafTimestamp = timestamp;
      currentTimeMs += delta;
    }

    if (currentTimeMs >= TOTAL_DURATION_MS) {
      currentTimeMs = TOTAL_DURATION_MS;
      pauseVideo();
      updateProgressUI();
      return;
    }

    tl.seek(currentTimeMs);
    updateBitVisualStates(currentTimeMs);
    updateCaptions(currentTimeMs);
    updateProgressUI();

    animFrame = requestAnimationFrame(playbackLoop);
  }

  function playVideo() {
    if (isPlaying) return;
    if (currentTimeMs >= TOTAL_DURATION_MS) {
      currentTimeMs = 0;
      tl.seek(0);
      updateBitVisualStates(0);
    }

    isPlaying = true;
    lastRafTimestamp = null;
    if (playOverlay) playOverlay.classList.add('hidden');
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';

    if (narrationEnabled && audio) {
      audio.currentTime = currentTimeMs / 1000;
      audio.play().catch(e => console.log('Audio autoplay prevented:', e));
    }

    animFrame = requestAnimationFrame(playbackLoop);
  }

  function pauseVideo() {
    if (!isPlaying) return;
    isPlaying = false;
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';

    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }

    if (audio) audio.pause();
  }

  function togglePlay() {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }

  // Progress Bar Scrubber
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      seekTo(ratio * TOTAL_DURATION_MS);
    });
  }

  // Control Buttons
  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (bigPlayBtn) bigPlayBtn.addEventListener('click', playVideo);
  if (playOverlay) playOverlay.addEventListener('click', playVideo);

  if (rewindBtn) {
    rewindBtn.addEventListener('click', () => {
      seekTo(currentTimeMs - 5000);
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      seekTo(currentTimeMs + 5000);
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(e => console.log(e));
      } else {
        document.exitFullscreen().catch(e => console.log(e));
      }
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      seekTo(currentTimeMs - 5000);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      seekTo(currentTimeMs + 5000);
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      if (fullscreenBtn) fullscreenBtn.click();
    }
  });

  // Initial state: seek to 0 and render
  tl.seek(0);
  updateBitVisualStates(0);
  updateCaptions(0);
  updateProgressUI();

  window.__qualutionPlayer = {
    play: playVideo,
    pause: pauseVideo,
    seek: seekTo,
    timeline: tl
  };

  console.log('✅ QUALUTION Continuous Video Lesson initialized (01:40 / 99.6s)');
}

// Auto-run when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlayer);
} else {
  initPlayer();
}
