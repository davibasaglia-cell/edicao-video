const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Mensagem de WhatsApp do paciente: "digitando…" com 3 pontos → balão abre com a frase, palavra-chave laranja treme.
function chatBubble(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  const local = t - seg.outStart;
  const y = H * (seg.y || 0.48);
  const slide = (1 - U.easeOutBack(local / 0.3)) * -260;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.translate(slide, 0);
  // avatar + nome
  const ax = W * 0.12, ay = y - 90;
  ctx.fillStyle = '#2A2A2A'; ctx.beginPath(); ctx.arc(ax, ay, 46, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = '#DDD'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(ax, ay - 10, 15, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(ax, ay + 34, 26, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.font = U.font(800, 38); F.strokeFill(ctx, seg.name || 'PACIENTE', ax + 70, ay - 6, U.COLORS.white, 8);
  ctx.font = U.font(600, 28); F.strokeFill(ctx, t < seg.msgAtOut ? 'digitando…' : 'online', ax + 70, ay + 32, '#BBBBBB', 6);

  const bx = W * 0.07, by = y;
  const opened = t >= seg.msgAtOut;
  ctx.font = U.font(800, 88);
  const parts = seg.parts; // [{text, hl}]
  const fullW = parts.reduce((a, p) => a + ctx.measureText(p.text).width, 0);
  const bwFull = Math.min(W * 0.86, fullW + 100), bh = 170;
  const k = opened ? U.easeOutBack((t - seg.msgAtOut) / 0.28) : 0;
  const bw = U.lerp(230, bwFull, k), h = U.lerp(120, bh, k);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(32,32,32,0.95)';
  U.roundRect(ctx, bx, by, bw, h, 40); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx + 6, by + 20); ctx.lineTo(bx - 26, by - 4); ctx.lineTo(bx + 46, by + 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (!opened) {
    for (let i = 0; i < 3; i++) {
      const b = Math.max(0, Math.sin((t * 7) - i * 0.9));
      ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * b})`;
      ctx.beginPath(); ctx.arc(bx + 70 + i * 46, by + h / 2 - b * 12, 14, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, h); ctx.clip();
    ctx.globalAlpha = env * U.clamp((t - seg.msgAtOut - 0.08) / 0.12);
    let x = bx + 50;
    const ty = by + h / 2 + 32;
    parts.forEach(p => {
      const pw = ctx.measureText(p.text).width;
      let dx = 0;
      if (p.hl) {
        const st = t - seg.msgAtOut - 0.2;
        dx = st > 0 ? Math.sin(st * 70) * 10 * Math.max(0, 1 - st / 0.35) : 0;
      }
      ctx.fillStyle = p.hl ? U.COLORS.orange : U.COLORS.white;
      ctx.fillText(p.text, x + dx, ty);
      x += pw;
    });
    ctx.restore();
    // hora + vistos
    ctx.globalAlpha = env * U.clamp((t - seg.msgAtOut - 0.2) / 0.15);
    ctx.font = U.font(600, 26); ctx.fillStyle = '#AAAAAA'; ctx.textAlign = 'right';
    ctx.fillText(seg.time || '14:32', bx + bw - 30, by + h + 44);
  }
  ctx.restore();
}
chatBubble.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.6 }, { type: 'tick', t: s.msgAtOut, gain: 2.8 }, { type: 'boom', t: s.msgAtOut + 0.2, gain: 0.5 }];
module.exports = chatBubble;
