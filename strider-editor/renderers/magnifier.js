const { createCanvas } = require('canvas');
const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "Ampliar essa visão": a frase aparece pequena e espaçada; uma lupa entra e varre a frase,
// ampliando (1,35×, em laranja) o que passa por baixo, desce e assenta sobre a palavra final.
function magnifier(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const cy = H * (seg.y || 0.62);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 360, cy + 380, 0.6);

  // duas linhas: "AMPLIAR A" em cima, a palavra final embaixo (centralizada, onde a lupa assenta)
  const words = seg.text.split(' ');
  const last = words.pop(), first = words.join(' ');
  const s1 = 74, s2 = 92;
  const y1 = cy - 120, y2 = cy + 80;
  const drawText = (c, color) => {
    c.textBaseline = 'alphabetic';
    c.font = U.font(900, s1, true); c.fillStyle = color; U.fillSpaced(c, first, W / 2, y1 + s1 * 0.35, 6);
    c.font = U.font(900, s2, true); c.fillStyle = color; U.fillSpaced(c, last, W / 2, y2 + s2 * 0.35, 6);
  };
  const tk = U.easeOutCubic(local / 0.3);
  ctx.globalAlpha = fade * tk;
  drawText(ctx, 'rgba(255,255,255,0.92)');
  ctx.globalAlpha = fade;

  // trajeto da lupa: entra pela esquerda na linha 1, varre a linha, desce e assenta na palavra final
  ctx.font = U.font(900, s1, true);
  const w1 = ctx.measureText(first).width + 6 * (first.length - 1);
  const P0 = [-220, y1], P1 = [W / 2 - w1 / 2 + 60, y1], P2 = [W / 2 + w1 / 2 - 60, y1], P3 = [W / 2, y2];
  const a = seg.startWordAtOut ?? seg.outStart + 0.3, b = seg.settleAtOut ?? a + 1;
  const L = (p, q, k) => [U.lerp(p[0], q[0], k), U.lerp(p[1], q[1], k)];
  let pos;
  if (t < a) pos = L(P0, P1, U.easeOutCubic((t - seg.outStart) / Math.max(0.2, a - seg.outStart)));
  else {
    const k = U.clamp((t - a) / Math.max(0.3, b - a));
    pos = k < 0.6 ? L(P1, P2, U.easeInOutCubic(k / 0.6)) : L(P2, P3, U.easeInOutCubic((k - 0.6) / 0.4));
  }
  const settled = t >= b;
  const bob = settled ? 0 : Math.sin(local * 7) * 8;
  const lx = pos[0], ly = pos[1] + bob;
  const lr = U.lerp(170, 235, U.easeOutBack(U.clamp((t - b) / 0.3)));

  // conteúdo ampliado dentro da lente
  const Z = 1.35;
  const off = createCanvas(Math.ceil(lr * 2), Math.ceil(lr * 2)), o = off.getContext('2d');
  o.fillStyle = 'rgba(15,15,15,0.92)'; o.fillRect(0, 0, lr * 2, lr * 2);
  o.translate(lr, lr); o.scale(Z, Z); o.translate(-lx, -ly);
  drawText(o, U.COLORS.orange);
  ctx.save();
  ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(off, lx - lr, ly - lr);
  // reflexo
  const g = ctx.createLinearGradient(lx - lr, ly - lr, lx + lr, ly + lr);
  g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  ctx.restore();
  // aro + cabo
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
  ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = U.COLORS.orange;
  const ang = Math.PI / 4;
  ctx.beginPath(); ctx.moveTo(lx + Math.cos(ang) * (lr + 14), ly + Math.sin(ang) * (lr + 14));
  ctx.lineTo(lx + Math.cos(ang) * (lr + 150), ly + Math.sin(ang) * (lr + 150)); ctx.stroke();
  ctx.restore();
  if (settled) {
    const k = U.clamp((t - b) / 0.35);
    ctx.globalAlpha = fade * (1 - k);
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(lx, ly, lr + 20 + k * 80, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
magnifier.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.05, gain: 0.7 }, { type: 'whoosh', t: (s.startWordAtOut ?? s.outStart) + 0.1, gain: 0.5 },
  { type: 'boom', t: s.settleAtOut, gain: 0.7 }];
module.exports = magnifier;
