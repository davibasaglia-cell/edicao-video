const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// Encerramento "as pessoas precisam saber do trabalho de vocês": megafone entra, ondas de som
// irradiam a cada frase, "TRABALHO MUITO BOM" → "AS PESSOAS PRECISAM SABER" e o @ da clínica
// fica na tela até o fim.
function broadcastClose(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = U.clamp(local / 0.3);
  const cy = H * (seg.y || 0.56);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = `rgba(20,12,4,${0.3 * fade})`; ctx.fillRect(0, 0, W, H);
  X.scrim(ctx, W, cy - 420, H * 0.95, 0.55);

  // megafone
  const mk = U.easeOutBack(local / 0.4);
  const mx = W * 0.3, my = cy - 120;
  ctx.save();
  ctx.translate(mx, my); ctx.scale(mk, mk); ctx.rotate(-0.25 + Math.sin(local * 6) * 0.03);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24;
  ctx.fillStyle = U.COLORS.white;
  ctx.beginPath(); ctx.moveTo(-90, -40); ctx.lineTo(80, -120); ctx.lineTo(80, 120); ctx.lineTo(-90, 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = U.COLORS.orange;
  U.roundRect(ctx, -150, -48, 70, 96, 16); ctx.fill();
  ctx.fillRect(70, -126, 26, 252);
  ctx.fillStyle = '#d9d9d9'; U.roundRect(ctx, -60, 30, 36, 90, 10); ctx.fill();
  ctx.restore();
  // ondas
  const pulses = [seg.outStart, seg.line1AtOut, seg.line2AtOut].filter(v => v != null);
  pulses.forEach(p => {
    for (let i = 0; i < 3; i++) {
      const k = U.clamp((t - p - i * 0.1) / 0.7);
      if (k <= 0 || k >= 1) continue;
      ctx.globalAlpha = fade * (1 - k);
      ctx.strokeStyle = i === 0 ? U.COLORS.orange : U.COLORS.white; ctx.lineWidth = 9; ctx.lineCap = 'round';
      const r = 150 + k * 380;
      ctx.beginPath(); ctx.arc(mx + 40, my - 30, r, -0.85, 0.15); ctx.stroke();
    }
  });
  ctx.globalAlpha = fade;

  const line = (text, at, y, size, color, maxS) => {
    if (at == null || t < at) return;
    const s = U.slam(t - at, 0.15, 1.5);
    const sz = U.fitFont(ctx, text, 900, maxS, W * 0.9, true);
    U.withTransform(ctx, W / 2, y, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, text, W / 2, y + sz * 0.35, U.font(900, sz, true), color, 13);
    });
  };
  line(seg.line1, seg.line1AtOut, cy + 150, 0, U.COLORS.white, 110);
  line(seg.line2, seg.line2AtOut, cy + 300, 0, U.COLORS.orange, 130);
  if (seg.handle && seg.handleAtOut != null && t >= seg.handleAtOut) {
    const k = U.easeOutBack((t - seg.handleAtOut) / 0.35);
    ctx.save();
    ctx.translate(W / 2, cy + 470); ctx.scale(k, k);
    X.chip(ctx, seg.handle, 0, 0, 58, U.COLORS.white, '#111', 44);
    ctx.restore();
  }
  ctx.restore();
}
broadcastClose.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.05, gain: 0.7 },
  ...(s.line1AtOut != null ? [{ type: 'boom', t: s.line1AtOut, gain: 0.6 }] : []),
  ...(s.line2AtOut != null ? [{ type: 'boom', t: s.line2AtOut, gain: 0.8 }] : []),
  ...(s.handleAtOut != null ? [{ type: 'chime', t: s.handleAtOut + 0.05, gain: 1.4 }] : [])];
module.exports = broadcastClose;
