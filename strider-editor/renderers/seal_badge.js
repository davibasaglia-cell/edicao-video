const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Encerramento: selo serrilhado laranja entra girando (de -180°) com ondas de choque; check traçado; frase final embaixo.
function sealBadge(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd + 10, 0.2, 0.15);
  F.vignette(ctx, W, H, env * 0.9);
  const cx = W / 2, cy = H * (seg.y || 0.42);
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  if (seg.small) {
    const s = U.slam(t - (seg.smallAtOut ?? seg.outStart), 0.14, 1.3);
    U.withTransform(ctx, W / 2, cy - 330, s.scale, s.alpha, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.small, 800, 56, W * 0.86, false, 7)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, cy - 310, 7);
    });
  }
  if (t >= seg.sealAtOut) {
    const st = t - seg.sealAtOut;
    const k = U.easeOutBack(st / 0.45);
    const r = 190;
    // ondas
    for (let i = 0; i < 2; i++) {
      const wk = U.clamp((st - i * 0.12) / 0.7);
      if (wk > 0 && wk < 1) {
        ctx.strokeStyle = `rgba(245,160,32,${0.7 * (1 - wk)})`; ctx.lineWidth = 10 * (1 - wk) + 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + wk * 380, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate((1 - U.clamp(k)) * -Math.PI + st * 0.25); ctx.scale(k, k);
    ctx.shadowColor = 'rgba(245,160,32,0.6)'; ctx.shadowBlur = 50;
    ctx.fillStyle = U.COLORS.orange;
    ctx.beginPath();
    const N = 22;
    for (let i = 0; i <= N * 2; i++) { const a = i / (N * 2) * Math.PI * 2, rr = i % 2 ? r * 0.9 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // check (não gira)
    const ck = U.easeOutCubic((st - 0.3) / 0.25);
    if (ck > 0) {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      F.partialPolyline(ctx, [[cx - 72, cy + 4], [cx - 18, cy + 58], [cx + 80, cy - 52]], ck); ctx.stroke();
    }
  }
  if (seg.line1 && t >= seg.line1AtOut) {
    const s = U.slam(t - seg.line1AtOut, 0.14, 1.3);
    U.withTransform(ctx, W / 2, cy + 330, s.scale, s.alpha, () => {
      ctx.font = U.font(900, U.fitFont(ctx, seg.line1, 900, 90, W * 0.86, true), true); ctx.textAlign = 'center';
      F.strokeFill(ctx, seg.line1, W / 2, cy + 340, U.COLORS.white, 10);
    });
  }
  if (seg.line2 && t >= seg.line2AtOut) {
    const s = U.slam(t - seg.line2AtOut, 0.15, 1.6);
    const size = U.fitFont(ctx, seg.line2, 900, 190, W * 0.9, true);
    U.withTransform(ctx, W / 2, cy + 440 + size * 0.4, s.scale, s.alpha, () => {
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
      F.strokeFill(ctx, seg.line2, W / 2, cy + 440 + size * 0.75, U.COLORS.orange, 12);
    });
  }
  ctx.restore();
}
sealBadge.sfx = s => [{ type: 'whoosh', t: (s.smallAtOut ?? s.outStart) - 0.1, gain: 0.5 }, { type: 'whoosh', t: s.sealAtOut - 0.1, gain: 0.7 },
  { type: 'boom', t: s.sealAtOut + 0.2, gain: 0.9 }, ...(s.line2AtOut ? [{ type: 'chime', t: s.line2AtOut, gain: 0.8 }] : [])];
module.exports = sealBadge;
