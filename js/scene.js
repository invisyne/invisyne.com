// Full-window machine network: a jittered mesh of drifting nodes with pulsing
// edges and data packets travelling along the connections. Pure 2D canvas, no
// dependencies. The center stays calm so the logo and slogan read clearly.
// A centered multi-line chart shows live signals with threshold incidents,
// framed by an abstract asset-lifecycle ribbon (operational-intelligence motif —
// no methodology disclosed).

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

// Respect reduced-motion: render a single static frame instead of animating.
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// — View cycling — the same logged signals seen through different operational
// lenses. Each view sets the emphasis (alpha) of the layers; the renderer
// morphs between consecutive views. "Context" is the IP-safe lens (no method
// disclosed). Inspired by data-viz studios that morph one dataset across views.
const VIEWS = [
  { key: 'Signals',     lines: 1.0,  alarms: 0.18, forecast: 0, context: 0, life: 0.45, dash: 0, phases: 0 },
  { key: 'Alarms',      lines: 0.55, alarms: 1.0,  forecast: 0, context: 0, life: 0.35, dash: 0, phases: 0 },
  { key: 'Predictions', lines: 0.7,  alarms: 0.12, forecast: 1, context: 0, life: 0.35, dash: 0, phases: 0 },
  { key: 'Lifecycle',   lines: 0.55, alarms: 0.2,  forecast: 0, context: 0, life: 1.0,  dash: 0, phases: 1 },
  { key: 'Context',     lines: 0.5,  alarms: 0.1,  forecast: 0, context: 1, life: 0.55, dash: 0, phases: 0 },
  { key: 'Dashboards',  lines: 0.4,  alarms: 0.1,  forecast: 0, context: 0, life: 0.3,  dash: 1, phases: 0 },
];
const VIEW_DWELL = 4.2; // s a view holds after morphing in
const VIEW_MORPH = 1.0; // s to morph between views
const vstate = { cur: 0, prev: 0, since: 0 };
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const KEYS = ['lines', 'alarms', 'forecast', 'context', 'life', 'dash', 'phases'];

function viewAlphas(dt) {
  if (REDUCE) {
    const v = VIEWS[0];
    return { lines: v.lines, alarms: v.alarms, forecast: 0, context: 0, life: v.life, dash: 0, phases: 0,
             label: v.key, prevLabel: v.key, blend: 1 };
  }
  vstate.since += dt;
  if (vstate.since >= VIEW_DWELL + VIEW_MORPH) {
    vstate.prev = vstate.cur;
    vstate.cur = (vstate.cur + 1) % VIEWS.length;
    vstate.since = 0;
  }
  const blend = vstate.since <= VIEW_MORPH ? easeInOut(vstate.since / VIEW_MORPH) : 1;
  const A = VIEWS[vstate.prev], B = VIEWS[vstate.cur], out = {};
  KEYS.forEach((k) => { out[k] = A[k] + (B[k] - A[k]) * blend; });
  out.label = B.key; out.prevLabel = A.key; out.blend = blend;
  return out;
}

// Caption naming the active view (crosses cleanly through the midpoint).
function drawViewCaption(cx, cy, cw, A) {
  const x = cx + cw * 0.12, y = cy - 10;
  const cf = centerFactor(x, y);
  if (cf <= 0.02) return;
  ctx.font = '500 11px "GT America Extended", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = `rgba(${C_GREY}, ${0.5 * cf})`;
  ctx.fillText('VIEW', x, y);
  const px = x + ctx.measureText('VIEW').width + 12;
  const showPrev = A.blend < 0.5;
  const lbl = (showPrev ? A.prevLabel : A.label).toUpperCase();
  const la = showPrev ? 1 - A.blend * 2 : A.blend * 2 - 1;
  ctx.fillStyle = `rgba(${C_PRIMARY}, ${Math.max(0, la) * cf})`;
  ctx.fillText(lbl, px, y);
  ctx.letterSpacing = '0px';
}

