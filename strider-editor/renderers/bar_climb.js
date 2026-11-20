const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Gráfico de barras subindo com a fala + seta de tendência traçada por cima.
function barClimb(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.15, 0.15);
  const local = t - seg.outStart;
  const cardW = W * 0.86, cardH = 680, x0 = (W - cardW) / 2, y0 = H * (seg.y || 0.38);
  const pop = U.popIn(local, seg.outEnd - seg.outStart, { from: 0.9 });
  U.withTransform(ctx, W / 2, y0 + cardH / 2, pop.scale, env, () => {
    U.drawCard(ctx, x0, y0, cardW, cardH, 30);
    ctx.textBaseline = 'alphabetic';
    ctx.font = U.font(700, 34); ctx.fillStyle = '#DDDDDD';
    F.fillSpacedLeft(ctx, seg.title, x0 + 56, y0 + 84, 7);
    const bx0 = x0 + 70, bx1 = x0 + cardW - 70, base = y0 + cardH - 140, top = y0 + 150;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx0, top - 10); ctx.lineTo(bx0, base); ctx.lineTo(bx1, base); ctx.stroke();
    const bars = seg.bars, n = bars.length, gap = 40;
    const bw = (bx1 - bx0 - 40 - gap * (n - 1)) / n;
    const tops = [];
    bars.forEach((b, i) => {
      const at = b.atOut ?? seg.outStart + 0.2 + i * 0.1;
      const k = t >= at ? U.easeOutBack((t - at) / 0.4) : 0;
      const bh = (base - top) * b.h * k;
      const x = bx0 + 30 + i * (bw + gap);
      const hl = !!b.hl;
      ctx.save();
      if (hl) { ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 26; }
      ctx.fillStyle = hl ? U.COLORS.orange : 'rgba(255,255,255,0.28)';
      U.roundRect(ctx, x, base - bh, bw, Math.max(1, bh), 10); ctx.fill();
      ctx.restore();
      tops.push([x + bw / 2, base - bh - 30, k]);
      if (b.label && t >= at) {
        ctx.globalAlpha = env * U.clamp((t - at) / 0.2);
        ctx.fillStyle = hl ? U.COLORS.white : '#AAAAAA';
        const lines = b.label.split('\n');
        lines.forEach((l, j) => {
          ctx.font = U.font(800, U.fitFont(ctx, l, 800, 34, bw + 30));
          ctx.textAlign = 'center'; ctx.fillText(l, x + bw / 2, base + 48 + j * 38);
        });
        ctx.globalAlpha = env;
      }
    });
    // seta de tendência
    const last = bars[bars.length - 1];
    const ta = (last.atOut ?? seg.outStart) + 0.35;
    if (t >= ta) {
      const k = U.easeOutCubic((t - ta) / 0.4);
      ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pts = tops.map(p => [p[0], p[1]]);
      const head = F.partialPolyline(ctx, pts, k); ctx.stroke();
      if (k > 0.95) {
        const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2];
        const a = Math.atan2(ay - by, ax - bx);
        ctx.fillStyle = U.COLORS.white;
        ctx.beginPath(); ctx.moveTo(ax + Math.cos(a) * 26, ay + Math.sin(a) * 26);
        ctx.lineTo(ax + Math.cos(a + 2.4) * 26, ay + Math.sin(a + 2.4) * 26); ctx.lineTo(ax + Math.cos(a - 2.4) * 26, ay + Math.sin(a - 2.4) * 26); ctx.closePath(); ctx.fill();
      }
    }
  });
}
barClimb.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.6 }, ...s.bars.filter(b => b.atOut != null).map(b => (b.hl ? { type: 'boom', t: b.atOut, gain: 0.6 } : { type: 'tick', t: b.atOut, gain: 2 }))];
module.exports = barClimb;
