const U = require('../utils/canvas_utils');

// Card escuro: linha branca + palavra-chave LARANJA gigante + linha branca. Vídeo P&B atrás.
module.exports = function cardHook(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cardW = W * 0.84;
  const cardX = (W - cardW) / 2;
  const padTop = 70, gap = 18;
  const normalSize = 54;
  const emphMax = 230;

  // medir linhas
  const rows = seg.lines.map((line, i) => {
    const emph = seg.emphasis.includes(i);
    const size = emph
      ? U.fitFont(ctx, line, 900, emphMax, cardW - 120, true)
      : U.fitFont(ctx, line, 700, normalSize, cardW - 120, false, 6);
    return { line, emph, size };
  });
  const cardH = padTop * 2 + rows.reduce((a, r) => a + r.size * (r.emph ? 0.92 : 1.05), 0) + gap * (rows.length - 1);
  const cardY = H * (seg.y || 0.53);
  const cx = W / 2, cy = cardY + cardH / 2;

  U.withTransform(ctx, cx, cy, env.scale, env.alpha, () => {
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 34);
    let y = cardY + padTop;
    ctx.textBaseline = 'alphabetic';
    rows.forEach(r => {
      const h = r.size * (r.emph ? 0.92 : 1.05);
      const baseline = y + h * (r.emph ? 0.9 : 0.8);
      if (r.emph) {
        const at = seg.emphasisAtOut != null ? seg.emphasisAtOut : seg.outStart + 0.12;
        if (t >= at) {
          const s = U.slam(t - at, 0.16, 1.5);
          U.withTransform(ctx, cx, y + h / 2, s.scale, s.alpha, () => {
            ctx.font = U.font(900, r.size, true);
            ctx.fillStyle = U.COLORS.orange;
            ctx.textAlign = 'center';
            ctx.fillText(r.line, cx, baseline);
          });
        }
      } else {
        ctx.font = U.font(700, r.size);
        ctx.fillStyle = U.COLORS.white;
        U.fillSpaced(ctx, r.line, cx, baseline, 6);
      }
      y += h + gap;
    });
  });
};
