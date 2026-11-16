const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// "Formulação de stories": a tela vira um story — barras de progresso segmentadas no topo enchendo,
// anel de story girando com um "+", e a palavra STORIES; o chip "ofertar mais" sobe como figurinha.
function storiesBar(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  ctx.save();
  ctx.globalAlpha = fade;

  // barras do topo
  const n = 4, gap = 10, bx = 30, bw = (W - 2 * bx - gap * (n - 1)) / n, by = 34;
  for (let i = 0; i < n; i++) {
    const k = U.clamp((local - i * dur / n) / (dur / n));
    const x = bx + i * (bw + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, x, by, bw, 9, 4.5); ctx.fill();
    if (k > 0) { ctx.fillStyle = U.COLORS.white; U.roundRect(ctx, x, by, Math.max(9, bw * k), 9, 4.5); ctx.fill(); }
  }
  // avatar + nome no topo, como no app
  ctx.fillStyle = U.COLORS.orange; ctx.beginPath(); ctx.arc(70, 104, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; X.person(ctx, 70, 110, 22, true);
  ctx.font = U.font(700, 32); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
  ctx.fillText(seg.handle || 'Clínica Áurea', 116, 104);
  ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';

  const cy = H * 0.56;
  X.scrim(ctx, W, cy - 220, H * 0.9, 0.55);
  // anel de story
  const rk = U.easeOutBack(local / 0.35);
  ctx.save();
  ctx.translate(W / 2, cy); ctx.scale(rk, rk);
  const g = ctx.createLinearGradient(-110, 110, 110, -110);
  g.addColorStop(0, '#F5A020'); g.addColorStop(0.5, '#FFD700'); g.addColorStop(1, '#F57A20');
  ctx.rotate(local * 1.6);
  ctx.strokeStyle = g; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(-local * 1.6);
  ctx.fillStyle = 'rgba(15,15,15,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 82, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = U.COLORS.white;
  ctx.fillRect(-36, -8, 72, 16); ctx.fillRect(-8, -36, 16, 72);
  ctx.restore();

  const sk = U.easeOutCubic((local - 0.15) / 0.3);
  if (sk > 0) {
    ctx.globalAlpha = fade * sk;
    ctx.font = U.font(800, 48); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.small, W / 2, cy + 180 + (1 - sk) * 30, 8);
    ctx.globalAlpha = fade;
  }
  if (t >= seg.bigAtOut) {
    const lt = t - seg.bigAtOut;
    const size = U.fitFont(ctx, seg.big, 900, 230, W * 0.9, true);
    // entra letra a letra subindo
    ctx.font = U.font(900, size, true);
    const chars = [...seg.big];
    const total = ctx.measureText(seg.big).width;
    let x = W / 2 - total / 2;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => {
      const k = U.easeOutBack((lt - i * 0.035) / 0.25);
      const cw = ctx.measureText(c).width;
      if (k > 0) {
        ctx.globalAlpha = fade * U.clamp(k);
        X.strokedText(ctx, c, x, cy + 200 + size * 0.85 + (1 - k) * 80, U.font(900, size, true), U.COLORS.orange, 13, 'left');
      }
      x += cw;
    });
    ctx.globalAlpha = fade;
  }
  if (seg.chipAtOut != null && t >= seg.chipAtOut) {
    const lt = t - seg.chipAtOut;
    const k = U.easeOutBack(lt / 0.3);
    ctx.save();
    ctx.translate(W / 2, H * 0.86 + (1 - k) * 120);
    ctx.rotate(-0.05 * k);
    ctx.globalAlpha = fade * U.clamp(lt / 0.1);
    X.chip(ctx, seg.chip + '  ↑', 0, 0, 56, U.COLORS.white, '#111', 40);
    ctx.restore();
  }
  ctx.restore();
}
storiesBar.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'boom', t: s.bigAtOut + 0.05, gain: 0.8 },
  ...(s.chipAtOut != null ? [{ type: 'tick', t: s.chipAtOut + 0.05, gain: 2.5 }] : [])];
module.exports = storiesBar;
