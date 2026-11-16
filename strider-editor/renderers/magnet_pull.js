const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
  ctx.closePath();
}

// "Postagem de atrair pessoas": um post de feed aparece no centro e, na palavra "atrair",
// pessoas voam das bordas da tela para dentro dele (com rastro); o coração pulsa a cada chegada.
function magnetPull(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const cx = W / 2, cy = H * (seg.y || 0.58), cs = 360;
  const env = U.popIn(local, dur, dur, { from: 0.6, inDur: 0.3 });
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 330, H * 0.92, 0.55);

  // pessoas voando para o post
  const rnd = F.prng(42);
  const people = Array.from({ length: 12 }, (_, i) => {
    const side = i % 4;
    const a = rnd();
    const from = side === 0 ? [-80, H * (0.45 + a * 0.4)] : side === 1 ? [W + 80, H * (0.45 + a * 0.4)]
      : side === 2 ? [W * a, H + 80] : [W * (0.1 + a * 0.8), H * 0.43];
    return { from, delay: i * 0.13 + rnd() * 0.08 };
  });
  let arrived = 0;
  const pt = t - seg.pullAtOut;
  if (pt > 0) {
    people.forEach(p => {
      const k = (pt - p.delay) / 0.55;
      if (k <= 0) return;
      if (k >= 1) { arrived++; return; }
      const e = k * k * k; // acelera como ímã
      const pos = s => [U.lerp(p.from[0], cx, s), U.lerp(p.from[1], cy, s)];
      ctx.strokeStyle = 'rgba(245,160,32,0.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const a = pos(Math.max(0, e - 0.18)), b = pos(e);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      const r = U.lerp(40, 14, e);
      ctx.fillStyle = 'rgba(12,12,12,0.85)'; ctx.beginPath(); ctx.arc(b[0], b[1], r * 1.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = U.COLORS.white; X.person(ctx, b[0], b[1] + r * 0.15, r * 0.8, true);
    });
  }

  // post
  const lastArrive = people.map(p => seg.pullAtOut + p.delay + 0.55).filter(a => a <= t).pop();
  const bump = lastArrive ? 1 + 0.06 * Math.max(0, 1 - (t - lastArrive) / 0.15) : 1;
  U.withTransform(ctx, cx, cy, env.scale * bump, env.alpha * fade, () => {
    const x = cx - cs / 2, y = cy - cs / 2 - 40;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#161616'; U.roundRect(ctx, x, y, cs, cs + 80, 26); ctx.fill(); ctx.restore();
    ctx.fillStyle = U.COLORS.orange; ctx.beginPath(); ctx.arc(x + 40, y + 36, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555'; U.roundRect(ctx, x + 70, y + 28, 150, 16, 8); ctx.fill();
    const g = ctx.createLinearGradient(x, y + 70, x + cs, y + cs);
    g.addColorStop(0, '#F5A020'); g.addColorStop(1, '#C8641A');
    ctx.fillStyle = g; ctx.fillRect(x + 16, y + 70, cs - 32, cs - 60);
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; heart(ctx, cx, y + 70 + (cs - 60) / 2 + 20, 90 * bump); ctx.fill();
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 5;
    heart(ctx, x + 44, y + cs + 40, 20); ctx.stroke();
    ctx.font = U.font(800, 30); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`+${arrived}`, x + 76, y + cs + 36);
    ctx.textBaseline = 'alphabetic';
  });
  // rótulo de cima
  const tk = U.easeOutCubic((local - 0.2) / 0.3);
  ctx.globalAlpha = fade * tk;
  ctx.font = U.font(800, 46); ctx.fillStyle = U.COLORS.white;
  U.fillSpaced(ctx, seg.top, cx, cy - cs / 2 - 80 + (1 - tk) * 30, 10);
  ctx.globalAlpha = fade;

  if (pt >= 0) {
    const s = U.slam(pt, 0.15, 1.6);
    const size = U.fitFont(ctx, seg.big, 900, 150, W * 0.92, true);
    U.withTransform(ctx, cx, cy + cs / 2 + 150, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, cx, cy + cs / 2 + 110 + size * 0.7, U.font(900, size, true), U.COLORS.orange, 13);
    });
  }
  if (seg.chipAtOut != null && t >= seg.chipAtOut) {
    const k = U.easeOutBack((t - seg.chipAtOut) / 0.3);
    ctx.save(); ctx.translate(cx, H * 0.875); ctx.scale(k, k);
    X.chip(ctx, seg.chip, 0, 0, 46, U.COLORS.white, '#111', 36);
    ctx.restore();
  }
  ctx.restore();
}
magnetPull.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'whoosh', t: s.pullAtOut - 0.05, gain: 0.8 },
  { type: 'boom', t: s.pullAtOut + 0.02, gain: 0.8 }, ...(s.chipAtOut != null ? [{ type: 'tick', t: s.chipAtOut, gain: 2.5 }] : [])];
module.exports = magnetPull;
