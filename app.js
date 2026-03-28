/* ─────────────────────────────────────────────────────────────
   Forecasting Feelings — app.js
   Atmospheric canvas + Line charts + LocalStorage pipeline
───────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'weatherMoodData_v2';

// Mood → canvas brightness multiplier
const MOOD_BRIGHTNESS = { 1: 0.5, 2: 0.65, 3: 0.8, 4: 0.92, 5: 1.0 };

// Weather → canvas tint colour (light pastel)
const WX_TINT = {
  sunny:  [240, 220, 160],
  cloudy: [180, 190, 200],
  rainy:  [130, 180, 210],
  snowy:  [200, 210, 230],
  windy:  [160, 200, 185],
};

// ── Nano UUID ────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Storage ──────────────────────────────────────────────────
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveData(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// ── Seeded PRNG ──────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Seed data ────────────────────────────────────────────────
const SEED = [
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, id:'aa1bb2cc3', timestamp:'2026-03-18T08:12:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, id:'bb2cc3dd4', timestamp:'2026-03-18T09:05:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, id:'cc3dd4ee5', timestamp:'2026-03-18T09:45:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, id:'dd4ee5ff6', timestamp:'2026-03-18T10:15:00Z' },
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:3, id:'ee5ff6gg7', timestamp:'2026-03-18T11:00:00Z' },
  { weather:'rainy',  commute:2, stress:3, mood:3, effort:2, id:'ff6gg7hh8', timestamp:'2026-03-19T07:55:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, id:'gg7hh8ii9', timestamp:'2026-03-19T08:30:00Z' },
  { weather:'cloudy', commute:3, stress:4, mood:2, effort:2, id:'hh8ii9jj0', timestamp:'2026-03-19T09:00:00Z' },
  { weather:'snowy',  commute:5, stress:4, mood:2, effort:3, id:'ii9jj0kk1', timestamp:'2026-03-19T10:20:00Z' },
  { weather:'windy',  commute:4, stress:5, mood:1, effort:3, id:'jj0kk1ll2', timestamp:'2026-03-20T07:30:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, id:'kk1ll2mm3', timestamp:'2026-03-20T08:10:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, id:'ll2mm3nn4', timestamp:'2026-03-20T09:20:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, id:'mm3nn4oo5', timestamp:'2026-03-20T10:00:00Z' },
  { weather:'snowy',  commute:4, stress:4, mood:2, effort:3, id:'nn4oo5pp6', timestamp:'2026-03-21T07:45:00Z' },
  { weather:'sunny',  commute:1, stress:2, mood:4, effort:1, id:'oo5pp6qq7', timestamp:'2026-03-21T08:30:00Z' },
  { weather:'windy',  commute:5, stress:5, mood:1, effort:3, id:'pp6qq7rr8', timestamp:'2026-03-21T09:15:00Z' },
  { weather:'rainy',  commute:3, stress:4, mood:2, effort:3, id:'qq7rr8ss9', timestamp:'2026-03-22T08:00:00Z' },
  { weather:'cloudy', commute:4, stress:3, mood:3, effort:2, id:'rr8ss9tt0', timestamp:'2026-03-22T09:10:00Z' },
  { weather:'sunny',  commute:2, stress:1, mood:5, effort:1, id:'ss9tt0uu1', timestamp:'2026-03-22T10:00:00Z' },
  { weather:'snowy',  commute:5, stress:5, mood:1, effort:3, id:'tt0uu1vv2', timestamp:'2026-03-23T07:30:00Z' },
];

function ensureSeedData() {
  const stored = loadData();
  const seedIds = SEED.map(s => s.id);
  const hasSeeds = seedIds.every(id => stored.some(e => e.id === id));
  if (!hasSeeds) {
    const userOnly = stored.filter(e => !seedIds.includes(e.id));
    saveData([...SEED, ...userOnly]);
  }
}

/* ══════════════════════════════════════════
   ATMOSPHERIC CANVAS
══════════════════════════════════════════ */
const canvas  = document.getElementById('main-canvas');
const ctx     = canvas.getContext('2d');

function resizeCanvas() {
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth;
  const H = Math.max(340, Math.round(W * 0.46));
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
}

