const U = require('../utils/canvas_utils');

// Tipografia cinética: cada palavra entra voando de um lado (alternando), com rastro, no tempo da fala.
function kineticWords(ctx, seg, t, W, H) {
  const dur = seg.outEnd - seg.outStart;
  const fade = U.clamp((seg.outEnd - t) / 0.12);
  const sizes = seg.words.map(w => U.fitFont(ctx, w.text, 900, w.big ? 270 : 132, W * 0.86, true));
  const hs = sizes.map(s => s * 0.98);
  let y = H * (seg.centerY || 0.5) - hs.reduce((a, b) => a + b, 0) / 2;
  seg.words.forEach((w, i) => {
    const h = hs[i];
    const base = y + h * 0.84;
    y += h;
    if (t < w.atOut) return;
    const k = (t - w.atOut) / 0.26;
    const dir = i % 2 ? 1 : -1;
    const x = W / 2 + dir * (1 - U.easeOutBack(k)) * W * 0.75;
    const draw = (xx, a) => {
      ctx.save();
      ctx.globalAlpha = a * fade;
      ctx.font = U.font(900, sizes[i], true);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = Math.max(10, sizes[i] * 0.07);
      ctx.strokeText(w.text, xx, base);
      ctx.fillStyle = w.color || (w.big ? U.COLORS.orange : U.COLORS.white);
      ctx.fillText(w.text, xx, base);
      ctx.restore();
    };
    if (k < 1) [0.3, 0.18, 0.08].forEach((a, j) => draw(x + dir * (j + 1) * 70 * (1 - U.clamp(k)), a));
    draw(x, U.clamp(k * 3));
  });
}
kineticWords.sfx = s => s.words.map(w => w.boom ? { type: 'boom', t: w.atOut, gain: 0.8 } : { type: 'whoosh', t: w.atOut - 0.1, gain: 0.6 });
module.exports = kineticWords;
