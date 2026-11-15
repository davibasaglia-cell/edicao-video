const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Chips com ícone de linha que entram alternando os lados, no ritmo de cada item falado.
function iconChips(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = U.clamp((dur - local) / 0.15);
  const top = H * (seg.y || 0.4), rowH = 128, chipH = 104, margin = 54;
  if (seg.title) {
    const s = U.slam(local, 0.14, 1.2);
    U.withTransform(ctx, W / 2, top - 60, s.scale, s.alpha * fade, () => {
      ctx.font = U.font(800, 34); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 16;
      U.fillSpaced(ctx, seg.title, W / 2, top - 48, 8);
    });
  }
  seg.items.forEach((it, i) => {
    if (t < it.atOut) return;
    const k = (t - it.atOut) / 0.3;
    const left = i % 2 === 0;
    ctx.font = U.font(800, 44);
    const textW = ctx.measureText(it.text).width;
    const chipW = Math.min(W - margin * 2, textW + chipH + 70);
    const xTarget = left ? margin : W - margin - chipW;
    const x = xTarget + (left ? -1 : 1) * (1 - U.easeOutBack(k)) * (chipW + 120);
    const float = Math.sin((t - it.atOut) * 2.2 + i) * 4;
    const y = top + i * rowH + float;
    const hl = it.highlight;
    const pop = 1 + 0.08 * Math.sin(Math.PI * U.clamp((t - it.atOut - 0.2) / 0.25));
    U.withTransform(ctx, x + chipW / 2, y + chipH / 2, pop, U.clamp(k * 2.5) * fade, () => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24;
      ctx.fillStyle = hl ? U.COLORS.orange : 'rgba(14,14,14,0.86)';
      U.roundRect(ctx, x, y, chipW, chipH, chipH / 2); ctx.fill();
      ctx.restore();
      const icx = x + chipH / 2 + 4, icy = y + chipH / 2;
      ctx.fillStyle = hl ? '#111' : U.COLORS.orange;
      ctx.beginPath(); ctx.arc(icx, icy, chipH / 2 - 10, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.strokeStyle = hl ? U.COLORS.orange : '#111'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.translate(icx, icy); ctx.scale(0.78, 0.78); ctx.translate(-icx, -icy);
      (F.ICONS[it.icon] || F.ICONS.sparkle)(ctx, icx, icy);
      ctx.restore();
      ctx.font = U.font(800, 44); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hl ? '#111' : U.COLORS.white;
      ctx.fillText(it.text, x + chipH + 24, y + chipH / 2 + 3);
    });
  });
}
iconChips.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 },
  ...s.items.map(i => i.highlight ? { type: 'chime', t: i.atOut + 0.1, gain: 2.5 } : { type: 'whoosh', t: i.atOut - 0.08, gain: 0.45 })];
module.exports = iconChips;