function renderAtmosphere(data) {
  const W = canvas.width  / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);

  // ── 1. Background gradient based on dominant weather ──────
  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather] || 0) + 1);
  const domWx   = data.length ? Object.entries(wxCount).sort((a,b)=>b[1]-a[1])[0][0] : 'cloudy';
  const tint    = WX_TINT[domWx] || WX_TINT.cloudy;
  const avgMood = data.length ? data.reduce((s,e)=>s+e.mood,0)/data.length : 3;
  const bright  = MOOD_BRIGHTNESS[Math.round(avgMood)] || 0.75;

  const toHex = (ch) => {
    const v = Math.round(Math.min(255, ch * bright));
    return v.toString(16).padStart(2,'0');
  };
  const col1 = `#${toHex(tint[0]+10)}${toHex(tint[1]+15)}${toHex(tint[2]+20)}`;
  const col2 = `#${toHex(tint[0]-10)}${toHex(tint[1]-5)}${toHex(tint[2]+5)}`;

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, col1);
  bgGrad.addColorStop(1, col2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Gaussian blobs (stress = particle density) ─────────
  const avgStress = data.length ? data.reduce((s,e)=>s+e.stress,0)/data.length : 3;
  const blobCount = Math.round(3 + avgStress * 2.5);

  data.forEach((entry, idx) => {
    const rand = mulberry32(parseInt(entry.id.replace(/[^a-z0-9]/g,'').slice(0,8), 36) || idx + 77);
    const bx = rand() * W;
    const by = rand() * H;
    const r  = 40 + (entry.stress - 1) * 20;
    const alpha = 0.06 + (entry.commute - 1) * 0.02;

    const t = WX_TINT[entry.weather] || WX_TINT.cloudy;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r * 1.8);
    grad.addColorStop(0, `rgba(${t[0]},${t[1]},${t[2]},${alpha + 0.04})`);
    grad.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 3. Dashed sinusoidal paths (commute = distortion) ─────
  const paths = Math.max(2, Math.min(6, Math.round(data.length / 5)));
  for (let p = 0; p < paths; p++) {
    const randP = mulberry32(p * 1337 + 99);
    const startY = H * 0.2 + randP() * H * 0.6;
    const amp    = 10 + (randP() * 30);
    const freq   = 0.008 + randP() * 0.005;
    const phase  = randP() * Math.PI * 2;
    const avgCommute = data.length ? data.reduce((s,e)=>s+e.commute,0)/data.length : 3;
    const distort = (avgCommute - 1) / 4;

    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(61,107,90,${0.18 + p * 0.04})`;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const y = startY + Math.sin(x * freq + phase) * amp * (1 + distort * randP()) + (randP() - 0.5) * distort * 8;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── 4. Mood dots (luminous intensity) ─────────────────────
  data.forEach((entry, idx) => {
    const rand = mulberry32(idx * 7919 + 31);
    const dx = rand() * W * 0.9 + W * 0.05;
    const dy = rand() * H * 0.85 + H * 0.075;
    const moodBright = (entry.mood / 5);
    const dotR = 2 + moodBright * 3;
    const alpha = 0.4 + moodBright * 0.55;

    // Glow halo
    const halo = ctx.createRadialGradient(dx, dy, 0, dx, dy, dotR * 4);
    halo.addColorStop(0, `rgba(61,107,90,${alpha * 0.25})`);
    halo.addColorStop(1, `rgba(61,107,90,0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(dx, dy, dotR * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.fillStyle = `rgba(50,90,72,${alpha})`;
    ctx.beginPath();
    ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ══════════════════════════════════════════
   METHODOLOGY ORB CANVAS
══════════════════════════════════════════ */
const orbCanvas = document.getElementById('orb-canvas');
const orbCtx    = orbCanvas.getContext('2d');

function renderOrb() {
  const S = 260;
  const dpr = window.devicePixelRatio || 1;
  orbCanvas.width  = S * dpr;
  orbCanvas.height = S * dpr;
  orbCanvas.style.width  = S + 'px';
  orbCanvas.style.height = S + 'px';
  orbCtx.scale(dpr, dpr);

  const cx = S / 2, cy = S / 2;
  // Black background circle
  orbCtx.fillStyle = '#0a0a0a';
  orbCtx.beginPath(); orbCtx.arc(cx, cy, S/2, 0, Math.PI*2); orbCtx.fill();

  // Radial light rays
  const rays = 120;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const r1 = 2 + Math.random() * 8;
    const r2 = 30 + Math.random() * 90;
    const hue = 20 + Math.random() * 40;
    const sat = 70 + Math.random() * 30;
    const light = 50 + Math.random() * 30;
    const grad  = orbCtx.createLinearGradient(
      cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1,
      cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2
    );
    grad.addColorStop(0, `hsla(${hue},${sat}%,${light}%,0.9)`);
    grad.addColorStop(1, `hsla(${hue},${sat}%,${light}%,0)`);
    orbCtx.strokeStyle = grad;
    orbCtx.lineWidth = 0.8;
    orbCtx.beginPath();
    orbCtx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    orbCtx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    orbCtx.stroke();
  }

  // centre glow
  const cGrad = orbCtx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  cGrad.addColorStop(0, 'rgba(255,230,200,0.9)');
  cGrad.addColorStop(1, 'rgba(255,180,100,0)');
  orbCtx.fillStyle = cGrad;
  orbCtx.beginPath(); orbCtx.arc(cx, cy, 30, 0, Math.PI*2); orbCtx.fill();

  // Clip to circle
  orbCtx.globalCompositeOperation = 'destination-in';
  orbCtx.beginPath(); orbCtx.arc(cx, cy, S/2, 0, Math.PI*2); orbCtx.fill();
  orbCtx.globalCompositeOperation = 'source-over';
}

/* ══════════════════════════════════════════
   LINE CHARTS
══════════════════════════════════════════ */
const WX_ORDER = ['sunny','cloudy','rainy','snowy','windy'];

function drawLineChart(canvasEl, data, field) {
  const el  = canvasEl;
  const W   = el.parentElement.clientWidth - 44;
  const H   = 120;
  const dpr = window.devicePixelRatio || 1;
  el.width  = W * dpr;
  el.height = H * dpr;
  el.style.width  = W + 'px';
  el.style.height = H + 'px';
  const c = el.getContext('2d');
  c.scale(dpr, dpr);

  // Compute avg per weather
  const avgs = WX_ORDER.map(wx => {
    const group = data.filter(e => e.weather === wx);
    return group.length ? group.reduce((s,e)=>s+e[field],0)/group.length : null;
  });

  const validAvgs = avgs.filter(v => v !== null);
  if (validAvgs.length < 2) return;

  const minV = 1, maxV = 5;
  const padL = 12, padR = 12, padT = 16, padB = 8;
  const cW   = W - padL - padR;
  const cH   = H - padT - padB;

  const toX = (i) => padL + (i / (WX_ORDER.length - 1)) * cW;
  const toY = (v) => padT + cH - ((v - minV) / (maxV - minV)) * cH;

  // Filled area under curve
  c.save();
  c.beginPath();
  let started = false;
  WX_ORDER.forEach((wx, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    if (!started) { c.moveTo(x, y); started = true; }
    else c.lineTo(x, y);
  });
  const lastIdx = avgs.map((v,i)=>[v,i]).filter(([v])=>v!==null).at(-1)[1];
  const firstIdx = avgs.map((v,i)=>[v,i]).filter(([v])=>v!==null)[0][1];
  c.lineTo(toX(lastIdx), H);
  c.lineTo(toX(firstIdx), H);
  c.closePath();
  const fillGrad = c.createLinearGradient(0, 0, 0, H);
  fillGrad.addColorStop(0,'rgba(61,107,90,0.12)');
  fillGrad.addColorStop(1,'rgba(61,107,90,0)');
  c.fillStyle = fillGrad;
  c.fill();
  c.restore();

  // Line
  c.save();
  c.strokeStyle = '#3d6b5a';
  c.lineWidth = 1.5;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  started = false;
  WX_ORDER.forEach((wx, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    if (!started) { c.moveTo(x, y); started = true; }
    else c.lineTo(x, y);
  });
  c.stroke();
  c.restore();

  // Dots + value labels
  WX_ORDER.forEach((wx, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3d6b5a';
    c.beginPath(); c.arc(x, y, 2, 0, Math.PI*2); c.fill();

    // Label
    c.fillStyle = '#7a8a84';
    c.font = `500 9px Inter, sans-serif`;
    c.textAlign = 'center';
    c.fillText(avgs[i].toFixed(1), x, y - 7);
  });
}

function renderCharts(data) {
  drawLineChart(document.getElementById('stress-chart'),   data, 'stress');
  drawLineChart(document.getElementById('commute-chart'),  data, 'commute');
}

/* ══════════════════════════════════════════
   STATS
══════════════════════════════════════════ */
const WX_NAME = { sunny:'Sunny', cloudy:'Cloudy', rainy:'Rainy', snowy:'Snowy', windy:'Windy' };
const WX_STRESS_DESC  = { 1:'Effortless', 2:'Low', 3:'Moderate Friction', 4:'Elevated Pulse', 5:'Overloaded' };
const WX_COMMUTE_DESC = { 1:'Effortless', 2:'Minor Friction', 3:'Some Delay', 4:'Significant Delay', 5:'Strenuous' };
const MOOD_DESC       = { 1:'Somber Outlook', 2:'Low Energy', 3:'Neutral State', 4:'Positive Flow', 5:'Radiant' };

function updateStats(data) {
  const n = data.length;
  if (n === 0) return;

  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather]||0)+1);
  const domWx  = Object.entries(wxCount).sort((a,b)=>b[1]-a[1])[0][0];

  const avgC = data.reduce((s,e)=>s+e.commute,0)/n;
  const avgS = data.reduce((s,e)=>s+e.stress,0)/n;
  const avgM = data.reduce((s,e)=>s+e.mood,0)/n;

  document.getElementById('stat-weather').textContent   = WX_NAME[domWx] || domWx;
  document.getElementById('stat-commute').textContent   = avgC.toFixed(1);
  document.getElementById('stat-stress').textContent    = avgS.toFixed(1);
  document.getElementById('stat-mood').textContent      = avgM.toFixed(1);
  document.getElementById('stat-commute-sub').textContent  = WX_COMMUTE_DESC[Math.round(avgC)] || '';
  document.getElementById('stat-stress-sub').textContent   = WX_STRESS_DESC[Math.round(avgS)] || '';
  document.getElementById('stat-mood-sub').textContent     = MOOD_DESC[Math.round(avgM)] || '';
}

/* ══════════════════════════════════════════
   TODAY'S ATMOSPHERE PANEL
══════════════════════════════════════════ */
const todayCanvas = document.getElementById('today-canvas');
const todayCtx    = todayCanvas.getContext('2d');
let todayParticles = [];
let todayAnimId    = null;

// Weather → particle colour palette
const WX_PARTICLE_COLORS = {
  sunny:  ['rgba(210,190,100,', 'rgba(230,210,130,', 'rgba(180,160,80,'],
  cloudy: ['rgba(150,160,170,', 'rgba(170,175,185,', 'rgba(120,130,145,'],
  rainy:  ['rgba(80,130,175,',  'rgba(100,155,195,', 'rgba(60,110,160,'],
  snowy:  ['rgba(180,195,215,', 'rgba(200,210,230,', 'rgba(160,175,200,'],
  windy:  ['rgba(110,165,145,', 'rgba(130,180,160,', 'rgba(90,148,128,'],
};

// Weather → background gradient stops
const WX_BG = {
  sunny:  ['#e8e0c8','#ddd8c0'],
  cloudy: ['#d8dde3','#cdd5dc'],
  rainy:  ['#c8d8e8','#bccfe0'],
  snowy:  ['#dce3ec','#d0dce8'],
  windy:  ['#cdddd8','#c0d4cc'],
};

function initTodayCanvas(data) {
  const wrap = todayCanvas.parentElement;
  const W = wrap.clientWidth;
  const H = Math.round(W * 0.5);
  const dpr = window.devicePixelRatio || 1;
  todayCanvas.width  = W * dpr;
  todayCanvas.height = H * dpr;
  todayCanvas.style.width  = W + 'px';
  todayCanvas.style.height = H + 'px';
  todayCtx.scale(dpr, dpr);

  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather]||0)+1);
  const domWx = data.length ? Object.entries(wxCount).sort((a,b)=>b[1]-a[1])[0][0] : 'cloudy';
  const avgStress = data.length ? data.reduce((s,e)=>s+e.stress,0)/data.length : 3;
  const avgMood   = data.length ? data.reduce((s,e)=>s+e.mood,0)/data.length : 3;
  const colors = WX_PARTICLE_COLORS[domWx] || WX_PARTICLE_COLORS.cloudy;

  // Generate particles
  const count = Math.round(28 + avgStress * 8);
  todayParticles = Array.from({ length: count }, (_, i) => {
    const rand = mulberry32(i * 3571 + 41);
    return {
      x: rand() * W,
      y: rand() * H,
      r: 1.5 + rand() * (1.5 + avgMood * 0.4),
      opacity: 0.25 + rand() * 0.5,
      col: colors[Math.floor(rand() * colors.length)],
      vx: (rand() - 0.5) * (0.15 + (domWx === 'windy' ? 0.35 : 0.05)),
      vy: (rand() - 0.5) * 0.08 + (domWx === 'rainy' ? 0.18 + rand()*0.1 : 0.02),
      W, H,
    };
  });

  // Update wx label
  const wxEl = document.getElementById('today-wx-label');
  if (wxEl) wxEl.textContent = WX_NAME[domWx] || domWx;

  return { W, H, domWx, avgStress };
}

