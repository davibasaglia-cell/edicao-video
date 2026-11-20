const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Escada sendo traçada; uma bolinha pula de degrau em degrau no ritmo da fala; o topo acende laranja.
function stairsSteps(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.15, 0.15);
  const local = t - seg.outStart;
  const steps = seg.steps, n = steps.length;
  const x0 = W * 0.08, x1 = W * 0.92, base = H * (seg.y || 0.72), rise = 150;
  const sw = (x1 - x0) / (n + 0.6);
  ctx.save();
  ctx.globalAlpha = env;
  // fundo escuro suave
  const g = ctx.createLinearGradient(0, base - rise * n - 260, 0, base + 60);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, base - rise * n - 260, W, rise * n + 320);
  // contorno da escada
  const pts = [[x0, base]];
  for (let i = 0; i < n; i++) { const sx = x0 + sw * (i + 0.6); pts.push([sx, base - rise * i], [sx, base - rise * (i + 1)], [sx + sw, base - rise * (i + 1)]); }
  pts.push([x1, base - rise * n]);
  const dk = U.easeInOutCubic(local / 0.7);
  ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  F.partialPolyline(ctx, [[x0 - 20, base], ...pts.slice(1)], dk); ctx.stroke();
  // degraus preenchidos conforme atingidos
  steps.forEach((s, i) => {
    if (t < s.atOut) return;
    const k = U.easeOutCubic((t - s.atOut) / 0.25);
    const sx = x0 + sw * (i + 0.6), top = base - rise * (i + 1);
    const last = i === n - 1;
    ctx.save();
    ctx.globalAlpha = env * k * (last ? 0.95 : 0.35);
    ctx.fillStyle = last ? U.COLORS.orange : U.COLORS.white;
    ctx.fillRect(sx, top, (last ? x1 : sx + sw) - sx, rise * (i + 1) * k);
    ctx.restore();
    // rótulo
    const s2 = U.slam(t - s.atOut, 0.14, 1.4);
    const lx = last ? (sx + x1) / 2 : sx + sw / 2;
    U.withTransform(ctx, lx, top - 120, s2.scale, s2.alpha * env, () => {
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
      if (last) {
        const lines = s.label.split('\n');
        const size = Math.min(...lines.map(l => U.fitFont(ctx, l, 900, 84, W * 0.5, true)));
        ctx.font = U.font(900, size, true);
        lines.forEach((l, j) => F.strokeFill(ctx, l, Math.min(lx, W - W * 0.27), top - 150 + j * size * 0.95, U.COLORS.orange, 10));
      } else {
        ctx.font = U.font(800, U.fitFont(ctx, s.label, 800, 38, sw + 40));
        F.strokeFill(ctx, s.label, lx, top - 30, U.COLORS.white, 8);
      }
    });
  });
  // bolinha pulando
  let pos = [x0 + sw * 0.25, base], from = pos;
  const hit = steps.filter(s => t >= s.atOut).length;
  const target = i => { const sx = x0 + sw * (i + 0.6); return [i === n - 1 ? (sx + x1) / 2 : sx + sw * 0.5, base - rise * (i + 1)]; };
  if (hit > 0) {
    const i = hit - 1, s = steps[i];
    from = i === 0 ? [x0 + sw * 0.25, base] : target(i - 1);
    const to = target(i);
    const k = U.clamp((t - s.atOut) / 0.28);
    pos = [U.lerp(from[0], to[0], k), U.lerp(from[1], to[1], k) - Math.sin(Math.PI * k) * 120];
  }
  if (dk > 0.3) {
    ctx.fillStyle = U.COLORS.white; ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(pos[0], pos[1] - 28, 26, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
stairsSteps.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.6 },
  ...s.steps.map((st, i) => i === s.steps.length - 1 ? { type: 'boom', t: st.atOut + 0.25, gain: 0.8 } : { type: 'tick', t: st.atOut + 0.25, gain: 2.4 })];
module.exports = stairsSteps;
