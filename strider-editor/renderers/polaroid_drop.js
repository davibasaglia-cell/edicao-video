const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Polaroids caem na mesa, girando, um por item falado; no fim um check laranja é traçado em cada um.
function polaroidDrop(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  const items = seg.items, n = items.length;
  const pw = 300, ph = 370, cy = H * (seg.y || 0.53);
  const rots = [-0.1, 0.06, -0.04, 0.09];
  const spread = W * 0.3;
  ctx.save();
  ctx.globalAlpha = env;
  items.forEach((it, i) => {
    if (t < it.atOut) return;
    const k = U.clamp((t - it.atOut) / 0.35);
    const e = U.easeOutBack(k);
    const cx = W / 2 + (i - (n - 1) / 2) * spread;
    const yy = cy + (i % 2 ? 40 : -20) - (1 - e) * 700;
    const rot = rots[i % 4] + (1 - e) * (i % 2 ? 1.2 : -1.2);
    const sc = U.lerp(1.5, 1, U.easeOutCubic(k));
    ctx.save();
    ctx.globalAlpha = env * U.clamp(k * 3);
    ctx.translate(cx, yy); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#F4F4F1'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1C1C1C'; ctx.fillRect(-pw / 2 + 20, -ph / 2 + 20, pw - 40, pw - 40);
    F.drawIcon(ctx, it.icon, 0, -ph / 2 + 20 + (pw - 40) / 2, 1.9, U.COLORS.white, 7);
    ctx.font = U.font(800, U.fitFont(ctx, it.text, 800, 44, pw - 40)); ctx.fillStyle = '#151515'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(it.text, 0, ph / 2 - 34);
    // check
    if (seg.checkAtOut != null && t >= seg.checkAtOut + i * 0.12) {
      const ck = U.easeOutCubic((t - seg.checkAtOut - i * 0.12) / 0.2);
      ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      F.partialPolyline(ctx, [[pw / 2 - 120, -ph / 2 + 10], [pw / 2 - 80, -ph / 2 + 50], [pw / 2 + 10, -ph / 2 - 50]], ck); ctx.stroke();
    }
    ctx.restore();
  });
  if (seg.title) {
    const s = U.slam(t - seg.outStart, 0.15, 1.3);
    U.withTransform(ctx, W / 2, cy - 330, s.scale, s.alpha * env, () => {
      ctx.font = U.font(800, 50); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = U.COLORS.white;
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 8;
      U.fillSpaced(ctx, seg.title, W / 2, cy - 320, 7, true);
    });
  }
  ctx.restore();
}
polaroidDrop.sfx = s => [...s.items.map(it => ({ type: 'whoosh', t: it.atOut - 0.08, gain: 0.5 })), ...s.items.map(it => ({ type: 'tick', t: it.atOut + 0.3, gain: 2.2 })),
  ...(s.checkAtOut != null ? [{ type: 'chime', t: s.checkAtOut, gain: 0.6 }] : [])];
module.exports = polaroidDrop;
