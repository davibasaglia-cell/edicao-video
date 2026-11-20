const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Título de capítulo: letras caem uma a uma do alto com quique; sublinhado laranja varre embaixo.
function letterCascade(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  F.vignette(ctx, W, H, env);
  const cy = H * (seg.y || 0.5);
  const at = seg.wordAtOut ?? seg.outStart;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  if (seg.small) {
    const s = U.slam(t - seg.outStart, 0.14, 1.3);
    U.withTransform(ctx, W / 2, cy - 170, s.scale, s.alpha, () => {
      ctx.font = U.font(800, 58); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, cy - 150, 10);
    });
  }
  const word = seg.word;
  const size = U.fitFont(ctx, word, 900, 220, W * 0.92, true);
  ctx.font = U.font(900, size, true);
  const chars = [...word], widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = (W - total) / 2;
  const stagger = seg.stagger || 0.035;
  chars.forEach((c, i) => {
    const lt = t - at - i * stagger;
    if (lt > 0) {
      const k = U.clamp(lt / 0.32);
      // queda com quique
      const bounce = k < 0.6 ? 1 - (k / 0.6) ** 2 : -0.12 * Math.sin(Math.PI * (k - 0.6) / 0.4);
      const yy = cy + size * 0.35 - bounce * 260;
      ctx.save();
      ctx.globalAlpha = env * U.clamp(lt / 0.08);
      ctx.translate(x + widths[i] / 2, yy);
      ctx.rotate((1 - k) * (i % 2 ? 0.3 : -0.3));
      ctx.textAlign = 'center';
      F.strokeFill(ctx, c, 0, 0, U.COLORS.orange, 12);
      ctx.restore();
    }
    x += widths[i];
  });
  const endT = at + chars.length * stagger + 0.2;
  if (t >= endT) {
    const k = U.easeOutCubic((t - endT) / 0.25);
    ctx.fillStyle = U.COLORS.white;
    ctx.fillRect(W / 2 - total / 2, cy + size * 0.35 + 34, total * k, 12);
  }
  ctx.restore();
}
letterCascade.sfx = s => {
  const at = s.wordAtOut ?? s.outStart, n = [...s.word].length, st = s.stagger || 0.035;
  const ev = [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.6 }];
  for (let i = 0; i < n; i += 3) ev.push({ type: 'tick', t: at + i * st + 0.2, gain: 1.6 });
  ev.push({ type: 'boom', t: at + n * st + 0.15, gain: 0.8 });
  return ev;
};
module.exports = letterCascade;
