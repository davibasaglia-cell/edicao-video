const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "Resultados nítidos": visor de câmera procurando foco; a palavra começa borrada, o foco "caça"
// e trava (cantos ficam laranja + bip) e a palavra-chave bate embaixo.
function focusPull(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.08, 0.12);
  const cy = H * (seg.y || 0.6);
  const fAt = seg.focusAtOut;
  const pre = U.clamp(local / Math.max(0.2, fAt - seg.outStart));
  const locked = t >= fAt;
  // caça de foco: blur oscila e diminui até travar
  const blur = locked ? Math.max(0, 0.25 - (t - fAt) / 0.12) : U.lerp(1, 0.35, pre) + 0.25 * Math.sin(local * 18) * (1 - pre);
  const bScale = locked ? 1 - 0.04 * Math.max(0, 1 - (t - fAt) / 0.15) : U.lerp(1.3, 1.04, U.easeOutCubic(pre)) + 0.02 * Math.sin(local * 22);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 360, cy + 560, 0.5);

  const fw = W * 0.86 * bScale, fh = 360 * bScale;
  U.drawCornerBrackets(ctx, W / 2 - fw / 2, cy - fh / 2, fw, fh, {
    color: locked ? U.COLORS.orange : 'rgba(255,255,255,0.95)', width: locked ? 9 : 6, len: 70, inset: 0 });
  // cruz central + indicador AF
  ctx.strokeStyle = locked ? U.COLORS.orange : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
  ctx.font = U.font(800, 28); ctx.fillStyle = locked ? U.COLORS.orange : U.COLORS.white;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(locked ? 'AF ●  FOCO TRAVADO' : 'AF ○  FOCANDO…', W / 2 - fw / 2 + 6, cy - fh / 2 - 22);

  const size = U.fitFont(ctx, seg.word, 900, 150, W * 0.76, true);
  if (blur > 0.01) X.blurredText(ctx, seg.word, W / 2, cy + size * 0.36, U.font(900, size, true), U.COLORS.white, blur);
  else X.strokedText(ctx, seg.word, W / 2, cy + size * 0.36, U.font(900, size, true), U.COLORS.white, 10);

  if (locked) {
    const s = U.slam(t - fAt, 0.14, 1.7);
    const bs = U.fitFont(ctx, seg.big, 900, 230, W * 0.9, true);
    U.withTransform(ctx, W / 2, cy + fh / 2 + 160, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, W / 2, cy + fh / 2 + bs * 0.8 + 30, U.font(900, bs, true), U.COLORS.orange, 14);
    });
  }
  ctx.restore();
}
focusPull.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.6 }, { type: 'tick', t: s.focusAtOut - 0.02, gain: 3 }, { type: 'boom', t: s.focusAtOut + 0.02, gain: 0.8 }];
module.exports = focusPull;
