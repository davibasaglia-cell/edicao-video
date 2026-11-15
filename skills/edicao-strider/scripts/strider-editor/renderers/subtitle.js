const U = require('../utils/canvas_utils');

// Legenda simples estilo transcrição: branca, centralizada, mixed case.
module.exports = function subtitle(ctx, seg, t, W, H) {
  const chunk = seg.chunks.find(c => t >= c.start && t < c.end);
  if (!chunk) return;
  const local = t - chunk.start;
  const s = 0.92 + 0.08 * U.easeOutCubic(local / 0.08);
  const size = U.fitFont(ctx, chunk.text, 700, 58, W * 0.86);
  const y = H * (seg.y || 0.8);
  U.withTransform(ctx, W / 2, y, s, U.clamp(local / 0.05), () => {
    ctx.font = U.font(700, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 9;
    ctx.strokeText(chunk.text, W / 2, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = U.COLORS.white;
    ctx.fillText(chunk.text, W / 2, y);
  });
};