// Predictions lens — a "now" boundary with dashed projections + confidence fans.
function drawForecast(cx, cy, cw, ch, fc) {
  const nx = cx + cw * 0.72, xr = cx + cw;
  ctx.fillStyle = `rgba(${C_PRIMARY}, 0.05)`;
  ctx.fillRect(nx, cy, xr - nx, ch);
  ctx.strokeStyle = `rgba(${C_GREY}, 0.45)`;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(nx, cy); ctx.lineTo(nx, cy + ch); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '400 9px "GT America Extended", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillStyle = `rgba(${C_GREY}, 0.8)`;
  ctx.fillText('NOW', nx + 6, cy + 12);
  ctx.fillStyle = `rgba(${C_PRIMARY}, 0.8)`;
  ctx.fillText('FORECAST', nx + 6, cy + ch - 8);
  ctx.letterSpacing = '0px';
  const spread = (xr - nx) * 0.16;
  for (const s of fc) {
    const yEnd = clamp(s.y + s.slope * (xr - nx), cy, cy + ch);
    ctx.fillStyle = `rgba(${s.col}, 0.10)`;
    ctx.beginPath();
    ctx.moveTo(nx, s.y);
    ctx.lineTo(xr, yEnd - spread);
    ctx.lineTo(xr, yEnd + spread);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${s.col}, 0.85)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(nx, s.y); ctx.lineTo(xr, yEnd); ctx.stroke();
    ctx.setLineDash([]);
  }
}

