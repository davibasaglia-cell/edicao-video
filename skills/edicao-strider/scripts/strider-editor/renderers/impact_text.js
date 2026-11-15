const U = require('../utils/canvas_utils');

// Texto gigante amarelo italic sobre vídeo P&B, linhas entram no ritmo da fala.
module.exports = function impactText(ctx, seg, t, W, H) {
  const dur = seg.outEnd - seg.outStart;
  const fadeOut = U.clamp((seg.outEnd - t) / 0.1);
  const color = seg.color || U.COLORS.yellow;
  const sizes = seg.lines.map(l => U.fitFont(ctx, l.text, 900, l.max || 300, W * 0.88, true));
  const lineHs = sizes.map(s => s * 0.95);
  const total = lineHs.reduce((a, b) => a + b, 0);
  let y = H * (seg.centerY || 0.5) - total / 2;
  seg.lines.forEach((l, i) => {
    const h = lineHs[i];
    const at = l.atOut != null ? l.atOut : seg.outStart;
    if (t >= at) {
      const s = U.slam(t - at, 0.14, 1.6);
      U.withTransform(ctx, W / 2, y + h / 2, s.scale, s.alpha * fadeOut, () => {
        ctx.font = U.font(900, sizes[i], true);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = Math.max(10, sizes[i] * 0.07);
        const base = y + h * 0.86;
        ctx.strokeText(l.text, W / 2, base);
        ctx.fillStyle = l.color || color;
        ctx.fillText(l.text, W / 2, base);
      });
    }
    y += h;
  });
};
