const U = require('../utils/canvas_utils');
// Legenda discreta: palavras entram uma a uma (fade + sobe 10px), branca, sombra verde-escura. Não compete com os gráficos.
module.exports = function subtitle(ctx, seg, t, W, H) {
  const chunk = seg.chunks.find(c => t >= c.start && t < c.end);
  if (!chunk) return;
  const local = t - chunk.start, dur = chunk.end - chunk.start;
  const words = chunk.text.split(' ');
  ctx.font = U.font(700, 50); ctx.textBaseline = 'middle';
  const lines = U.wrap(ctx, chunk.text, W * 0.78);
  const lh = 62, y0 = H * (seg.y || 0.78) - ((lines.length - 1) * lh) / 2;
  const out = U.clamp((dur - local) / 0.1);
  let idx = 0;
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), widths = ws.map(w => ctx.measureText(w + ' ').width);
    let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2 + ctx.measureText(' ').width / 2;
    ws.forEach((w, wi) => {
      const k = U.easeOutCubic((local - idx * Math.min(0.07, dur / (words.length + 2))) / 0.16);
      ctx.save();
      ctx.globalAlpha = k * out;
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(6,33,15,0.75)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
      ctx.fillStyle = U.C.white;
      ctx.fillText(w, x, y0 + li * lh + (1 - k) * 12);
      ctx.restore();
      x += widths[wi]; idx++;
    });
  });
};
