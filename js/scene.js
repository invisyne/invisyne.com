// Live-dashboard background: chart panels floating in 3D, animating like real-time
// data analysis. Pure 2D canvas with a hand-rolled perspective projection.
// Continuous (sub-pixel) scrolling keeps the motion smooth; panels tilt and drift
// for depth. Faded toward the center so the logo stays crisp.

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

const C_PRIMARY = '37, 73, 255';    // #2549FF
const C_SECONDARY = '191, 77, 243'; // #BF4DF3
const C_INK = '25, 26, 32';         // #191A20

const CAM = 1500;   // camera distance
const FOCAL = 1500; // z = 0 plane renders 1:1
const LIFT = 26;    // how far data floats above its panel (world units)

let W = 0, H = 0;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// — 3D helpers —
function rot(v, yaw, pitch) {
  let { x, y, z } = v;
  const cx = Math.cos(yaw), sx = Math.sin(yaw);
  let x1 = x * cx + z * sx;
  let z1 = -x * sx + z * cx;
  const cb = Math.cos(pitch), sb = Math.sin(pitch);
  let y1 = y * cb - z1 * sb;
  let z2 = y * sb + z1 * cb;
  return { x: x1, y: y1, z: z2 };
}
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

function project(p) {
  const zc = Math.max(p.z + CAM, 1);
  const s = FOCAL / zc;
  return { x: W / 2 + p.x * s, y: H / 2 + p.y * s, s };
}

// Build a projector for one panel: local (u,v in px, lift l) -> screen point.
function makeProjector(panel) {
  const right = rot({ x: 1, y: 0, z: 0 }, panel.yaw, panel.pitch);
  const up = rot({ x: 0, y: 1, z: 0 }, panel.yaw, panel.pitch);
  const n = cross(right, up);
  const C = panel.center;
  return (u, v, l = 0) => {
    const rx = u - panel.w / 2;
    const ry = v - panel.h / 2;
    return project({
      x: C.x + right.x * rx + up.x * ry - n.x * l,
      y: C.y + right.y * rx + up.y * ry - n.y * l,
      z: C.z + right.z * rx + up.z * ry - n.z * l,
    });
  };
}

// — Smooth data sources —
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

