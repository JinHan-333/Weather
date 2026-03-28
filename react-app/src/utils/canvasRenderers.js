import { mulberry32, getDominantWeather } from './helpers';
import { WX_ORDER, WX_NAME } from './constants';

// Intuitive weather → color mapping
// Sunny = warm amber, Cloudy = cool grey-blue, Rainy = ocean blue,
// Snowy = icy lavender, Windy = sage green
export const WX_COLORS = {
  sunny:  { r: 245, g: 185, b: 65  },  // warm amber ☀️
  cloudy: { r: 140, g: 140, b: 135 },  // muted stone grey ☁️
  rainy:  { r: 40,  g: 100, b: 180 },  // dark ocean blue 🌧️
  snowy:  { r: 140, g: 190, b: 235 },  // crisp ice blue ❄️
  windy:  { r: 115, g: 165, b: 185 },  // dusty teal 💨
};

/* ══════════════════════════════════════════
   MAIN ATMOSPHERE CANVAS
   Structured radial ring composition.
   Dots placed on concentric arc bands,
   grouped by weather sector. No grid lines —
   structure comes purely from dot positions.
   Animated with gentle drift and pulse.
══════════════════════════════════════════ */
export function createAtmosphereAnimation(canvas, data, mouseRef, hoveredEntryRef) {
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const S = wrap.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = S * dpr;
  canvas.height = S * dpr;
  canvas.style.width = S + 'px';
  canvas.style.height = S + 'px';
  ctx.scale(dpr, dpr);

  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2;

  if (!data.length) {
    function draw() {
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = '#f5f4f0';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    }
    return { draw, S };
  }

  // ── Aggregates ──
  const n = data.length;
  const avgStress = data.reduce((s, e) => s + e.stress, 0) / n;
  const avgMood = data.reduce((s, e) => s + e.mood, 0) / n;
  const avgCommute = data.reduce((s, e) => s + e.commute, 0) / n;

  // Weather distribution
  const wxCounts = {};
  data.forEach(e => wxCounts[e.weather] = (wxCounts[e.weather] || 0) + 1);
  const domWx = Object.entries(wxCounts).sort((a, b) => b[1] - a[1])[0][0];
  const domCol = WX_COLORS[domWx];

  // Data-driven parameters
  const rotationSpeed = 0.0004 + (avgStress / 5) * 0.0008;
  const driftMult = 0.6 + (avgCommute / 5) * 0.8;

  // MOOD → LIGHT: dramatic range.  avgMood 1 → 0.25 (very dim), avgMood 5 → 1.0 (full bright)
  const moodLight = 0.15 + (avgMood / 5) * 0.85;

  // Background tint strength from dominant weather
  const bgTintAlpha = 0.06 + (wxCounts[domWx] / n) * 0.10;

  // Latest entry
  const latestTimestamp = Math.max(...data.map(e => new Date(e.timestamp).getTime()));
  const latestEntry = data.find(e => new Date(e.timestamp).getTime() === latestTimestamp);

  // Geometry
  const innerR = R * 0.15;
  const outerR = R * 0.90;
  const RINGS = 10;
  const ringWidth = (outerR - innerR) / RINGS;
  const sectorSpan = (Math.PI * 2) / WX_ORDER.length;

  // Group data
  const grouped = {};
  WX_ORDER.forEach(wx => grouped[wx] = []);
  data.forEach(e => { if (grouped[e.weather]) grouped[e.weather].push(e); });

  // ── LAYER 1: Color wash blobs — WEATHER shapes the COLOR field ──
  const colorWashes = [];
  WX_ORDER.forEach((wx, si) => {
    const entries = grouped[wx];
    if (!entries.length) return;
    const col = WX_COLORS[wx];
    const sectorMid = si * sectorSpan - Math.PI / 2 + sectorSpan / 2;
    const washR = innerR + (outerR - innerR) * 0.5;
    const intensity = 0.03 + (entries.length / n) * 0.08;

    colorWashes.push({
      wx,
      size: ringWidth * 4 + entries.length * 2,
      cr: col.r, cg: col.g, cb: col.b,
      alpha: intensity,
      phase: si * 1.3,
      angle: sectorMid,
      dist: washR,
    });
  });

  // ── LAYER 1.5: Density heat pools — STRESS drives visible density fields ──
  // One heat pool per entry. High stress → larger, more opaque pool.
  // These overlap and accumulate, making dense areas visibly heavier/warmer.
  const heatPools = [];
  data.forEach((entry, i) => {
    const rand = mulberry32(
      parseInt(entry.id.replace(/[^a-z0-9]/g, '').slice(0, 8), 36) || i + 77
    );
    const col = WX_COLORS[entry.weather] || WX_COLORS.cloudy;
    const si = WX_ORDER.indexOf(entry.weather);
    const sectorStart = si * sectorSpan - Math.PI / 2;

    const entriesInSector = grouped[entry.weather];
    const ei = entriesInSector.indexOf(entry);
    const arcT = entriesInSector.length > 1 ? ei / (entriesInSector.length - 1) : 0.5;
    const baseAngle = sectorStart + sectorSpan * (0.04 + arcT * 0.92);

    const baseRing = Math.min(RINGS - 1, Math.floor((entry.stress - 1) / 5 * RINGS));
    const poolR = innerR + baseRing * ringWidth + ringWidth * 0.5;

    // Stress drives pool size and intensity: stress 1 → small faint, stress 5 → large heavy
    const stressT = entry.stress / 5;
    const poolSize = 12 + stressT * 30;
    const poolAlpha = 0.015 + stressT * 0.04;

    // Mood drives warmth of pool
    const moodT = entry.mood / 5;

    heatPools.push({
      wx: entry.weather,
      angle: baseAngle + (rand() - 0.5) * 0.06,
      dist: poolR + (rand() - 0.5) * ringWidth * 0.4,
      size: poolSize,
      alpha: poolAlpha,
      cr: col.r, cg: col.g, cb: col.b,
      moodT,
      phase: rand() * Math.PI * 2,
    });
  });

  // ── LAYER 2: Dots — STRESS shapes DENSITY, MOOD shapes LIGHT ──
  const allDots = [];

  WX_ORDER.forEach((wx, si) => {
    const entries = grouped[wx];
    if (!entries.length) return;
    const col = WX_COLORS[wx];
    const sectorStart = si * sectorSpan - Math.PI / 2;
    const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    sorted.forEach((entry, ei) => {
      const rand = mulberry32(
        parseInt(entry.id.replace(/[^a-z0-9]/g, '').slice(0, 8), 36) || ei + 77
      );

      const isLatest = entry === latestEntry;
      const baseRing = Math.min(RINGS - 1, Math.floor((entry.stress - 1) / 5 * RINGS));
      const arcT = sorted.length > 1 ? ei / (sorted.length - 1) : 0.5;
      const pad = 0.04;
      const baseAngle = sectorStart + sectorSpan * (pad + arcT * (1 - 2 * pad));

      // MOOD → per-dot LIGHT: mood 1 → small dim dot, mood 5 → large glowing dot
      const moodT = entry.mood / 5;  // 0.2 → 1.0
      const dotGlow = moodT > 0.6;   // mood 4-5 get halos
      const dotAlpha = 0.25 + moodT * 0.7;  // 0.45 → 0.95
      const moodSizeBoost = 1 + (moodT - 0.5) * 0.8; // mood 5 → 1.4x, mood 1 → 0.6x

      // Main dot
      const mainRing = baseRing + Math.floor(rand() * 2);
      const mainR = innerR + Math.min(RINGS - 1, mainRing) * ringWidth + ringWidth * (0.2 + rand() * 0.6);
      const baseSize = 3 + (entry.commute - 1) * 2 + rand() * 1.5;
      const dotSize = isLatest ? 9 : baseSize * moodSizeBoost;
      const v = (rand() - 0.5) * 20;

      allDots.push({
        wx,
        angle: baseAngle + (rand() - 0.5) * 0.05,
        radius: mainR,
        size: dotSize,
        alpha: dotAlpha * moodLight,
        cr: Math.min(255, Math.max(0, col.r + v)),
        cg: Math.min(255, Math.max(0, col.g + v)),
        cb: Math.min(255, Math.max(0, col.b + v)),
        phase: rand() * Math.PI * 2,
        driftSpeed: (rand() - 0.5) * 0.00012 * driftMult,
        fadeDelay: isLatest ? -1 : rand() * 1.5,
        isLatest,
        glow: isLatest || dotGlow,
        entry, // reference to original data for tooltip
        screenX: 0, screenY: 0, // updated each frame
      });

      // STRESS → DENSITY: stress 1 → 3 echoes (sparse), stress 5 → 14 echoes (dense cluster)
      const echoCount = isLatest ? 14 : (2 + Math.floor(entry.stress * 2.5));
      // STRESS → SPREAD: high stress → echoes pack tighter
      const spreadMult = isLatest ? 0.4 : (1.2 - (entry.stress / 5) * 0.7); // stress 5 → 0.5, stress 1 → 1.06

      for (let e = 0; e < echoCount; e++) {
        const eRand = mulberry32(ei * 331 + e * 773 + si * 11 + e * 997);
        const eRingOffset = Math.floor((eRand() - 0.5) * 4 * spreadMult);
        const eRing = Math.max(0, Math.min(RINGS - 1, baseRing + eRingOffset));
        const eR = innerR + eRing * ringWidth + ringWidth * (0.1 + eRand() * 0.8);
        const eAngle = baseAngle + (eRand() - 0.5) * sectorSpan * 0.6 * spreadMult;
        const eV = (eRand() - 0.5) * 30;
        const ringT = eRing / (RINGS - 1);
        const eMoodT = entry.mood / 5;
        const eSize = isLatest
          ? (3 + eRand() * 6)
          : (1 + ringT * 3 + eRand() * 2.5) * (0.7 + eMoodT * 0.5);

        allDots.push({
          wx,
          angle: eAngle,
          radius: Math.max(innerR, Math.min(outerR, eR)),
          size: eSize,
          alpha: (0.15 + eMoodT * 0.45) * moodLight,
          cr: Math.min(255, Math.max(0, col.r + eV)),
          cg: Math.min(255, Math.max(0, col.g + eV)),
          cb: Math.min(255, Math.max(0, col.b + eV)),
          phase: eRand() * Math.PI * 2,
          driftSpeed: (eRand() - 0.5) * 0.00015 * driftMult,
          fadeDelay: isLatest ? -1 : eRand() * 2,
          isLatest,
          glow: isLatest || (eMoodT > 0.7 && eRand() > 0.5),
        });
      }
    });
  });

  // Pre-build gradients
  const vignetteGrad = ctx.createRadialGradient(cx, cy, outerR * 0.95, cx, cy, R);
  vignetteGrad.addColorStop(0, 'rgba(245,244,240,0)');
  vignetteGrad.addColorStop(0.4, 'rgba(245,244,240,0.2)');
  vignetteGrad.addColorStop(1, 'rgba(245,244,240,0.9)');

  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 1.2);
  centerGrad.addColorStop(0, 'rgba(245,244,240,0.95)');
  centerGrad.addColorStop(0.7, 'rgba(245,244,240,0.4)');
  centerGrad.addColorStop(1, 'rgba(245,244,240,0)');

  let time = 0;
  let rotation = 0;
  let activeFilter = null;

  function setFilter(wx) { activeFilter = wx; }

  function draw() {
    time += 0.008;
    rotation += rotationSpeed;

    ctx.clearRect(0, 0, S, S);
    ctx.save();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // ── Background: base + dominant weather tint ──
    // Mood dims/brightens the base: low mood → darker bg, high mood → warm light bg
    const bgBright = Math.round(235 + moodLight * 15); // 237 → 250
    ctx.fillStyle = `rgb(${bgBright},${bgBright - 2},${bgBright - 6})`;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = `rgba(${domCol.r},${domCol.g},${domCol.b},${bgTintAlpha})`;
    ctx.fillRect(0, 0, S, S);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    // ── Layer 1: Color wash blobs — weather atmosphere ──
    colorWashes.forEach(w => {
      const filt = activeFilter ? (w.wx === activeFilter ? 1 : 0.12) : 1;
      const wobble = Math.sin(time * 0.5 + w.phase) * 5;
      const wpx = cx + Math.cos(w.angle) * (w.dist + wobble);
      const wpy = cy + Math.sin(w.angle) * (w.dist + wobble);
      const pulse = 1 + Math.sin(time * 0.4 + w.phase) * 0.1;

      // Outer soft wash
      ctx.fillStyle = `rgba(${w.cr},${w.cg},${w.cb},${w.alpha * moodLight * 0.5 * pulse * filt})`;
      ctx.beginPath();
      ctx.arc(wpx, wpy, w.size * 1.6 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.fillStyle = `rgba(${w.cr},${w.cg},${w.cb},${w.alpha * moodLight * pulse * filt})`;
      ctx.beginPath();
      ctx.arc(wpx, wpy, w.size * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Layer 1.5: Density heat pools — accumulated stress glow ──
    // These overlap: where many high-stress entries cluster, the color
    // builds up into a visible warm/heavy field. Low-stress areas stay light.
    heatPools.forEach(hp => {
      const filt = activeFilter ? (hp.wx === activeFilter ? 1 : 0.1) : 1;
      const a = hp.angle + time * 0.00003 * 50;
      const wobble = Math.sin(time * 0.6 + hp.phase) * 3;
      const hpx = cx + Math.cos(a) * (hp.dist + wobble);
      const hpy = cy + Math.sin(a) * (hp.dist + wobble);
      const pulse = 1 + Math.sin(time * 0.5 + hp.phase) * 0.08;
      const sz = hp.size * pulse;
      const light = moodLight * (0.6 + hp.moodT * 0.4);

      ctx.fillStyle = `rgba(${hp.cr},${hp.cg},${hp.cb},${hp.alpha * light * 0.3 * filt})`;
      ctx.beginPath();
      ctx.arc(hpx, hpy, sz * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${hp.cr},${hp.cg},${hp.cb},${hp.alpha * light * 0.6 * filt})`;
      ctx.beginPath();
      ctx.arc(hpx, hpy, sz * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${hp.cr},${hp.cg},${hp.cb},${hp.alpha * light * filt})`;
      ctx.beginPath();
      ctx.arc(hpx, hpy, sz * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Layer 2: Dots with mood-driven glow + hover highlight ──
    const mouse = mouseRef ? mouseRef.current : { x: -1, y: -1 };
    const hasHover = mouse.x >= 0 && mouse.y >= 0;
    const hoverRadius = 50;
    const hoveredEntry = hoveredEntryRef ? hoveredEntryRef.current : null;

    allDots.forEach(dot => {
      const filt = activeFilter ? (dot.wx === activeFilter ? 1 : 0.08) : 1;
      const currentAngle = dot.angle + time * dot.driftSpeed * 50;
      const breathe = 1 + Math.sin(time * 1.8 + dot.phase) * 0.1;
      const fadeIn = dot.fadeDelay < 0
        ? 1
        : Math.min(1, Math.max(0, (time - dot.fadeDelay) * 1.5));
      let sz = dot.size * breathe;
      const px = cx + Math.cos(currentAngle) * dot.radius;
      const py = cy + Math.sin(currentAngle) * dot.radius;
      let alpha = dot.alpha * fadeIn * filt;

      if (alpha < 0.01) return;

      // Is this the specifically hovered dot (matched by entry reference)?
      const isHovered = dot.entry && hoveredEntry && dot.entry === hoveredEntry;

      // Cursor proximity: subtle ambient brightening near mouse
      let proximity = 0;
      if (hasHover && !isHovered) {
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < hoverRadius) {
          proximity = 1 - dist / hoverRadius;
          sz *= 1 + proximity * 0.3;
          alpha = Math.min(1, alpha + proximity * 0.15);
        }
      }

      // Hovered dot: strong highlight
      if (isHovered) {
        sz *= 1.6;
        alpha = Math.min(1, alpha + 0.3);

        // Highlight ring
        ctx.strokeStyle = `rgba(${Math.round(dot.cr)},${Math.round(dot.cg)},${Math.round(dot.cb)},0.5)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, sz + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Soft glow behind
        ctx.fillStyle = `rgba(${Math.round(dot.cr)},${Math.round(dot.cg)},${Math.round(dot.cb)},0.12)`;
        ctx.beginPath();
        ctx.arc(px, py, sz * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glow halo for high-mood dots and latest entry
      if (dot.glow && !isHovered) {
        const glowAlpha = dot.isLatest
          ? alpha * 0.2 * (0.5 + Math.sin(time * 3 + dot.phase) * 0.5)
          : alpha * 0.12;
        ctx.fillStyle = `rgba(${Math.round(dot.cr)},${Math.round(dot.cg)},${Math.round(dot.cb)},${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, sz * (dot.isLatest ? 3.5 : 2.5), 0, Math.PI * 2);
        ctx.fill();
      }

      // Core dot
      ctx.fillStyle = `rgba(${Math.round(dot.cr)},${Math.round(dot.cg)},${Math.round(dot.cb)},${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fill();

      // Track screen position for hit-testing (main data dots only)
      if (dot.entry) {
        dot.screenX = px;
        dot.screenY = py;
        dot.screenSize = sz;
      }
    });

    ctx.restore();

    // Center fade
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Edge vignette
    ctx.fillStyle = vignetteGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Hit-test: find the closest main data dot to a screen coordinate
  function hitTest(mx, my, radius = 35) {
    let closest = null;
    let minDist = radius;
    allDots.forEach(dot => {
      if (!dot.entry) return;
      const dx = dot.screenX - mx;
      const dy = dot.screenY - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = {
          x: dot.screenX,
          y: dot.screenY,
          entry: dot.entry,
        };
      }
    });
    return closest;
  }

  return { draw, S, hitTest, setFilter };
}

/* ══════════════════════════════════════════
   TODAY PANEL — Miniature atmospheric field
   Same visual language as the main canvas:
   weather tint, color washes, heat pools,
   dots with glow, vignette. Just smaller.
══════════════════════════════════════════ */
export function createTodayAnimation(canvas, data) {
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth;
  const H = Math.round(W * 0.55);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const cxp = W / 2;
  const cyp = H / 2;
  const R = Math.min(W, H) * 0.46;
  const domWx = getDominantWeather(data);

  if (!data.length) {
    function draw() { ctx.fillStyle = '#eceae5'; ctx.fillRect(0, 0, W, H); }
    return { draw, domWx };
  }

  // ── Aggregates (same as main canvas) ──
  const n = data.length;
  const avgStress = data.reduce((s, e) => s + e.stress, 0) / n;
  const avgMood = data.reduce((s, e) => s + e.mood, 0) / n;
  const wxCounts = {};
  data.forEach(e => wxCounts[e.weather] = (wxCounts[e.weather] || 0) + 1);
  const domCol = WX_COLORS[domWx];
  const moodLight = 0.15 + (avgMood / 5) * 0.85;
  const bgTintAlpha = 0.05 + (wxCounts[domWx] / n) * 0.08;
  const rotSpeed = 0.0003 + (avgStress / 5) * 0.0005;

  // Geometry
  const innerR = R * 0.15;
  const outerR = R * 0.88;
  const RINGS = 8;
  const ringWidth = (outerR - innerR) / RINGS;
  const sectorSpan = (Math.PI * 2) / WX_ORDER.length;

  const grouped = {};
  WX_ORDER.forEach(wx => grouped[wx] = []);
  data.forEach(e => { if (grouped[e.weather]) grouped[e.weather].push(e); });

  // ── Color washes (one per weather type) ──
  const washes = [];
  WX_ORDER.forEach((wx, si) => {
    const entries = grouped[wx];
    if (!entries.length) return;
    const col = WX_COLORS[wx];
    const sectorMid = si * sectorSpan - Math.PI / 2 + sectorSpan / 2;
    const washDist = innerR + (outerR - innerR) * 0.5;
    washes.push({
      angle: sectorMid, dist: washDist,
      size: ringWidth * 3 + entries.length * 1.5,
      alpha: 0.03 + (entries.length / n) * 0.07,
      cr: col.r, cg: col.g, cb: col.b,
      phase: si * 1.3,
    });
  });

  // ── Heat pools (one per entry, stress-driven) ──
  const pools = [];
  data.forEach((entry, i) => {
    const rand = mulberry32(parseInt(entry.id.replace(/[^a-z0-9]/g, '').slice(0, 6), 36) || i + 33);
    const col = WX_COLORS[entry.weather] || WX_COLORS.cloudy;
    const si = WX_ORDER.indexOf(entry.weather);
    const sectorStart = si * sectorSpan - Math.PI / 2;
    const entries = grouped[entry.weather];
    const ei = entries.indexOf(entry);
    const arcT = entries.length > 1 ? ei / (entries.length - 1) : 0.5;
    const baseAngle = sectorStart + sectorSpan * (0.04 + arcT * 0.92);
    const baseRing = Math.min(RINGS - 1, Math.floor((entry.stress - 1) / 5 * RINGS));
    const stressT = entry.stress / 5;

    pools.push({
      angle: baseAngle + (rand() - 0.5) * 0.05,
      dist: innerR + baseRing * ringWidth + ringWidth * 0.5 + (rand() - 0.5) * ringWidth * 0.3,
      size: 8 + stressT * 18,
      alpha: 0.012 + stressT * 0.03,
      cr: col.r, cg: col.g, cb: col.b,
      moodT: entry.mood / 5,
      phase: rand() * Math.PI * 2,
    });
  });

  // ── Dots with echoes ──
  const dots = [];
  WX_ORDER.forEach((wx, si) => {
    const entries = grouped[wx];
    if (!entries.length) return;
    const col = WX_COLORS[wx];
    const sectorStart = si * sectorSpan - Math.PI / 2;

    entries.forEach((entry, ei) => {
      const rand = mulberry32(parseInt(entry.id.replace(/[^a-z0-9]/g, '').slice(0, 6), 36) || ei + 33);
      const baseRing = Math.min(RINGS - 1, Math.floor((entry.stress - 1) / 5 * RINGS));
      const arcT = entries.length > 1 ? ei / (entries.length - 1) : 0.5;
      const baseAngle = sectorStart + sectorSpan * (0.04 + arcT * 0.92);
      const moodT = entry.mood / 5;
      const rr = innerR + baseRing * ringWidth + ringWidth * (0.2 + rand() * 0.6);
      const v = (rand() - 0.5) * 20;

      // Main dot
      dots.push({
        angle: baseAngle + (rand() - 0.5) * 0.05,
        radius: rr,
        size: 2 + (entry.commute - 1) * 1.5 + rand(),
        alpha: (0.3 + moodT * 0.6) * moodLight,
        cr: Math.min(255, Math.max(0, col.r + v)),
        cg: Math.min(255, Math.max(0, col.g + v)),
        cb: Math.min(255, Math.max(0, col.b + v)),
        phase: rand() * Math.PI * 2,
        drift: (rand() - 0.5) * 0.0001,
        glow: moodT > 0.6,
      });

      // 3-4 echoes
      const echoCount = 3 + Math.floor(rand() * 2);
      for (let e = 0; e < echoCount; e++) {
        const eRand = mulberry32(ei * 331 + e * 773 + si * 11);
        const eRingOff = Math.floor((eRand() - 0.4) * 4);
        const eRing = Math.max(0, Math.min(RINGS - 1, baseRing + eRingOff));
        const eR = innerR + eRing * ringWidth + ringWidth * (0.1 + eRand() * 0.8);
        const eV = (eRand() - 0.5) * 25;
        dots.push({
          angle: baseAngle + (eRand() - 0.5) * sectorSpan * 0.5,
          radius: Math.max(innerR, Math.min(outerR, eR)),
          size: 1 + eRand() * 2.5,
          alpha: (0.15 + moodT * 0.3) * moodLight,
          cr: Math.min(255, Math.max(0, col.r + eV)),
          cg: Math.min(255, Math.max(0, col.g + eV)),
          cb: Math.min(255, Math.max(0, col.b + eV)),
          phase: eRand() * Math.PI * 2,
          drift: (eRand() - 0.5) * 0.00012,
          glow: false,
        });
      }
    });
  });

  // Pre-build vignette
  const vigGrad = ctx.createRadialGradient(cxp, cyp, R * 0.7, cxp, cyp, R * 1.1);
  vigGrad.addColorStop(0, 'rgba(236,234,229,0)');
  vigGrad.addColorStop(0.6, 'rgba(236,234,229,0.15)');
  vigGrad.addColorStop(1, 'rgba(236,234,229,0.7)');

  let time = 0;
  let rot = 0;

  function draw() {
    time += 0.006;
    rot += rotSpeed;

    // Background with weather tint
    const bgB = Math.round(230 + moodLight * 10);
    ctx.fillStyle = `rgb(${bgB},${bgB - 2},${bgB - 5})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(${domCol.r},${domCol.g},${domCol.b},${bgTintAlpha})`;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cxp, cyp);
    ctx.rotate(rot);
    ctx.translate(-cxp, -cyp);

    // Color washes
    washes.forEach(w => {
      const wobble = Math.sin(time * 0.5 + w.phase) * 3;
      const wpx = cxp + Math.cos(w.angle) * (w.dist + wobble);
      const wpy = cyp + Math.sin(w.angle) * (w.dist + wobble);
      const pulse = 1 + Math.sin(time * 0.4 + w.phase) * 0.08;
      ctx.fillStyle = `rgba(${w.cr},${w.cg},${w.cb},${w.alpha * moodLight * 0.5 * pulse})`;
      ctx.beginPath(); ctx.arc(wpx, wpy, w.size * 1.4 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${w.cr},${w.cg},${w.cb},${w.alpha * moodLight * pulse})`;
      ctx.beginPath(); ctx.arc(wpx, wpy, w.size * pulse, 0, Math.PI * 2); ctx.fill();
    });

    // Heat pools
    pools.forEach(hp => {
      const a = hp.angle + time * 0.00003 * 40;
      const wobble = Math.sin(time * 0.6 + hp.phase) * 2;
      const hpx = cxp + Math.cos(a) * (hp.dist + wobble);
      const hpy = cyp + Math.sin(a) * (hp.dist + wobble);
      const pulse = 1 + Math.sin(time * 0.5 + hp.phase) * 0.06;
      const sz = hp.size * pulse;
      const light = moodLight * (0.6 + hp.moodT * 0.4);
      ctx.fillStyle = `rgba(${hp.cr},${hp.cg},${hp.cb},${hp.alpha * light * 0.3})`;
      ctx.beginPath(); ctx.arc(hpx, hpy, sz * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${hp.cr},${hp.cg},${hp.cb},${hp.alpha * light})`;
      ctx.beginPath(); ctx.arc(hpx, hpy, sz * 0.6, 0, Math.PI * 2); ctx.fill();
    });

    // Dots with glow
    dots.forEach(d => {
      const a = d.angle + time * d.drift * 40;
      const breathe = 1 + Math.sin(time * 1.5 + d.phase) * 0.08;
      const px = cxp + Math.cos(a) * d.radius;
      const py = cyp + Math.sin(a) * d.radius;
      const sz = d.size * breathe;

      if (d.glow) {
        ctx.fillStyle = `rgba(${Math.round(d.cr)},${Math.round(d.cg)},${Math.round(d.cb)},${d.alpha * 0.1})`;
        ctx.beginPath(); ctx.arc(px, py, sz * 2.2, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = `rgba(${Math.round(d.cr)},${Math.round(d.cg)},${Math.round(d.cb)},${d.alpha})`;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();

    // Vignette
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);
  }

  return { draw, domWx };
}

/* ══════════════════════════════════════════
   METHODOLOGY ORB
══════════════════════════════════════════ */
export function createOrbAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 260;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = S * dpr;
  canvas.height = S * dpr;
  canvas.style.width = S + 'px';
  canvas.style.height = S + 'px';
  ctx.scale(dpr, dpr);

  const cxo = S / 2, cyo = S / 2;

  const rays = Array.from({ length: 100 }, (_, i) => {
    const rand = mulberry32(i * 997 + 13);
    return {
      angle: (i / 100) * Math.PI * 2,
      r1: 2 + rand() * 8,
      r2: 25 + rand() * 85,
      hue: 15 + rand() * 50,
      sat: 65 + rand() * 35,
      light: 45 + rand() * 35,
      phase: rand() * Math.PI * 2,
    };
  });

  let time = 0;

  function draw() {
    time += 0.01;

    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(cxo, cyo, S / 2, 0, Math.PI * 2); ctx.fill();

    rays.forEach(ray => {
      const pulse = 0.7 + Math.sin(time * 3 + ray.phase) * 0.3;
      const cr2 = ray.r2 * pulse;
      const a = ray.angle + Math.sin(time + ray.phase) * 0.03;
      ctx.strokeStyle = `hsla(${ray.hue},${ray.sat}%,${ray.light}%,${0.6 * pulse})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cxo + Math.cos(a) * ray.r1, cyo + Math.sin(a) * ray.r1);
      ctx.lineTo(cxo + Math.cos(a) * cr2, cyo + Math.sin(a) * cr2);
      ctx.stroke();
    });

    const gp = 1 + Math.sin(time * 2) * 0.15;
    const cGrad = ctx.createRadialGradient(cxo, cyo, 0, cxo, cyo, 30 * gp);
    cGrad.addColorStop(0, 'rgba(255,230,200,0.9)');
    cGrad.addColorStop(0.5, 'rgba(255,200,140,0.3)');
    cGrad.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath(); ctx.arc(cxo, cyo, 30 * gp, 0, Math.PI * 2); ctx.fill();

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath(); ctx.arc(cxo, cyo, S / 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  return { draw };
}

/* ══════════════════════════════════════════
   LINE CHARTS — with hover support
   Returns point positions for hit-testing.
   Accepts highlightIdx to render a hovered state.
══════════════════════════════════════════ */
export function drawLineChart(canvasEl, data, field, highlightIdx) {
  const W = canvasEl.parentElement.clientWidth;
  const H = 120;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = W * dpr;
  canvasEl.height = H * dpr;
  canvasEl.style.width = W + 'px';
  canvasEl.style.height = H + 'px';
  const c = canvasEl.getContext('2d');
  c.scale(dpr, dpr);

  const groups = WX_ORDER.map(wx => data.filter(e => e.weather === wx));
  const avgs = groups.map(g =>
    g.length ? g.reduce((s, e) => s + e[field], 0) / g.length : null
  );
  const counts = groups.map(g => g.length);

  const validAvgs = avgs.filter(v => v !== null);
  if (validAvgs.length < 2) return [];

  const minV = 1, maxV = 5;
  // Padding matches the icon/label row below so dots align with labels
  const padL = 20, padR = 20, padT = 16, padB = 8;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const toX = (i) => padL + (i / (WX_ORDER.length - 1)) * cW;
  const toY = (v) => padT + cH - ((v - minV) / (maxV - minV)) * cH;

  // Filled area
  c.save();
  c.beginPath();
  let started = false;
  WX_ORDER.forEach((_, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
  });
  const lastIdx = avgs.map((v, i) => [v, i]).filter(([v]) => v !== null).at(-1)[1];
  const firstIdx = avgs.map((v, i) => [v, i]).filter(([v]) => v !== null)[0][1];
  c.lineTo(toX(lastIdx), H);
  c.lineTo(toX(firstIdx), H);
  c.closePath();
  const fillGrad = c.createLinearGradient(0, 0, 0, H);
  fillGrad.addColorStop(0, 'rgba(61,107,90,0.12)');
  fillGrad.addColorStop(1, 'rgba(61,107,90,0)');
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
  WX_ORDER.forEach((_, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
  });
  c.stroke();
  c.restore();

  // Build point data for hit-testing
  const points = [];

  WX_ORDER.forEach((wx, i) => {
    if (avgs[i] === null) return;
    const x = toX(i), y = toY(avgs[i]);
    const isHovered = highlightIdx === i;

    // Hover highlight ring
    if (isHovered) {
      c.fillStyle = 'rgba(61,107,90,0.08)';
      c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(61,107,90,0.25)';
      c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.stroke();
    }

    // Dot
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(x, y, isHovered ? 5 : 3.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3d6b5a';
    c.beginPath(); c.arc(x, y, isHovered ? 3 : 2, 0, Math.PI * 2); c.fill();

    // Value label
    c.fillStyle = '#7a8a84';
    c.font = `${isHovered ? '600' : '500'} 9px Inter, sans-serif`;
    c.textAlign = 'center';
    c.fillText(avgs[i].toFixed(1), x, y - (isHovered ? 9 : 7));

    points.push({
      x, y, wx,
      avg: avgs[i],
      count: counts[i],
      index: i,
    });
  });

  return points;
}
