// Full-window machine network: a jittered mesh of drifting nodes with pulsing
// edges and data packets travelling along the connections. Pure 2D canvas, no
// dependencies. The center stays calm so the logo and slogan read clearly.

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

const C_PRIMARY = '37, 73, 255';    // #2549FF
const C_SECONDARY = '191, 77, 243'; // #BF4DF3

const SPACING = 122;     // target mesh spacing in px
const MAX_SIGNALS = 60;  // travelling data packets

let W = 0, H = 0;
let nodes = [], edges = [], signals = [];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Calmer toward the center so the centered logo stays legible.
function centerFactor(x, y) {
  const d = Math.hypot(x - W / 2, y - H / 2);
  const r = Math.min(W, H);
  return smoothstep(r * 0.12, r * 0.34, d);
}

// Roaming brightness wave: overlapping sines at different angles/speeds so
// regions of the mesh light up and dim independently — makes it feel alive.
function pulse(x, y, t) {
  const v =
    Math.sin(x * 0.0042 + t * 0.8) +
    Math.sin(y * 0.0052 - t * 0.6) +
    Math.sin((x * 0.6 + y * 0.8) * 0.004 + t * 1.1);
  return 0.6 + ((v + 3) / 6) * 1.2; // ~0.6 (dim, still visible) .. 1.8 (bright)
}

// — Smooth data sources (for the centered chart) —
function walk(n, start = 0.5, step = 0.16) {
  const a = [];
  let x = start;
  for (let i = 0; i < n; i++) {
    a.push(x);
    x = clamp(x + (Math.random() - 0.5) * step, 0.08, 0.92);
  }
  return a;
}
const nextVal = (arr, step = 0.16) =>
  clamp(arr[arr.length - 1] + (Math.random() - 0.5) * step, 0.08, 0.92);

// Local-x positions for a scrolling buffer, clipped to [0,w] with interpolation.
function scrollPoints(values, phase, w) {
  const N = values.length;
  const step = w / (N - 3);
  const raw = values.map((val, i) => ({ x: (i - phase) * step, val }));
  const lerp = (a, b, X) => {
    const t = (X - a.x) / (b.x - a.x);
    return { x: X, val: a.val + (b.val - a.val) * t };
  };
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i], prev = raw[i - 1];
    if (prev) {
      if ((prev.x < 0) !== (p.x < 0)) out.push(lerp(prev, p, 0));
      if ((prev.x <= w) !== (p.x <= w)) out.push(lerp(prev, p, w));
    }
    if (p.x >= 0 && p.x <= w) out.push(p);
  }
  return out;
}

// — Centered multi-line chart (~50% of the window, behind the logo) —
const CHART_COLS = [C_PRIMARY, C_SECONDARY, '120, 150, 255'];
const C_ALERT = '235, 51, 36';
const C_GREY = '116, 107, 125'; // --brand-grey-600
const THRESHOLD_HI = 0.9;  // upper alert band (fraction of chart height)
const THRESHOLD_LO = 0.1;  // lower alert band
const MAX_ALERTS = 2;       // cap how many markers show at once
const ALERT_MIN_GAP = 360;  // min horizontal px between markers
const chart = {
  s: CHART_COLS.map((_, i) => walk(90, 0.5 + (i - 1) * 0.12, 0.13)),
  p: [0, 0, 0],
  spd: [6.5, 7.5, 5.5],
};

// One marker per contiguous out-of-band run, placed at the run's extremum.
function collectRuns(pts, cx, cy, ch, type, out) {
  const inBand = type === 'hi' ? (v) => v >= THRESHOLD_HI : (v) => v <= THRESHOLD_LO;
  const better = type === 'hi' ? (v, b) => v > b : (v, b) => v < b;
  let i = 0;
  while (i < pts.length) {
    if (!inBand(pts[i].val)) { i++; continue; }
    let j = i, ext = i;
    while (j < pts.length && inBand(pts[j].val)) {
      if (better(pts[j].val, pts[ext].val)) ext = j;
      j++;
    }
    out.push({ x: cx + pts[ext].x, y: cy + ch - pts[ext].val * ch, type });
    i = j;
  }
}

function drawAlert(a, alertPulse) {
  const { x, y, type } = a;
  const r = 14 * alertPulse;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${C_ALERT}, ${0.85 * alertPulse})`);
  g.addColorStop(1, `rgba(${C_ALERT}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${C_ALERT}, 1)`;
  ctx.fill();

  const dir = type === 'hi' ? -1 : 1; // label above the dot for highs, below for lows
  const ly = y + dir * 24;
  ctx.strokeStyle = `rgba(${C_GREY}, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + dir * 6);
  ctx.lineTo(x + 18, ly);
  ctx.lineTo(x + 30, ly);
  ctx.stroke();

  ctx.font = '400 9px "GT America Extended", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(${C_GREY}, 0.9)`;
  ctx.fillText(type === 'hi' ? 'THRESHOLD EXCEEDED' : 'THRESHOLD UNDERRUN', x + 34, ly);
  ctx.letterSpacing = '0px';
}

