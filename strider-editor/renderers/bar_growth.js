const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "Que não só vocês cresçam de forma pessoal, mas a clínica também avance dia a dia": gráfico de
// barras — a barra VOCÊS sobe, depois A CLÍNICA sobe mais alto; uma seta de tendência atravessa
// as duas e o selo "DIA A DIA" carimba no topo.
function barGrowth(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const baseY = H * (seg.y || 0.8), maxH = 450;
  const bars = seg.bars || [];
  const bw = 250, gap = 110;
  const x0 = W / 2 - (bars.length * bw + (bars.length - 1) * gap) / 2;
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, baseY - maxH - 260, baseY + 160, 0.55);

  // eixo
  const ak = U.easeOutCubic(local / 0.35);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(W / 2 - (W / 2 - 70) * ak, baseY); ctx.lineTo(W / 2 + (W / 2 - 70) * ak, baseY); ctx.stroke();

  const tops = [];
  bars.forEach((b, i) => {
    const x = x0 + i * (bw + gap);
    const lt = t - b.atOut;
    const k = lt < 0 ? 0.08 * ak : U.lerp(0.08, 1, U.easeOutBack(lt / 0.5));
    const h = maxH * b.value * k;
    const last = i === bars.length - 1;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 22;
    ctx.fillStyle = last ? U.COLORS.orange : U.COLORS.white;
    U.roundRect(ctx, x, baseY - h, bw, Math.max(10, h), 18); ctx.fill();
    ctx.restore();
    tops.push([x + bw / 2, baseY - h]);
    const size = U.fitFont(ctx, b.label, 900, 52, bw + 80, true);
    ctx.globalAlpha = fade * U.clamp(ak);
    X.strokedText(ctx, b.label, x + bw / 2, baseY + 70, U.font(900, size, true), U.COLORS.white, 9);
    if (lt >= 0) {
      ctx.globalAlpha = fade * U.clamp(lt / 0.3);
      ctx.font = U.font(900, 60, true); ctx.fillStyle = last ? '#111' : '#111'; ctx.textAlign = 'center';
      if (h > 120) ctx.fillText('↑', x + bw / 2, baseY - h + 80);
    }
    ctx.globalAlpha = fade;
  });

  // seta de tendência + selo
  if (seg.stampAtOut != null && t >= seg.stampAtOut) {
    const lt = t - seg.stampAtOut;
    const k = U.easeInOutCubic(lt / 0.35);
    const a = [x0 - 40, baseY - 60], b = [tops[tops.length - 1][0] + 150, tops[tops.length - 1][1] - 110];
    const hx = U.lerp(a[0], b[0], k), hy = U.lerp(a[1], b[1], k);
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(hx, hy); ctx.stroke();
    if (k > 0.9) {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      ctx.fillStyle = U.COLORS.white;
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-34, -30); ctx.lineTo(-34, 30); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const s = U.slam(lt - 0.2, 0.15, 1.8);
    if (lt > 0.2) {
      ctx.save();
      ctx.globalAlpha = fade * s.alpha;
      ctx.translate(W / 2, baseY - maxH - 150); ctx.rotate(-0.06); ctx.scale(s.scale, s.scale);
      X.chip(ctx, seg.stamp, 0, 0, 86, U.COLORS.orange, '#111', 50);
      ctx.restore();
    }
  }
  ctx.restore();
}
barGrowth.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 },
  ...(s.bars || []).map(b => ({ type: 'whoosh', t: b.atOut - 0.05, gain: 0.6 })),
  ...(s.stampAtOut != null ? [{ type: 'boom', t: s.stampAtOut + 0.2, gain: 0.85 }] : [])];
module.exports = barGrowth;
