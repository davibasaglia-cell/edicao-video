const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Chip "VALOR DE ENTRADA" → cartão de crédito voa girando (flip 3D) → parcelas rolam num odômetro (12X → 15X…).
function drawCreditCard(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#2B2B2B'); g.addColorStop(1, '#0E0E0E');
  ctx.fillStyle = g; U.roundRect(ctx, x, y, w, h, 34); ctx.fill();
  ctx.restore();
  ctx.save();
  U.roundRect(ctx, x, y, w, h, 34); ctx.clip();
  ctx.fillStyle = U.COLORS.orange;
  ctx.beginPath(); ctx.moveTo(x + w * 0.62, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h * 0.55); ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; U.roundRect(ctx, x, y, w, h, 34); ctx.stroke();
  // chip
  ctx.fillStyle = '#D9B26A'; U.roundRect(ctx, x + 60, y + h * 0.36, 100, 76, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 60, y + h * 0.36 + 38); ctx.lineTo(x + 160, y + h * 0.36 + 38); ctx.moveTo(x + 110, y + h * 0.36); ctx.lineTo(x + 110, y + h * 0.36 + 76); ctx.stroke();
  // contactless
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 190, y + h * 0.36 + 38, 14 + i * 13, -0.7, 0.7); ctx.stroke(); }
  ctx.font = U.font(700, 46); ctx.fillStyle = '#EEEEEE'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('••••  ••••  ••••  2026', x + 60, y + h * 0.78);
  ctx.font = U.font(700, 26); ctx.fillStyle = '#AAAAAA';
  F.fillSpacedLeft(ctx, 'CRÉDITO', x + 60, y + h * 0.9, 6);
}

function cardInstallments(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  const y = H * (seg.y || 0.38);
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  // chip de entrada
  const ea = seg.entryAtOut ?? seg.outStart;
  if (t >= ea) {
    const k = U.easeOutBack((t - ea) / 0.3);
    const label = seg.entry_label || 'VALOR DE ENTRADA';
    ctx.font = U.font(800, 46);
    const w = ctx.measureText(label).width + 150, h = 96;
    const cardOn = t >= seg.cardAtOut;
    const lift = cardOn ? U.easeInOutCubic((t - seg.cardAtOut) / 0.3) : 0;
    const cy = U.lerp(y + 180, y - 40, lift);
    U.withTransform(ctx, W / 2, cy, U.lerp(0.5, 1, k) * U.lerp(1, 0.8, lift), U.clamp((t - ea) / 0.12), () => {
      ctx.fillStyle = 'rgba(15,15,15,0.85)'; U.roundRect(ctx, W / 2 - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = U.COLORS.orange; const px = W / 2 - w / 2 + 52;
      ctx.fillRect(px - 18, cy - 5, 36, 10); ctx.fillRect(px - 5, cy - 18, 10, 36);
      ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'left'; ctx.fillText(label, px + 40, cy + 16);
    });
  }
  // cartão
  if (t >= seg.cardAtOut) {
    const k = U.clamp((t - seg.cardAtOut) / 0.45);
    const e = U.easeOutCubic(k);
    const cw = W * 0.74, ch = cw * 0.63, cx = W / 2 + (1 - e) * W * 0.9, cyy = y + 80 + ch / 2;
    const flip = Math.cos((1 - e) * Math.PI * 1.5);
    ctx.save();
    ctx.translate(cx, cyy); ctx.rotate((1 - e) * 0.5 - 0.06); ctx.scale(Math.max(0.02, Math.abs(flip)), 1);
    drawCreditCard(ctx, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();
    // odômetro de parcelas
    const counts = seg.counts;
    const ox = W / 2, oy = cyy + ch / 2 + 170, boxH = 220;
    const cur = counts.filter(c => t >= c.atOut).length - 1;
    if (cur >= 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, oy - boxH * 0.78, W, boxH); ctx.clip();
      const c = counts[cur], prev = counts[cur - 1];
      const rk = U.easeOutBack((t - c.atOut) / 0.28);
      ctx.font = U.font(900, 200, true); ctx.textAlign = 'center';
      if (prev) { ctx.globalAlpha = env * (1 - U.clamp(rk)); F.strokeFill(ctx, prev.text, ox, oy - rk * boxH, U.COLORS.white, 12); }
      ctx.globalAlpha = env;
      F.strokeFill(ctx, c.text, ox, oy + (1 - rk) * boxH, U.COLORS.orange, 12);
      ctx.restore();
      ctx.font = U.font(800, 44); ctx.fillStyle = U.COLORS.white; ctx.globalAlpha = env * U.clamp((t - counts[0].atOut) / 0.2);
      U.fillSpaced(ctx, seg.count_label || "NO CARTÃO", ox, oy + 68, 8);
    }
  }
  ctx.restore();
}
cardInstallments.sfx = s => [{ type: 'whoosh', t: (s.entryAtOut ?? s.outStart) - 0.1, gain: 0.6 }, { type: 'whoosh', t: s.cardAtOut - 0.05, gain: 0.8 },
  ...s.counts.map((c, i) => i === s.counts.length - 1 ? { type: 'boom', t: c.atOut, gain: 0.7 } : { type: 'tick', t: c.atOut, gain: 2.6 })];
module.exports = cardInstallments;
