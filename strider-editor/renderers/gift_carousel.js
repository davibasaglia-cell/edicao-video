const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Carrossel 3D de ideias: cada item novo entra no anel e gira para a frente quando é falado.
function giftCarousel(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.15, 0.15);
  const items = seg.items;
  const cy = H * (seg.y || 0.55), R = W * 0.36, step = 0.95;
  // foco = índice do último item falado, interpolado
  let focus = 0;
  items.forEach((it, i) => { if (t >= it.atOut && i > 0) focus = U.lerp(i - 1, i, U.easeInOutCubic((t - it.atOut) / 0.35)); });
  ctx.save();
  ctx.globalAlpha = env;
  const g = ctx.createLinearGradient(0, cy - 420, 0, cy + 360);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(0,0,0,0.55)'); g.addColorStop(0.8, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, cy - 420, W, 780);
  // título
  if (seg.title) {
    ctx.font = U.font(800, 44); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 8;
    U.fillSpaced(ctx, seg.title, W / 2, cy - 330, 8, true);
  }
  // elipse do chão
  ctx.strokeStyle = 'rgba(245,160,32,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(W / 2, cy + 190, R + 60, 60, 0, 0, Math.PI * 2); ctx.stroke();
  const draw = items.map((it, i) => ({ it, i, a: (i - focus) * step })).filter(d => t >= d.it.atOut && Math.abs(d.a) < Math.PI * 0.75);
  draw.sort((p, q) => Math.cos(p.a) - Math.cos(q.a));
  draw.forEach(({ it, i, a }) => {
    const pop = U.easeOutBack((t - it.atOut) / 0.3);
    const depth = (Math.cos(a) + 1) / 2;
    const x = W / 2 + Math.sin(a) * R, y = cy + 20 - depth * 30;
    const s = U.lerp(0.5, 1, depth) * pop;
    const front = Math.abs(a) < 0.25;
    ctx.save();
    ctx.globalAlpha = env * U.lerp(0.35, 1, depth) * U.clamp((t - it.atOut) / 0.12);
    ctx.translate(x, y); ctx.scale(s, s);
    const bw = 300, bh = 300;
    ctx.shadowColor = front ? 'rgba(245,160,32,0.55)' : 'rgba(0,0,0,0.5)'; ctx.shadowBlur = front ? 40 : 20;
    ctx.fillStyle = 'rgba(18,18,18,0.92)'; U.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 36); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = front ? U.COLORS.orange : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 6; ctx.stroke();
    F.drawIcon(ctx, it.icon, 0, -20, 2.0, front ? U.COLORS.orange : U.COLORS.white, 8);
    ctx.font = U.font(800, U.fitFont(ctx, it.text, 800, 40, bw - 30)); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = U.COLORS.white; ctx.fillText(it.text, 0, bh / 2 - 34);
    ctx.restore();
  });
  ctx.restore();
}
giftCarousel.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.6 }, ...s.items.slice(1).map(it => ({ type: 'whoosh', t: it.atOut - 0.04, gain: 0.45 })),
  ...s.items.map(it => ({ type: 'tick', t: it.atOut + 0.3, gain: 2 }))];
module.exports = giftCarousel;