function drawChart(dt, t) {
  const cw = W, ch = H * 0.46;
  const cx = (W - cw) / 2, cy = (H - ch) / 2 + H * 0.16;

  ctx.strokeStyle = `rgba(${C_PRIMARY}, 0.05)`;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = cy + (ch * i) / 4;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();
  }

  // Alert bands — going above the upper line or below the lower triggers a marker.
  const tyHi = cy + ch - THRESHOLD_HI * ch;
  const tyLo = cy + ch - THRESHOLD_LO * ch;
  ctx.strokeStyle = `rgba(${C_ALERT}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  for (const ly of [tyHi, tyLo]) {
    ctx.beginPath();
    ctx.moveTo(cx, ly);
    ctx.lineTo(cx + cw, ly);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const alerts = [];
  for (let i = 0; i < chart.s.length; i++) {
    chart.p[i] += dt * chart.spd[i];
    while (chart.p[i] >= 1) {
      chart.p[i] -= 1;
      chart.s[i].shift();
      chart.s[i].push(nextVal(chart.s[i], 0.13));
    }
    const pts = scrollPoints(chart.s[i], chart.p[i], cw);
    if (pts.length < 2) continue;
    ctx.beginPath();
    for (let k = 0; k < pts.length; k++) {
      const x = cx + pts[k].x, y = cy + ch - pts[k].val * ch;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = `rgba(${CHART_COLS[i]}, 0.7)`;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    const last = pts[pts.length - 1];
    const lx = cx + last.x, ly = cy + ch - last.val * ch;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${CHART_COLS[i]}, 1)`;
    ctx.fill();

    collectRuns(pts, cx, cy, ch, 'hi', alerts);
    collectRuns(pts, cx, cy, ch, 'lo', alerts);
  }

  // Thin out markers: keep a horizontally spaced subset, capped.
  alerts.sort((a, b) => a.x - b.x);
  const shown = [];
  for (const a of alerts) {
    if (shown.length && a.x - shown[shown.length - 1].x < ALERT_MIN_GAP) continue;
    shown.push(a);
    if (shown.length >= MAX_ALERTS) break;
  }

  const alertPulse = 0.7 + Math.sin(t * 6) * 0.3;
  for (const a of shown) drawAlert(a, alertPulse);
}

function newSignal(initial) {
  const e = (Math.random() * edges.length) | 0;
  return {
    e,
    t: initial ? Math.random() : 0,
    spd: rand(0.18, 0.5),
    col: edges[e].col,
    dir: Math.random() < 0.5 ? 1 : -1,
  };
}

function build() {
  nodes = [];
  edges = [];
  const cols = Math.ceil(W / SPACING) + 2;
  const rows = Math.ceil(H / SPACING) + 2;
  const ox = (W - (cols - 1) * SPACING) / 2;
  const oy = (H - (rows - 1) * SPACING) / 2;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const bx = ox + c * SPACING + rand(-SPACING * 0.22, SPACING * 0.22);
      const by = oy + r * SPACING + rand(-SPACING * 0.22, SPACING * 0.22);
      grid[r][c] = nodes.length;
      nodes.push({
        bx, by, x: bx, y: by,
        phase: rand(0, Math.PI * 2),
        amp: rand(5, 14),
        spd: rand(0.15, 0.5),
      });
    }
  }
  const link = (a, b) =>
    edges.push({ a, b, col: Math.random() < 0.3 ? C_SECONDARY : C_PRIMARY });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cur = grid[r][c];
      if (c + 1 < cols) link(cur, grid[r][c + 1]);
      if (r + 1 < rows) link(cur, grid[r + 1][c]);
      if (r + 1 < rows && c + 1 < cols) link(cur, grid[r + 1][c + 1]);
      if (r + 1 < rows && c - 1 >= 0) link(cur, grid[r + 1][c - 1]);
    }
  }
  signals = [];
  for (let i = 0; i < MAX_SIGNALS; i++) signals.push(newSignal(true));
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  build();
}
resize();
addEventListener('resize', resize);

const MAX_LEN = SPACING * 1.7;

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  ctx.clearRect(0, 0, W, H);

  for (const n of nodes) {
    n.x = n.bx + Math.sin(t * n.spd + n.phase) * n.amp;
    n.y = n.by + Math.cos(t * n.spd * 0.85 + n.phase) * n.amp;
  }

  // Edges
  ctx.lineWidth = 1;
  for (const e of edges) {
    const a = nodes[e.a], b = nodes[e.b];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const cf = centerFactor(mx, my);
    if (cf <= 0.002) continue;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const alpha = 0.22 * clamp(1 - len / MAX_LEN, 0, 1) * cf * pulse(mx, my, t);
    if (alpha < 0.004) continue;
    ctx.strokeStyle = `rgba(${e.col}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Nodes
  for (const n of nodes) {
    const cf = centerFactor(n.x, n.y);
    if (cf <= 0.02) continue;
    const pl = pulse(n.x, n.y, t);
    ctx.beginPath();
    ctx.arc(n.x, n.y, 0.9 + pl * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${C_PRIMARY}, ${clamp(0.22 * cf * pl, 0, 1)})`;
    ctx.fill();
  }

  // Travelling data packets
  for (const s of signals) {
    s.t += dt * s.spd;
    if (s.t >= 1) Object.assign(s, newSignal(false));
    const e = edges[s.e];
    const a = nodes[e.a], b = nodes[e.b];
    const tt = s.dir > 0 ? s.t : 1 - s.t;
    const x = a.x + (b.x - a.x) * tt;
    const y = a.y + (b.y - a.y) * tt;
    const cf = centerFactor(x, y);
    if (cf <= 0.02) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
    g.addColorStop(0, `rgba(${s.col}, ${0.85 * cf})`);
    g.addColorStop(1, `rgba(${s.col}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${s.col}, ${cf})`;
    ctx.fill();
  }

  drawChart(dt, t);

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
