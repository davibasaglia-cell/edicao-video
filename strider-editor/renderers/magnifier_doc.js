const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Folha de estudo sobe da base; uma lupa varre as linhas (conteúdo ampliado dentro da lente); selos entram presos na folha.
function drawPaper(ctx, x, y, w, h, title) {
  ctx.fillStyle = '#F2F2F0'; U.roundRect(ctx, x, y, w, h, 18); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = U.font(900, 74, true); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + 60, y + 120);
  ctx.fillStyle = U.COLORS.orange; ctx.fillRect(x + 60, y + 145, 140, 10);
  const rnd = F.prng(5);
  for (let i = 0; i < 9; i++) {
    const ly = y + 210 + i * 46;
    ctx.fillStyle = i === 4 ? 'rgba(245,160,32,0.55)' : '#C9C9C6';
    ctx.fillRect(x + 60, ly, (w - 120) * (0.6 + 0.4 * rnd()), 18);
  }
  // mini-gráfico
  ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x + w - 240, y + 120); ctx.lineTo(x + w - 190, y + 90); ctx.lineTo(x + w - 140, y + 104); ctx.lineTo(x + w - 70, y + 50); ctx.stroke();
}

function magnifierDoc(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.15, 0.15);
  const local = t - seg.outStart;
  const w = W * 0.78, h = 680, x = (W - w) / 2, y0 = H * (seg.y || 0.38);
  const y = y0 + (1 - U.easeOutCubic(local / 0.4)) * 900;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.save();
  ctx.translate(W / 2, y + h / 2); ctx.rotate(-0.035); ctx.translate(-W / 2, -(y + h / 2));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#F2F2F0'; U.roundRect(ctx, x, y, w, h, 18); ctx.fill(); ctx.restore();
  drawPaper(ctx, x, y, w, h, seg.title || 'ESTUDO');
  // lente
  const sa = seg.sweepAtOut ?? seg.outStart + 0.3;
  const sk = U.clamp((t - sa) / (seg.sweep_dur || 2.2));
  const lx = x + 140 + (w - 280) * (0.5 - 0.5 * Math.cos(sk * Math.PI * 2)) , ly = y + 250 + sk * 300;
  if (t >= sa) {
    const r = 110;
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.clip();
    ctx.translate(lx, ly); ctx.scale(1.7, 1.7); ctx.translate(-lx, -ly);
    drawPaper(ctx, x, y, w, h, seg.title || 'ESTUDO');
    ctx.restore();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(lx + r * 0.72, ly + r * 0.72); ctx.lineTo(lx + r * 1.5, ly + r * 1.5); ctx.stroke();
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  // selos
  (seg.tags || []).forEach((tg, i) => {
    if (t < tg.atOut) return;
    const s = U.slam(t - tg.atOut, 0.15, 1.8);
    const tx = i % 2 ? x + w - 40 : x + 60, ty = y + h - 40 + i * 0;
    const cx = i % 2 ? tx - 150 : tx + 150, cy = ty - 10 - i * 0;
    U.withTransform(ctx, cx, cy, s.scale, s.alpha, () => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(i % 2 ? 0.08 : -0.08);
      ctx.font = U.font(900, 46, true);
      const tw = ctx.measureText(tg.text).width + 60;
      ctx.fillStyle = i === 0 ? U.COLORS.orange : '#111';
      U.roundRect(ctx, -tw / 2, -42, tw, 84, 14); ctx.fill();
      ctx.fillStyle = i === 0 ? '#111' : U.COLORS.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tg.text, 0, 3);
      ctx.restore();
    });
  });
  ctx.restore();
}
magnifierDoc.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 }, ...(s.tags || []).map(tg => ({ type: 'boom', t: tg.atOut, gain: 0.5 }))];
module.exports = magnifierDoc;
