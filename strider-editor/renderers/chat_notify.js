const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

// "Contem conosco, mandem mensagem, a gente permanece à disposição": balões de conversa empilham
// como num chat — antes de cada um aparecem os três pontinhos "digitando", e o último ganha o ✓✓.
function chatNotify(ctx, seg, t, W, H) {
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const msgs = seg.messages || [];
  const x0 = 70, gapY = 175, y0 = H * (seg.y || 0.5);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, y0 - 200, y0 + msgs.length * gapY + 160, 0.55);

  msgs.forEach((m, i) => {
    const lt = t - m.atOut;
    const typingStart = -0.45;
    if (lt < typingStart) return;
    const right = i % 2 === 1;
    const y = y0 + i * gapY;
    if (lt < 0) {
      // digitando…
      const bw = 170, bh = 96, bx = right ? W - x0 - bw : x0;
      ctx.fillStyle = 'rgba(30,30,30,0.92)'; U.roundRect(ctx, bx, y, bw, bh, 48); ctx.fill();
      for (let d = 0; d < 3; d++) {
        const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 10 - d * 0.9));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(bx + 50 + d * 35, y + bh / 2, 11, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    const k = U.easeOutBack(lt / 0.3);
    const size = U.fitFont(ctx, m.text, 900, 66, W - 2 * x0 - 120, true);
    ctx.font = U.font(900, size, true);
    const bw = ctx.measureText(m.text).width + 100 + (m.check ? 80 : 0), bh = size * 1.75;
    const bx = right ? W - x0 - bw : x0;
    const ox = right ? bx + bw : bx;
    ctx.save();
    ctx.translate(ox, y + bh); ctx.scale(k, k); ctx.translate(-ox, -(y + bh));
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 22;
    ctx.fillStyle = m.highlight ? U.COLORS.orange : U.COLORS.white;
    U.roundRect(ctx, bx, y, bw, bh, 40); ctx.fill();
    // rabicho
    ctx.beginPath();
    if (right) { ctx.moveTo(bx + bw - 30, y + bh - 10); ctx.lineTo(bx + bw + 24, y + bh + 14); ctx.lineTo(bx + bw - 60, y + bh); }
    else { ctx.moveTo(bx + 30, y + bh - 10); ctx.lineTo(bx - 24, y + bh + 14); ctx.lineTo(bx + 60, y + bh); }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(m.text, bx + 50, y + bh / 2 + 3);
    if (m.check) {
      const ck = U.clamp((lt - 0.35) / 0.2);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const cx = bx + bw - 90, cy = y + bh / 2;
      for (let j = 0; j < 2; j++) {
        if (ck <= j * 0.5) continue;
        const ox2 = j * 22;
        ctx.beginPath(); ctx.moveTo(cx + ox2, cy); ctx.lineTo(cx + ox2 + 14, cy + 14); ctx.lineTo(cx + ox2 + 40, cy - 16); ctx.stroke();
      }
    }
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  });
  ctx.restore();
}
chatNotify.sfx = s => (s.messages || []).flatMap((m, i, a) => [{ type: i === a.length - 1 ? 'chime' : 'tick', t: m.atOut, gain: i === a.length - 1 ? 1.4 : 2.8 }]);
module.exports = chatNotify;
