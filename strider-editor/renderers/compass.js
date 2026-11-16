const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "A gente não sabe qual o caminho… o que tá faltando é direcionamento": bússola com a agulha
// girando perdida; na palavra-chave ela trava apontando para cima e a palavra bate embaixo.
function compass(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const cx = W / 2, cy = H * (seg.y || 0.58), R = 210;
  const lt = t - seg.lockAtOut;
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 420, cy + 560, 0.55);

  if (seg.top) {
    const k = U.easeOutCubic((local - 0.1) / 0.3);
    ctx.globalAlpha = fade * k;
    const size = U.fitFont(ctx, seg.top, 800, 50, W * 0.9, false, 5);
    ctx.font = U.font(800, size); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
    U.fillSpaced(ctx, seg.top, cx, cy - R - 70 + (1 - k) * 30, 5);
    ctx.globalAlpha = fade;
  }

  const ek = U.easeOutBack(local / 0.35);
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(ek, ek);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#151515'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = lt >= 0 ? U.COLORS.orange : '#d9d9d9'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(0, 0, R - 6, 0, Math.PI * 2); ctx.stroke();
  // marcações
  for (let i = 0; i < 36; i++) {
    const a = i * Math.PI / 18, big = i % 9 === 0;
    ctx.strokeStyle = big ? U.COLORS.white : 'rgba(255,255,255,0.4)'; ctx.lineWidth = big ? 6 : 3;
    ctx.beginPath(); ctx.moveTo(Math.sin(a) * (R - 26), -Math.cos(a) * (R - 26)); ctx.lineTo(Math.sin(a) * (R - (big ? 56 : 40)), -Math.cos(a) * (R - (big ? 56 : 40))); ctx.stroke();
  }
  ctx.font = U.font(900, 40); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [['N', 0], ['L', 1], ['S', 2], ['O', 3]].forEach(([l, i]) => {
    const a = i * Math.PI / 2;
    ctx.fillStyle = l === 'N' && lt >= 0 ? U.COLORS.orange : U.COLORS.white;
    ctx.fillText(l, Math.sin(a) * (R - 90), -Math.cos(a) * (R - 90));
  });
  // agulha: gira perdida, depois trava no norte com mola
  let ang;
  if (lt < 0) ang = local * 7 + Math.sin(local * 3.3) * 2.2;
  else {
    const start = (seg.lockAtOut - seg.outStart) * 7 + Math.sin((seg.lockAtOut - seg.outStart) * 3.3) * 2.2;
    const target = Math.ceil(start / (Math.PI * 2)) * Math.PI * 2;
    const k = U.clamp(lt / 0.35);
    ang = U.lerp(start, target, U.easeOutCubic(k)) + Math.sin(lt * 26) * 0.25 * Math.exp(-lt * 6) * (k >= 1 ? 1 : 0);
  }
  ctx.rotate(ang);
  ctx.fillStyle = U.COLORS.orange;
  ctx.beginPath(); ctx.moveTo(0, -R + 70); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9d9d9';
  ctx.beginPath(); ctx.moveTo(0, R - 70); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (lt >= 0) {
    const s = U.slam(lt, 0.15, 1.6);
    const size = U.fitFont(ctx, seg.big, 900, 140, W * 0.92, true);
    U.withTransform(ctx, cx, cy + R + 130, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, cx, cy + R + 80 + size * 0.75, U.font(900, size, true), U.COLORS.orange, 13);
    });
  }
  ctx.restore();
}
compass.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'tick', t: s.lockAtOut + 0.3, gain: 2.5 }, { type: 'boom', t: s.lockAtOut, gain: 0.85 }];
module.exports = compass;
