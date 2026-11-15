const U = require('../utils/canvas_utils');

// Hierarquia tipográfica: linha pequena branca + palavra gigante laranja na sequência (sem card).
module.exports = function hierarchy(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const dur = seg.outEnd - seg.outStart;
  const fade = U.clamp((seg.outEnd - t) / 0.1);
  const y0 = H * (seg.y || 0.6);
  const smallSize = U.fitFont(ctx, seg.small, 800, 62, W * 0.85, false, 6);
  const bigSize = U.fitFont(ctx, seg.big, 900, 320, W * 0.9, true);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 24;
  ctx.textBaseline = 'alphabetic';
  const sIn = U.slam(local, 0.12, 1.2);
  U.withTransform(ctx, W / 2, y0, sIn.scale, sIn.alpha * fade, () => {
    ctx.font = U.font(800, smallSize);
    ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.small, W / 2, y0, 6);
  });
  const at = seg.bigAtOut != null ? seg.bigAtOut : seg.outStart + 0.2;
  if (t >= at) {
    const s = U.slam(t - at, 0.15, 1.6);
    const by = y0 + bigSize * 0.95;
    U.withTransform(ctx, W / 2, by - bigSize * 0.4, s.scale, s.alpha * fade, () => {
      ctx.font = U.font(900, bigSize, true);
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 12;
      ctx.strokeText(seg.big, W / 2, by);
      ctx.fillStyle = U.COLORS.orange;
      ctx.fillText(seg.big, W / 2, by);
    });
  }
  if (seg.small2) {
    const at2 = seg.small2AtOut != null ? seg.small2AtOut : at + 0.3;
    if (t >= at2) {
      const s3 = U.slam(t - at2, 0.12, 1.3);
      const y2 = y0 + bigSize * 0.95 + smallSize * 1.6;
      U.withTransform(ctx, W / 2, y2, s3.scale, s3.alpha * fade, () => {
        ctx.font = U.font(800, smallSize);
        ctx.fillStyle = U.COLORS.white;
        U.fillSpaced(ctx, seg.small2, W / 2, y2, 6);
      });
    }
  }
  ctx.restore();
};
