// Helpers extras para os motions novos: texto alinhado à esquerda com espaçamento,
// PRNG determinístico, polilinha parcial (traço sendo desenhado), glitch e ícones de linha.
const { createCanvas } = require('canvas');
const U = require('./canvas_utils');

function prng(seed) {
  let x = (seed * 2654435761) >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}

function spacedWidth(ctx, text, spacing) {
  return [...text].reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * Math.max(0, [...text].length - 1);
}

function fillSpacedLeft(ctx, text, x, y, spacing) {
  ctx.textAlign = 'left';
  for (const c of text) { ctx.fillText(c, x, y); x += ctx.measureText(c).width + spacing; }
}

// Desenha só a fração k (0..1) de uma polilinha, medida pelo comprimento.
function partialPolyline(ctx, pts, k, closed = false) {
  const P = closed ? [...pts, pts[0]] : pts;
  const seg = [];
  let total = 0;
  for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); total += l; }
  let left = U.clamp(k) * total;
  ctx.beginPath();
  ctx.moveTo(P[0][0], P[0][1]);
  let head = P[0];
  for (let i = 1; i < P.length && left > 0; i++) {
    const f = Math.min(1, left / seg[i - 1]);
    head = [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f];
    ctx.lineTo(head[0], head[1]);
    left -= seg[i - 1];
  }
  return head;
}

// Texto com glitch: separação RGB + fatias deslocadas. intensity 0..1, seed muda a cada frame.
function glitchText(ctx, text, cx, baseline, fontStr, color, intensity, seed) {
  if (intensity <= 0.001) {
    ctx.font = fontStr; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, cx, baseline);
    return;
  }
  ctx.font = fontStr;
  const m = ctx.measureText(text);
  const w = Math.ceil(m.width + 200), h = Math.ceil((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 120);
  const off = createCanvas(w, h), o = off.getContext('2d');
  const by = h - 60 - m.actualBoundingBoxDescent;
  o.font = fontStr; o.textAlign = 'center';
  const dx = 14 * intensity;
  o.globalCompositeOperation = 'lighter';
  o.fillStyle = 'rgba(255,0,60,0.9)'; o.fillText(text, w / 2 - dx, by);
  o.fillStyle = 'rgba(0,220,255,0.9)'; o.fillText(text, w / 2 + dx, by);
  o.globalCompositeOperation = 'source-over';
  o.fillStyle = color; o.fillText(text, w / 2, by);
  const rnd = prng(seed);
  const slices = 9;
  const x0 = cx - w / 2, y0 = baseline - by;
  for (let i = 0; i < slices; i++) {
    const sy = Math.floor(i * h / slices), sh = Math.ceil(h / slices);
    const shift = rnd() < 0.5 * intensity + 0.15 ? (rnd() - 0.5) * 70 * intensity : 0;
    ctx.drawImage(off, 0, sy, w, sh, x0 + shift, y0 + sy, w, sh);
  }
}

// Ícones de linha (cabem num quadrado de ~80px centrado em cx,cy)
const ICONS = {
  people(ctx, cx, cy) {
    ctx.beginPath(); ctx.arc(cx - 16, cy - 14, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 18, cy - 10, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 16, cy + 30, 26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 18, cy + 30, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  },
  clinic(ctx, cx, cy) {
    ctx.beginPath(); ctx.moveTo(cx - 30, cy + 30); ctx.lineTo(cx - 30, cy - 8); ctx.lineTo(cx, cy - 30); ctx.lineTo(cx + 30, cy - 8); ctx.lineTo(cx + 30, cy + 30); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 18); ctx.moveTo(cx - 12, cy + 6); ctx.lineTo(cx + 12, cy + 6); ctx.stroke();
  },
  coffee(ctx, cx, cy) {
    U.roundRect(ctx, cx - 26, cy - 6, 40, 34, 8); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 18, cy + 9, 9, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 6 + i * 11, cy - 14);
      ctx.bezierCurveTo(cx + 2 + i * 11, cy - 22, cx - 12 + i * 11, cy - 28, cx - 4 + i * 11, cy - 36); ctx.stroke();
    }
  },
  eye(ctx, cx, cy) {
    ctx.beginPath(); ctx.moveTo(cx - 34, cy); ctx.quadraticCurveTo(cx, cy - 34, cx + 34, cy); ctx.quadraticCurveTo(cx, cy + 34, cx - 34, cy); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.stroke();
  },
  sparkle(ctx, cx, cy) {
    const star = (x, y, r) => {
      ctx.beginPath(); ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.stroke();
    };
    star(cx - 6, cy + 4, 28); star(cx + 24, cy - 22, 12);
  },
};

module.exports = { prng, spacedWidth, fillSpacedLeft, partialPolyline, glitchText, ICONS };