function drawTodayFrame(W, H, domWx) {
  const bg = WX_BG[domWx] || WX_BG.cloudy;
  const grad = todayCtx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg[0]);
  grad.addColorStop(1, bg[1]);
  todayCtx.fillStyle = grad;
  todayCtx.fillRect(0, 0, W, H);

  // Subtle horizon fog band
  const fog = todayCtx.createLinearGradient(0, H*0.45, 0, H*0.75);
  fog.addColorStop(0, 'rgba(255,255,255,0)');
  fog.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  fog.addColorStop(1, 'rgba(255,255,255,0)');
  todayCtx.fillStyle = fog;
  todayCtx.fillRect(0, H*0.45, W, H*0.3);

  // Draw particles
  todayParticles.forEach(p => {
    todayCtx.fillStyle = p.col + p.opacity + ')';
    todayCtx.beginPath();
    todayCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    todayCtx.fill();

    // Update position
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
  });
}

let _todayW = 0, _todayH = 0, _todayWx = 'cloudy';

function animateToday() {
  drawTodayFrame(_todayW, _todayH, _todayWx);
  todayAnimId = requestAnimationFrame(animateToday);
}

function renderTodayPanel(data) {
  if (todayAnimId) cancelAnimationFrame(todayAnimId);
  const { W, H, domWx } = initTodayCanvas(data);
  _todayW = W; _todayH = H; _todayWx = domWx;

  const n = data.length;
  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather]||0)+1);
  const dWx = n ? Object.entries(wxCount).sort((a,b)=>b[1]-a[1])[0][0] : null;
  const avgC = n ? (data.reduce((s,e)=>s+e.commute,0)/n) : null;
  const avgS = n ? (data.reduce((s,e)=>s+e.stress,0)/n)  : null;
  const avgM = n ? (data.reduce((s,e)=>s+e.mood,0)/n)    : null;

  const tsWeather = document.getElementById('ts-weather');
  const tsCommute = document.getElementById('ts-commute');
  const tsStress  = document.getElementById('ts-stress');
  const tsMood    = document.getElementById('ts-mood');
  const tsEntries = document.getElementById('today-entries');

  if (tsWeather) tsWeather.textContent = dWx ? WX_NAME[dWx] : '—';
  if (tsCommute) tsCommute.textContent = avgC !== null ? avgC.toFixed(1) : '—';
  if (tsStress)  tsStress.textContent  = avgS !== null ? avgS.toFixed(1) : '—';
  if (tsMood)    tsMood.textContent    = avgM !== null ? avgM.toFixed(1) : '—';
  if (tsEntries) tsEntries.textContent = `${n} check-in${n !== 1 ? 's' : ''} recorded`;

  animateToday();
}



