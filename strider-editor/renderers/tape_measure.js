const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// "Personalizado / sob medida": uma fita métrica sai do estojo e se estende pela tela; cada adjetivo
// vira uma marcação na fita, e a palavra final bate embaixo em laranja.
function tapeMeasure(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const ty = H * (seg.y || 0.6);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, ty - 330, ty + 470, 0.6);

  // estojo
  const ek = U.easeOutBack(local / 0.25);
  const ex = 26 - (1 - ek) * 200, es = 150;
  ctx.fillStyle = '#1b1b1b'; U.roundRect(ctx, ex, ty - es / 2, es, es, 30); ctx.fill();
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 6; U.roundRect(ctx, ex + 3, ty - es / 2 + 3, es - 6, es - 6, 27); ctx.stroke();
  ctx.fillStyle = U.COLORS.orange; ctx.beginPath(); ctx.arc(ex + es / 2, ty, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(ex + es / 2, ty, 12, 0, Math.PI * 2); ctx.fill();

  // fita
  const x0 = ex + es - 6, th = 66;
  const tk = U.easeOutCubic((local - 0.15) / 0.7);
  const x1 = U.lerp(x0, W - 34, tk);
  if (x1 > x0 + 2) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16;
    ctx.fillStyle = U.COLORS.orange; ctx.fillRect(x0, ty - th / 2, x1 - x0, th);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, ty - th / 2, x1 - x0, th); ctx.clip();
    ctx.strokeStyle = '#141414'; ctx.fillStyle = '#141414'; ctx.lineWidth = 3;
    ctx.font = U.font(800, 22); ctx.textAlign = 'center';
    // a escala "corre" junto com a ponta, como se saísse do estojo
    const off = (x1 - x0) % 18;
    for (let i = 0, x = x0 + off; x < x1; x += 18, i++) {
      const n = Math.round((x1 - x) / 18);
      const big = n % 5 === 0;
      ctx.beginPath(); ctx.moveTo(x, ty - th / 2); ctx.lineTo(x, ty - th / 2 + (big ? 30 : 14)); ctx.stroke();
      if (big && n > 0) ctx.fillText(String(n / 5), x, ty + 24);
    }
    ctx.restore();
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(x1 - 4, ty - th / 2 - 12, 14, th + 24);
  }

  // marcações
  const markX = [W * 0.36, W * 0.68];
  (seg.marks || []).forEach((m, i) => {
    const lt = t - m.atOut;
    if (lt < 0) return;
    const mx = markX[i % markX.length];
    const dk = U.easeOutCubic(lt / 0.18);
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(mx, ty - th / 2 - 8); ctx.lineTo(mx, ty - th / 2 - 8 - 70 * dk); ctx.stroke();
    ctx.fillStyle = U.COLORS.white;
    ctx.beginPath(); ctx.moveTo(mx - 12, ty - th / 2 - 4); ctx.lineTo(mx + 12, ty - th / 2 - 4); ctx.lineTo(mx, ty - th / 2 + 12); ctx.closePath(); ctx.fill();
    const s = U.popIn(lt, 99, 99, { from: 0.6 });
    U.withTransform(ctx, mx, ty - 150, s.scale, s.alpha * fade, () => {
      const size = U.fitFont(ctx, m.text, 900, 56, W * 0.34, true);
      X.strokedText(ctx, m.text, mx, ty - 128, U.font(900, size, true), U.COLORS.white, 9);
    });
  });

  // palavra final
  if (seg.bigAtOut != null && t >= seg.bigAtOut) {
    const s = U.slam(t - seg.bigAtOut, 0.15, 1.6);
    const size = U.fitFont(ctx, seg.big, 900, 170, W * 0.92, true);
    const shake = Math.max(0, 1 - (t - seg.bigAtOut) / 0.25) * 10 * Math.sin((t - seg.bigAtOut) * 90);
    U.withTransform(ctx, W / 2, ty + 200, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, W / 2 + shake, ty + 250, U.font(900, size, true), U.COLORS.orange, 14);
    });
  }
  if (seg.small && seg.smallAtOut != null && t >= seg.smallAtOut) {
    const k = U.easeOutCubic((t - seg.smallAtOut) / 0.25);
    ctx.globalAlpha = fade * k;
    ctx.font = U.font(800, 52); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.small, W / 2, ty + 350 + (1 - k) * 40, 8);
  }
  ctx.restore();
}
tapeMeasure.sfx = s => [{ type: 'whoosh', t: s.outStart, gain: 0.8 },
  ...(s.marks || []).map(m => ({ type: 'tick', t: m.atOut, gain: 2.5 })),
  { type: 'boom', t: s.bigAtOut, gain: 0.85 }, ...(s.smallAtOut ? [{ type: 'whoosh', t: s.smallAtOut - 0.08, gain: 0.5 }] : [])];
module.exports = tapeMeasure;