// Dashboards lens — small widget cards "generated" from the live signals:
// a radial gauge, a KPI number, a sparkline. Animated connectors stream from
// the waveform into each card. Placed in the lower band, faded near the calm
// center so the hero text stays clean. Generic metrics only.
const DASH_LABELS = ['INDEX', 'UPTIME', 'TREND'];
function drawDashboards(cx, cy, cw, ch, t, seriesPts) {
  if (seriesPts.length < 3) return;
  const cardW = 158, cardH = 88, cardY = H * 0.72, baseY = cy + ch;
  [0.2, 0.5, 0.8].forEach((fx, idx) => {
    const cxC = cx + cw * fx, x = cxC - cardW / 2, y = cardY;
    const a = centerFactor(cxC, y + cardH / 2);
    if (a <= 0.04) return;
    const val = seriesPts[idx].pts[seriesPts[idx].pts.length - 1].val; // 0..1

    // Connector: data streaming from the waveform up into the card.
    ctx.strokeStyle = `rgba(${C_PRIMARY}, ${0.22 * a})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -t * 26;
    ctx.beginPath();
    ctx.moveTo(cxC, baseY);
    ctx.lineTo(cxC, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Card frame (light glass).
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 12);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${C_PRIMARY}, ${0.18 * a})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '400 8px "GT America Extended", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(${C_GREY}, ${0.7 * a})`;
    ctx.fillText(DASH_LABELS[idx], x + 12, y + 11);
    ctx.letterSpacing = '0px';

    if (idx === 0) {
      // Radial gauge.
      const gx = x + cardW / 2, gy = y + cardH * 0.62, r = 23;
      const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(${C_GREY}, ${0.22 * a})`;
      ctx.beginPath(); ctx.arc(gx, gy, r, a0, a1); ctx.stroke();
      ctx.strokeStyle = `rgba(${C_PRIMARY}, ${0.9 * a})`;
      ctx.beginPath(); ctx.arc(gx, gy, r, a0, a0 + (a1 - a0) * val); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.font = '500 15px "GT America Extended", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${C_PRIMARY}, ${a})`;
      ctx.fillText(Math.round(val * 100), gx, gy + 1);
    } else if (idx === 1) {
      // KPI number + tiny bars.
      ctx.font = '500 30px "GT America Extended", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = `rgba(${C_PRIMARY}, ${a})`;
      ctx.fillText(Math.round(val * 100) + '%', x + 12, y + cardH - 16);
      const pts = seriesPts[idx].pts, n = 7, bw = 7;
      for (let k = 0; k < n; k++) {
        const v = pts[pts.length - n + k].val;
        const bh = 4 + v * 26, bx = x + cardW - 14 - (n - k) * (bw + 3);
        ctx.fillStyle = `rgba(${C_SECONDARY}, ${0.55 * a})`;
        ctx.fillRect(bx, y + cardH - 14 - bh, bw, bh);
      }
    } else {
      // Sparkline.
      const pts = seriesPts[idx].pts, n = Math.min(24, pts.length);
      const px0 = x + 12, pw = cardW - 24, py = y + cardH - 14, ph = 42;
      ctx.strokeStyle = `rgba(${C_SECONDARY}, ${0.9 * a})`;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const v = pts[pts.length - n + k].val;
        const X = px0 + pw * (k / (n - 1)), Y = py - v * ph;
        k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    }
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Context lens — translucent stacked areas under each series, reading as
// aggregated operational context (illustrative only; discloses nothing).
function drawContext(cx, cy, cw, ch, seriesPts) {
  for (const sp of seriesPts) {
    const pts = sp.pts;
    ctx.beginPath();
    ctx.moveTo(cx + pts[0].x, cy + ch);
    for (const p of pts) ctx.lineTo(cx + p.x, cy + ch - p.val * ch);
    ctx.lineTo(cx + pts[pts.length - 1].x, cy + ch);
    ctx.closePath();
    ctx.fillStyle = `rgba(${sp.col}, 0.07)`;
    ctx.fill();
  }
}

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

// Abstract asset-lifecycle ribbon beneath the chart: generic phase nodes with a
// slow highlight sweep, so the threshold incidents above read as events across a
// lifecycle. Purely illustrative; discloses nothing proprietary.
const PHASES = ['Commissioning', 'Ramp-up', 'Operation', 'Service', 'End-of-life'];
const C_LIFE = '116, 107, 125'; // --brand-grey-600
function drawLifecycle(cx, cy, cw, ch, t) {
  const yL = cy + ch + 30;
  const x0 = cx + cw * 0.12, x1 = cx + cw * 0.88;
  const cf = centerFactor((x0 + x1) / 2, yL);
  if (cf <= 0.02) return;

  ctx.strokeStyle = `rgba(${C_LIFE}, ${0.16 * cf})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, yL);
  ctx.lineTo(x1, yL);
  ctx.stroke();

  const n = PHASES.length;
  const sweep = (t * 0.07) % 1; // slow highlight travelling across the lifecycle
  for (let i = 0; i < n; i++) {
    const fx = i / (n - 1);
    const x = x0 + (x1 - x0) * fx;
    const active = Math.abs(fx - sweep) < 0.1;
    if (active) {
      const g = ctx.createRadialGradient(x, yL, 0, x, yL, 16);
      g.addColorStop(0, `rgba(${C_PRIMARY}, ${0.5 * cf})`);
      g.addColorStop(1, `rgba(${C_PRIMARY}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, yL, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, yL, active ? 4 : 2.4, 0, Math.PI * 2);
    ctx.fillStyle = active ? `rgba(${C_PRIMARY}, ${0.95 * cf})` : `rgba(${C_LIFE}, ${0.42 * cf})`;
    ctx.fill();

    ctx.font = '400 9px "GT America Extended", sans-serif';
    ctx.letterSpacing = '1.2px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(${C_LIFE}, ${(active ? 0.8 : 0.4) * cf})`;
    ctx.fillText(PHASES[i].toUpperCase(), x, yL + 11);
  }
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

// Lifecycle view — the dynamic layer: phase dividers across the chart plus a
// progress front that travels Commissioning → End-of-life, with a trailing
// "current phase" column and a glowing head riding the baseline.
function drawLifecyclePhases(cx, cy, cw, ch, t) {
  const x0 = cx + cw * 0.12, x1 = cx + cw * 0.88, span = x1 - x0;
  const n = PHASES.length;

  for (let i = 0; i < n; i++) {
    const x = x0 + span * (i / (n - 1));
    const cf = centerFactor(x, cy + ch / 2);
    if (cf <= 0.02) continue;
    ctx.strokeStyle = `rgba(${C_GREY}, ${0.12 * cf})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x, cy + ch);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Progress front travelling through the lifecycle (loops).
  const cyc = 13;
  const prog = (t % cyc) / cyc;
  const px = x0 + span * prog;
  const segW = span / (n - 1);
  const cfP = centerFactor(px, cy + ch / 2);

  // Trailing "current phase" column.
  const colX = px - segW * 0.5;
  const grad = ctx.createLinearGradient(colX, 0, colX + segW, 0);
  grad.addColorStop(0, `rgba(${C_PRIMARY}, 0)`);
  grad.addColorStop(0.5, `rgba(${C_PRIMARY}, ${0.1 * cfP})`);
  grad.addColorStop(1, `rgba(${C_PRIMARY}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(colX, cy, segW, ch);

  // Progress line + glowing head on the baseline.
  ctx.strokeStyle = `rgba(${C_PRIMARY}, ${0.5 * cfP})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, cy);
  ctx.lineTo(px, cy + ch);
  ctx.stroke();
  const hy = cy + ch;
  const g = ctx.createRadialGradient(px, hy, 0, px, hy, 13);
  g.addColorStop(0, `rgba(${C_PRIMARY}, ${0.85 * cfP})`);
  g.addColorStop(1, `rgba(${C_PRIMARY}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, hy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, hy, 3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${C_PRIMARY}, ${cfP})`;
  ctx.fill();
}

function drawChart(dt, t) {
  const cw = W, ch = H * 0.46;
  const cx = (W - cw) / 2, cy = (H - ch) / 2 + H * 0.16;

  const A = viewAlphas(dt);

  // Baseline grid (always faint).
  ctx.strokeStyle = `rgba(${C_PRIMARY}, 0.05)`;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = cy + (ch * i) / 4;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();
  }

  // Threshold bands — emphasised in the Alarms view.
  ctx.save();
  ctx.globalAlpha = 0.45 + 0.55 * A.alarms;
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
  ctx.restore();

  // Advance + draw the signal lines (emphasis = A.lines). Capture geometry for
  // the Context (stacked areas) and Predictions (projection) views.
  const alerts = [], seriesPts = [], fc = [], fx = cw * 0.72;
  for (let i = 0; i < chart.s.length; i++) {
    chart.p[i] += dt * chart.spd[i];
    while (chart.p[i] >= 1) {
      chart.p[i] -= 1;
      chart.s[i].shift();
      chart.s[i].push(nextVal(chart.s[i], 0.13));
    }
    const pts = scrollPoints(chart.s[i], chart.p[i], cw);
    if (pts.length < 2) continue;
    seriesPts.push({ col: CHART_COLS[i], pts });

    ctx.save();
    ctx.globalAlpha = A.lines;
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
    ctx.beginPath();
    ctx.arc(cx + last.x, cy + ch - last.val * ch, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${CHART_COLS[i]}, 1)`;
    ctx.fill();
    ctx.restore();

    // Sample value + slope at the forecast boundary for the Predictions view.
    for (let k = 1; k < pts.length; k++) {
      if (pts[k - 1].x <= fx && pts[k].x >= fx) {
        const tt = (fx - pts[k - 1].x) / (pts[k].x - pts[k - 1].x);
        const v = pts[k - 1].val + (pts[k].val - pts[k - 1].val) * tt;
        const slopeVal = (pts[k].val - pts[k - 1].val) / (pts[k].x - pts[k - 1].x);
        fc.push({ col: CHART_COLS[i], y: cy + ch - v * ch, slope: -slopeVal * ch });
        break;
      }
    }

    collectRuns(pts, cx, cy, ch, 'hi', alerts);
    collectRuns(pts, cx, cy, ch, 'lo', alerts);
  }

  // Context view — stacked translucent aggregation areas.
  if (A.context > 0.01) {
    ctx.save();
    ctx.globalAlpha = A.context;
    drawContext(cx, cy, cw, ch, seriesPts);
    ctx.restore();
  }

  // Predictions view — projection + confidence fans.
  if (A.forecast > 0.01 && fc.length) {
    ctx.save();
    ctx.globalAlpha = A.forecast;
    drawForecast(cx, cy, cw, ch, fc);
    ctx.restore();
  }

  // Dashboards view — widget cards generated from the live signals.
  if (A.dash > 0.01) {
    ctx.save();
    ctx.globalAlpha = A.dash;
    drawDashboards(cx, cy, cw, ch, t, seriesPts);
    ctx.restore();
  }

  // Alarms — incident markers (emphasis = A.alarms; keep faintly present always).
  alerts.sort((a, b) => a.x - b.x);
  const shown = [];
  for (const a of alerts) {
    if (shown.length && a.x - shown[shown.length - 1].x < ALERT_MIN_GAP) continue;
    shown.push(a);
    if (shown.length >= MAX_ALERTS) break;
  }
  ctx.save();
  ctx.globalAlpha = Math.max(0.12, A.alarms);
  const alertPulse = 0.7 + Math.sin(t * 6) * 0.3;
  for (const a of shown) drawAlert(a, alertPulse);
  ctx.restore();

  // Lifecycle ribbon (emphasis = A.life).
  ctx.save();
  ctx.globalAlpha = A.life;
  drawLifecycle(cx, cy, cw, ch, t);
  ctx.restore();

  // Lifecycle view — dynamic phase progression across the chart.
  if (A.phases > 0.01) {
    ctx.save();
    ctx.globalAlpha = A.phases;
    drawLifecyclePhases(cx, cy, cw, ch, t);
    ctx.restore();
  }

  drawViewCaption(cx, cy, cw, A);
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

  if (!REDUCE) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