function updateStats(data) {
  const n = data.length;
  if (n === 0) return;

  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather]||0)+1);
  const domWx  = Object.entries(wxCount).sort((a,b)=>b[1]-a[1])[0][0];

  const avgC = data.reduce((s,e)=>s+e.commute,0)/n;
  const avgS = data.reduce((s,e)=>s+e.stress,0)/n;
  const avgM = data.reduce((s,e)=>s+e.mood,0)/n;

  document.getElementById('stat-weather').textContent   = WX_NAME[domWx] || domWx;
  document.getElementById('stat-commute').textContent   = avgC.toFixed(1);
  document.getElementById('stat-stress').textContent    = avgS.toFixed(1);
  document.getElementById('stat-mood').textContent      = avgM.toFixed(1);
  document.getElementById('stat-commute-sub').textContent  = WX_COMMUTE_DESC[Math.round(avgC)] || '';
  document.getElementById('stat-stress-sub').textContent   = WX_STRESS_DESC[Math.round(avgS)] || '';
  document.getElementById('stat-mood-sub').textContent     = MOOD_DESC[Math.round(avgM)] || '';
}

/* ══════════════════════════════════════════
   FORM LOGIC
══════════════════════════════════════════ */
let selectedWeather = null;

// Weather buttons
document.querySelectorAll('.wx-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wx-pill').forEach(b => b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    selectedWeather = btn.dataset.value;
    document.getElementById('group-weather').classList.remove('has-error');
  });
});

