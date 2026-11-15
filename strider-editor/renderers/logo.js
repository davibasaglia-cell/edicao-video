const U = require('../utils/canvas_utils');

// Branding: nome em branco + subtítulo laranja.
module.exports = function logo(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur, null, { from: 0.9 });
  const cardW = W * 0.78, cardH = 210, cardX = (W - cardW) / 2, cardY = H * (seg.y || 0.07);
  const cx = W / 2;
  U.withTransform(ctx, cx, cardY + cardH / 2, env.scale, env.alpha, () => {
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.textBaseline = 'alphabetic';
    const s1 = U.fitFont(ctx, seg.title, 700, 38, cardW - 120, false, 8);
    ctx.font = U.font(700, s1);
    ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.title, cx, cardY + 86, 8);
    const s2 = U.fitFont(ctx, seg.subtitle, 900, 78, cardW - 120, true);
    ctx.font = U.font(900, s2, true);
    ctx.fillStyle = U.COLORS.orange;
    ctx.textAlign = 'center';
    ctx.fillText(seg.subtitle, cx, cardY + 170);
  });
};
