const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "Será que a captação é olhar pro tráfego… pensar no treinamento de vendas?": uma placa de
// encruzilhada sobe do chão; cada opção é uma seta que gira para fora do poste com um "?".
function signpost(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const cx = W / 2, base = H * 0.9, top = H * (seg.y || 0.5);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, top - 260, H, 0.55);

  // poste sobe
  const pk = U.easeOutBack(local / 0.35);
  const pTop = U.lerp(base, top, U.clamp(pk, 0, 1.05));
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(cx - 14, pTop, 28, base - pTop);
  ctx.fillStyle = U.COLORS.orange;
  ctx.beginPath(); ctx.arc(cx, pTop, 22, 0, Math.PI * 2); ctx.fill();

  // título
  if (seg.title) {
    const k = U.easeOutCubic((t - (seg.titleAtOut ?? seg.outStart)) / 0.3);
    ctx.globalAlpha = fade * k;
    const size = U.fitFont(ctx, seg.title, 900, 110, W * 0.9, true);
    X.strokedText(ctx, seg.title, cx, top - 70 + (1 - k) * 30, U.font(900, size, true), U.COLORS.white, 12);
    ctx.globalAlpha = fade;
  }

  // setas
  (seg.arrows || []).forEach((a, i) => {
    const lt = t - a.atOut;
    if (lt < 0) return;
    const dir = i % 2 === 0 ? -1 : 1;
    const y = top + 100 + i * 230;
    const k = U.easeOutBack(lt / 0.4);
    const lines = a.text.split('\n');
    const longest = lines.reduce((m, l) => l.length > m.length ? l : m, '');
    const size = U.fitFont(ctx, longest, 900, 64, W * 0.34, true);
    ctx.font = U.font(900, size, true);
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
    const aw = tw + 150, ah = Math.max(150, lines.length * size * 1.1 + 56);
    ctx.save();
    ctx.translate(cx, y);
    // gira para fora do poste (eixo vertical simulado com scale x)
    ctx.scale(dir * U.clamp(k, 0.02, 1.1), 1);
    ctx.rotate(-0.04 * Math.sin(lt * 3));
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24;
    ctx.fillStyle = a.highlight ? U.COLORS.orange : 'rgba(18,18,18,0.94)';
    ctx.beginPath();
    ctx.moveTo(10, -ah / 2); ctx.lineTo(aw - 60, -ah / 2); ctx.lineTo(aw, 0); ctx.lineTo(aw - 60, ah / 2); ctx.lineTo(10, ah / 2); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = a.highlight ? '#111' : U.COLORS.orange; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    // texto (sem espelhar)
    if (k > 0.5) {
      ctx.globalAlpha = fade * U.clamp((k - 0.5) * 2);
      const tx = cx + dir * (10 + (aw - 60) / 2);
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = a.highlight ? '#111' : U.COLORS.white;
      lines.forEach((l, li) => ctx.fillText(l, tx, y + 4 + (li - (lines.length - 1) / 2) * size * 1.1));
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = fade;
    }
  });
  ctx.restore();
}
signpost.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'boom', t: s.outStart + 0.3, gain: 0.5 },
  ...(s.arrows || []).map(a => ({ type: 'whoosh', t: a.atOut - 0.05, gain: 0.6 })), ...(s.arrows || []).map(a => ({ type: 'tick', t: a.atOut + 0.25, gain: 2.2 }))];
module.exports = signpost;