// Effort radio styling
document.querySelectorAll('.effort-opt input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.effort-opt').forEach(l => l.classList.remove('selected'));
    radio.parentElement.classList.add('selected');
    document.getElementById('group-effort').classList.remove('has-error');
  });
});

// Form submit
document.getElementById('checkin-form').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  if (!selectedWeather) {
    document.getElementById('group-weather').classList.add('has-error');
    valid = false;
  }
  const effortEl = document.querySelector('input[name="effort"]:checked');
  if (!effortEl) {
    document.getElementById('group-effort').classList.add('has-error');
    valid = false;
  }
  if (!valid) return;

  const entry = {
    id:        uid(),
    timestamp: new Date().toISOString(),
    weather:   selectedWeather,
    commute:   parseInt(document.getElementById('commute-slider').value),
    stress:    parseInt(document.getElementById('stress-slider').value),
    mood:      parseInt(document.getElementById('mood-slider').value),
    effort:    parseInt(effortEl.value),
  };

  const data = loadData();
  data.push(entry);
  saveData(data);

  // Update all visualizations
  resizeCanvas();
  renderAtmosphere(data);
  updateStats(data);
  renderCharts(data);
  renderTodayPanel(data);

  // Success
  const msg = document.getElementById('success-msg');
  msg.classList.add('visible');
  setTimeout(() => msg.classList.remove('visible'), 3500);

  // Reset
  selectedWeather = null;
  document.querySelectorAll('.wx-pill').forEach(b => b.setAttribute('aria-pressed','false'));
  document.querySelectorAll('.effort-opt input').forEach(r => r.checked = false);
  document.querySelectorAll('.effort-opt').forEach(l => l.classList.remove('selected'));
  ['commute','stress','mood'].forEach(id => {
    document.getElementById(id+'-slider').value = 3;
  });

  // Scroll to canvas
  document.getElementById('canvas-container').scrollIntoView({ behavior:'smooth', block:'center' });
});

/* ══════════════════════════════════════════
   SIDEBAR NAV ACTIVE
══════════════════════════════════════════ */
function updateActiveNav() {
  const sections = ['hero','atmosphere','check-in','methodology'];
  const navMap   = {
    atmosphere:  document.getElementById('snav-atmosphere'),
    archive:     document.getElementById('snav-archive'),
    'check-in':  document.getElementById('snav-checkin'),
    methodology: document.getElementById('snav-methodology'),
  };
  let current = 'atmosphere';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  Object.values(navMap).forEach(el => { if(el) el.classList.remove('active'); });
  const active = navMap[current] || navMap['atmosphere'];
  if (active) active.classList.add('active');
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
function init() {
  ensureSeedData();

  resizeCanvas();
  const data = loadData();
  renderAtmosphere(data);
  updateStats(data);
  renderCharts(data);
  renderOrb();
  renderTodayPanel(data);

  window.addEventListener('resize', () => {
    resizeCanvas();
    renderAtmosphere(loadData());
    renderCharts(loadData());
    renderTodayPanel(loadData());
  });
}

init();
