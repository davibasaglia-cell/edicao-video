const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// REAL x FALSO: "REAL" entra limpo e estável; "FALSO" entra com glitch (RGB split + fatias) e segue instável.
function glitchSplit(ctx, seg, t, W, H) {
  const dur = seg.outEnd - seg.outStart, local = t - seg.outStart;
  const fade = U.clamp((dur - local) / 0.12);
  const frame = Math.round(t * 30);
  ctx.save();
  ctx.globalAlpha = fade;
  // faixa diagonal escura para separar as duas palavras
  const g = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(0,0,0,0.45)'); g.addColorStop(0.75, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.3, W, H * 0.42);
  ctx.textBaseline = 'alphabetic';
  if (seg.small) {
    const s = U.slam(t - seg.smallAtOut, 0.14, 1.25);
    if (t >= seg.smallAtOut) U.withTransform(ctx, W / 2, H * 0.33, s.scale, s.alpha, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.small, 800, 52, W * 0.85, false, 6)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, H * 0.345, 6);
    });
  }
  if (t >= seg.realAtOut) {
    const s = U.slam(t - seg.realAtOut, 0.14, 1.5);
    const size = U.fitFont(ctx, seg.real, 900, 260, W * 0.86, true);
    U.withTransform(ctx, W / 2, H * 0.44, s.scale, s.alpha, () => {
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 12; ctx.strokeText(seg.real, W / 2, H * 0.49);
      ctx.fillStyle = U.COLORS.white; ctx.fillText(seg.real, W / 2, H * 0.49);
    });
    // divisória
    const lk = U.easeOutCubic((t - seg.realAtOut - 0.1) / 0.35);
    ctx.fillStyle = U.COLORS.orange;
    ctx.fillRect(W / 2 - (W * 0.36) * lk, H * 0.515, W * 0.72 * lk, 8);
    ctx.font = U.font(800, 46); ctx.fillStyle = U.COLORS.white; ctx.globalAlpha = fade * lk;
    ctx.fillStyle = 'rgba(10,10,10,1)'; ctx.fillRect(W / 2 - 50, H * 0.515 - 26, 100, 60);
    ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'center'; ctx.fillText('OU', W / 2, H * 0.515 + 20);
    ctx.globalAlpha = fade;
  }
  if (t >= seg.fakeAtOut) {
    const lt = t - seg.fakeAtOut;
    const s = U.slam(lt, 0.12, 1.4);
    const burst = lt < 0.35 ? 1 - lt / 0.35 : ((frame % 17) < 2 ? 0.7 : 0);
    const size = U.fitFont(ctx, seg.fake, 900, 260, W * 0.86, true);
    U.withTransform(ctx, W / 2, H * 0.6, s.scale, s.alpha, () => {
      ctx.lineJoin = 'round';
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 12; ctx.strokeText(seg.fake, W / 2, H * 0.66);
      F.glitchText(ctx, seg.fake, W / 2, H * 0.66, U.font(900, size, true), U.COLORS.orange, burst, frame);
    });
  }
  ctx.restore();
}
glitchSplit.sfx = s => [{ type: 'whoosh', t: s.realAtOut - 0.1, gain: 0.7 }, { type: 'boom', t: s.fakeAtOut, gain: 0.8 }, { type: 'tick', t: s.fakeAtOut + 0.04, gain: 2.5 }];
module.exports = glitchSplit;
