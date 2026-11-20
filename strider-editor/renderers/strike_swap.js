const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// "Não é X, é Y": X entra branco, um traço laranja risca (desenhado), X encolhe e Y entra com wipe lateral, gigante.
function strikeSwap(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  F.vignette(ctx, W, H, env * 0.9);
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  const cy = H * (seg.y || 0.5);
  const swapped = t >= seg.swapAtOut;
  if (seg.small && t >= (seg.smallAtOut ?? seg.outStart)) {
    const s = U.slam(t - (seg.smallAtOut ?? seg.outStart), 0.14, 1.25);
    const gone = swapped ? 1 - U.clamp((t - seg.swapAtOut) / 0.15) : 1;
    U.withTransform(ctx, W / 2, cy - 420, s.scale, s.alpha * gone, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.small, 800, 56, W * 0.86, false, 6)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, cy - 400, 6);
    });
  }
  // palavra riscada
  if (t >= seg.oldAtOut) {
    const drop = U.easeOutBack((t - seg.oldAtOut) / 0.25);
    const shrink = swapped ? U.easeInOutCubic((t - seg.swapAtOut) / 0.25) : 0;
    const oy = U.lerp(cy - 120, cy - 250, shrink) - (1 - drop) * 140;
    const size = U.fitFont(ctx, seg.old, 900, 190, W * 0.8, true) * U.lerp(1, 0.62, shrink);
    ctx.save();
    ctx.globalAlpha = env * U.clamp((t - seg.oldAtOut) / 0.1) * U.lerp(1, 0.55, shrink);
    ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
    F.strokeFill(ctx, seg.old, W / 2, oy, U.COLORS.white, 10);
    const tw = ctx.measureText(seg.old).width;
    if (t >= seg.strikeAtOut) {
      const k = U.easeOutCubic((t - seg.strikeAtOut) / 0.2);
      ctx.strokeStyle = U.COLORS.orange; ctx.lineCap = 'round'; ctx.lineWidth = size * 0.13;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12;
      const xa = W / 2 - tw / 2 - 30, xb = W / 2 + tw / 2 + 30;
      F.partialPolyline(ctx, [[xa, oy - size * 0.26], [xb, oy - size * 0.42]], k);
      ctx.stroke();
    }
    ctx.restore();
  }
  // resposta com wipe
  if (swapped) {
    const k = U.easeOutCubic((t - seg.swapAtOut) / 0.28);
    const lines = seg.new_lines;
    const size = Math.min(...lines.map(l => U.fitFont(ctx, l, 900, 200, W * 0.9, true)));
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W * k * 1.05, H); ctx.clip();
    if (seg.new_small) {
      ctx.font = U.font(800, 56); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'center';
      U.fillSpaced(ctx, seg.new_small, W / 2, cy - 30, 8);
    }
    ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
    lines.forEach((l, i) => F.strokeFill(ctx, l, W / 2, cy + 40 + size * 0.85 + i * size * 0.98, U.COLORS.orange, 12));
    ctx.restore();
    // barra do wipe
    if (k < 1) { ctx.fillStyle = U.COLORS.orange; ctx.fillRect(W * k * 1.05 - 10, cy - 100, 14, size * lines.length + 220); }
  }
  ctx.restore();
}
strikeSwap.sfx = s => [{ type: 'whoosh', t: s.oldAtOut - 0.1, gain: 0.6 }, { type: 'tick', t: s.strikeAtOut, gain: 3 },
  { type: 'whoosh', t: s.swapAtOut - 0.06, gain: 0.7 }, { type: 'boom', t: s.swapAtOut + 0.15, gain: 0.9 }];
module.exports = strikeSwap;
