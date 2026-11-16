const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "A meta se torna fácil de ser alcançada": alvo gira para dentro, uma flecha voa de fora da tela
// e crava no centro na palavra "alcançada" (tremida + ondas), e a palavra bate embaixo.
function bullseyeArrow(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = X.segFade(seg, t, 0.1, 0.15);
  const cx = W / 2, cy = H * (seg.y || 0.6), R = 190;
  const hit = t - seg.hitAtOut;
  const shake = hit > 0 ? Math.sin(hit * 70) * 12 * Math.max(0, 1 - hit / 0.3) : 0;
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 420, cy + 520, 0.5);

  // rótulo
  if (seg.label) {
    const lk = U.easeOutCubic((t - (seg.labelAtOut ?? seg.outStart)) / 0.3);
    ctx.globalAlpha = fade * lk;
    const size = U.fitFont(ctx, seg.label, 800, 52, W * 0.9, false, 5);
    ctx.font = U.font(800, size); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.label, cx, cy - R - 80 + (1 - lk) * 30, 5);
    ctx.globalAlpha = fade;
  }

  // alvo
  const ak = U.easeOutBack(local / 0.4);
  ctx.save();
  ctx.translate(cx + shake, cy);
  ctx.rotate((1 - U.clamp(ak)) * -2.4);
  ctx.scale(ak, ak);
  const rings = [[1, '#F5F5F5'], [0.8, '#141414'], [0.6, '#F5F5F5'], [0.4, '#141414'], [0.2, U.COLORS.orange]];
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
  rings.forEach(([f, c], i) => { if (i) ctx.shadowBlur = 0; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, R * f, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();

  // ondas de impacto
  if (hit > 0) {
    for (let i = 0; i < 2; i++) {
      const k = U.clamp((hit - i * 0.12) / 0.5);
      if (k <= 0 || k >= 1) continue;
      ctx.globalAlpha = fade * (1 - k);
      ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, cy, R * (0.3 + k * 1.1), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = fade;
  }

  // flecha
  const flyD = 0.28;
  const fk = U.clamp((t - (seg.hitAtOut - flyD)) / flyD);
  if (fk > 0) {
    const ang = -0.42;
    const len = 330;
    const dist = (1 - fk * fk) * 1100;
    const wob = hit > 0 ? Math.sin(hit * 40) * 0.06 * Math.max(0, 1 - hit / 0.5) : 0;
    ctx.save();
    ctx.translate(cx + shake, cy);
    ctx.rotate(ang + Math.PI + wob);
    ctx.translate(dist, 0);
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(len, 0); ctx.stroke();
    ctx.fillStyle = U.COLORS.white;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(40, -22); ctx.lineTo(40, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = U.COLORS.orange;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(len - 70, 0); ctx.lineTo(len - 20, s * 38); ctx.lineTo(len + 20, s * 38); ctx.lineTo(len - 20, 0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  if (hit >= 0) {
    const s = U.slam(hit, 0.15, 1.7);
    const size = U.fitFont(ctx, seg.big, 900, 210, W * 0.92, true);
    U.withTransform(ctx, cx, cy + R + 150, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, cx, cy + R + 70 + size * 0.75, U.font(900, size, true), U.COLORS.orange, 14);
    });
  }
  ctx.restore();
}
bullseyeArrow.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'whoosh', t: s.hitAtOut - 0.3, gain: 0.9 },
  { type: 'boom', t: s.hitAtOut, gain: 0.95 }, { type: 'chime', t: s.hitAtOut + 0.05, gain: 1.2 }];
module.exports = bullseyeArrow;