// — Drawing primitives (all in panel-local space, projected via P) —
function gridlines(P, w, h, rows = 3) {
  ctx.strokeStyle = `rgba(${C_INK}, 0.05)`;
  ctx.lineWidth = 1;
  for (let i = 1; i < rows; i++) {
    const y = (h * i) / rows;
    const a = P(0, y), b = P(w, y);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function lineFromPoints(P, pts, w, h, color, { fill = false, lift = LIFT } = {}) {
  if (pts.length < 2) return;
  const sp = pts.map(p => P(p.x, h - p.val * h, lift));
  if (fill) {
    const base0 = P(pts[0].x, h, 0);
    const baseN = P(pts[pts.length - 1].x, h, 0);
    ctx.beginPath();
    ctx.moveTo(base0.x, base0.y);
    for (const s of sp) ctx.lineTo(s.x, s.y);
    ctx.lineTo(baseN.x, baseN.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(${color}, 0.18)`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(sp[0].x, sp[0].y);
  for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y);
  ctx.strokeStyle = `rgba(${color}, 0.9)`;
  ctx.lineWidth = clamp(1.6 * sp[sp.length - 1].s, 0.8, 2.6);
  ctx.lineJoin = 'round';
  ctx.stroke();
  const tip = sp[sp.length - 1];
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, clamp(2.6 * tip.s, 1.4, 3.4), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${color}, 1)`;
  ctx.fill();
}

// — Chart factories: each returns { update, draw } —
function lineChart() {
  const N = 60;
  const s1 = walk(N), s2 = walk(N, 0.4);
  let p1 = 0, p2 = 0;
  return {
    update(dt) {
      p1 += dt * 7;
      while (p1 >= 1) { p1 -= 1; s1.shift(); s1.push(nextVal(s1)); }
      p2 += dt * 7;
      while (p2 >= 1) { p2 -= 1; s2.shift(); s2.push(nextVal(s2)); }
    },
    draw(P, w, h) {
      gridlines(P, w, h);
      lineFromPoints(P, scrollPoints(s2, p2, w), w, h, C_SECONDARY, { lift: LIFT * 0.5 });
      lineFromPoints(P, scrollPoints(s1, p1, w), w, h, C_PRIMARY);
    },
  };
}

function areaChart() {
  const N = 68;
  const s = walk(N, 0.5, 0.11);
  let p = 0;
  return {
    update(dt) {
      p += dt * 8;
      while (p >= 1) { p -= 1; s.shift(); s.push(nextVal(s, 0.11)); }
    },
    draw(P, w, h) {
      gridlines(P, w, h);
      lineFromPoints(P, scrollPoints(s, p, w), w, h, C_PRIMARY, { fill: true });
    },
  };
}

function barChart() {
  const N = 14;
  const bars = walk(N, 0.5, 0.4);
  const targets = bars.slice();
  let acc = 0;
  return {
    update(dt) {
      acc += dt;
      if (acc > 0.45) {
        acc = 0;
        targets[(Math.random() * N) | 0] = clamp(0.12 + Math.random() * 0.8, 0.12, 0.92);
      }
      for (let i = 0; i < N; i++) bars[i] += (targets[i] - bars[i]) * Math.min(dt * 4, 1);
    },
    draw(P, w, h) {
      const gap = w * 0.012;
      const bw = (w - gap * (N - 1)) / N;
      for (let i = 0; i < N; i++) {
        const x = i * (bw + gap);
        const topY = h - bars[i] * h;
        const color = i % 3 === 0 ? C_SECONDARY : C_PRIMARY;
        // extruded bar: top face plus a front face lifted toward the viewer for 3D
        const fb = [P(x, h, LIFT), P(x + bw, h, LIFT), P(x + bw, topY, LIFT), P(x, topY, LIFT)];
        const tb = [P(x, topY, 0), P(x + bw, topY, 0), P(x + bw, topY, LIFT), P(x, topY, LIFT)];
        ctx.fillStyle = `rgba(${color}, 0.30)`;
        poly(tb);
        ctx.fillStyle = `rgba(${color}, 0.72)`;
        poly(fb);
      }
    },
  };
}

function poly(p) {
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
  ctx.closePath();
  ctx.fill();
}

function scatterChart() {
  const N = 26;
  const pts = Array.from({ length: N }, () => ({
    x: Math.random(),
    y: Math.random(),
    ph: Math.random() * Math.PI * 2,
    sp: 0.4 + Math.random() * 0.6,
  }));
  return {
    update() {},
    draw(P, w, h, t) {
      const slope = 0.55 + Math.sin(t * 0.3) * 0.12;
      const b = 0.22 + Math.cos(t * 0.22) * 0.06;
      const a1 = P(0, h - b * h, LIFT);
      const a2 = P(w, h - (b + slope) * h, LIFT);
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.strokeStyle = `rgba(${C_SECONDARY}, 0.45)`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
      for (const pt of pts) {
        const ox = Math.sin(t * pt.sp + pt.ph) * 0.02;
        const oy = Math.cos(t * pt.sp * 0.8 + pt.ph) * 0.02;
        const sc = P(clamp(pt.x + ox, 0, 1) * w, (1 - clamp(pt.y + oy, 0, 1)) * h, LIFT);
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, clamp(2.4 * sc.s, 1.3, 3.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${C_PRIMARY}, 0.72)`;
        ctx.fill();
      }
    },
  };
}

// — Layout: one chart per quadrant, each ~25% of the page, tilted to face center —
const defs = [
  { obj: lineChart(),    fx: 0.26, fy: 0.27, fw: 0.46, fh: 0.42, yaw: 0.30,  pitch: -0.09, cz: 40 },
  { obj: scatterChart(), fx: 0.74, fy: 0.27, fw: 0.46, fh: 0.42, yaw: -0.30, pitch: -0.09, cz: 40 },
  { obj: barChart(),     fx: 0.26, fy: 0.73, fw: 0.46, fh: 0.42, yaw: 0.30,  pitch: 0.09,  cz: 40 },
  { obj: areaChart(),    fx: 0.74, fy: 0.73, fw: 0.46, fh: 0.42, yaw: -0.30, pitch: 0.09,  cz: 40 },
];

function panelOf(d, t) {
  const w = d.fw * W, h = d.fh * H;
  const drift = Math.sin(t * 0.4 + d.fx * 7) * 0.06;
  const bob = Math.cos(t * 0.5 + d.fy * 5) * 0.04;
  return {
    w, h,
    yaw: d.yaw + drift,
    pitch: d.pitch + bob,
    center: { x: (d.fx - 0.5) * W, y: (d.fy - 0.5) * H, z: d.cz },
  };
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
}
resize();
addEventListener('resize', resize);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  ctx.clearRect(0, 0, W, H);

  for (const d of defs) {
    d.obj.update(dt);
    const panel = panelOf(d, t);
    const P = makeProjector(panel);
    d.obj.draw(P, panel.w, panel.h, t);
  }

  // Radial white wash keeps the centered logo clean.
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.42);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  g.addColorStop(0.45, 'rgba(255, 255, 255, 0.55)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
