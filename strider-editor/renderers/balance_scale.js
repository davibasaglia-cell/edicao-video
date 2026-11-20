const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Balança da reciprocidade: presente cai no prato "RECEBO" (pesa), volta no "DEVOLVO" (equilibra) e cresce (MAIOR → pende).
function giftBox(ctx, cx, bottom, s, color) {
  const w = 110 * s, h = 90 * s;
  ctx.fillStyle = color; U.roundRect(ctx, cx - w / 2, bottom - h, w, h, 10 * s); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - w / 2, bottom - h, w, 18 * s);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx - 8 * s, bottom - h, 16 * s, h);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7 * s;
  ctx.beginPath(); ctx.ellipse(cx - 18 * s, bottom - h - 12 * s, 18 * s, 11 * s, -0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx + 18 * s, bottom - h - 12 * s, 18 * s, 11 * s, 0.4, 0, Math.PI * 2); ctx.stroke();
}

function balanceScale(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.18, 0.15);
  const local = t - seg.outStart;
  const cardW = W * 0.9, cardH = 720, x0 = (W - cardW) / 2, y0 = H * (seg.y || 0.37);
  const pop = U.popIn(local, seg.outEnd - seg.outStart);
  U.withTransform(ctx, W / 2, y0 + cardH / 2, pop.scale, env, () => {
    U.drawCard(ctx, x0, y0, cardW, cardH, 30);
    const px = W / 2, py = y0 + 200, arm = cardW * 0.33;
    // ângulo do braço (positivo = lado direito desce), com mola entre estados
    let ang = 0;
    ang = F.spring(t, seg.receiveAtOut + 0.25, ang, -0.2);
    if (t >= seg.returnAtOut + 0.25) ang = F.spring(t, seg.returnAtOut + 0.25, -0.2, 0);
    if (t >= seg.moreAtOut) ang = F.spring(t, seg.moreAtOut + 0.05, 0, 0.22, 7, 14);
    // poste
    ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(px - 8, py, 16, 380);
    ctx.beginPath(); ctx.moveTo(px - 90, py + 400); ctx.lineTo(px + 90, py + 400); ctx.lineTo(px + 60, py + 370); ctx.lineTo(px - 60, py + 370); ctx.closePath(); ctx.fill();
    // braço
    const lx = px - Math.cos(ang) * arm, ly = py - Math.sin(ang) * arm;
    const rx = px + Math.cos(ang) * arm, ry = py + Math.sin(ang) * arm;
    ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    ctx.fillStyle = U.COLORS.orange; ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.fill();
    // pratos
    const pan = (hx, hy, label, labelAt, box) => {
      const pyy = hy + 190;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - 95, pyy); ctx.moveTo(hx, hy); ctx.lineTo(hx + 95, pyy); ctx.stroke();
      if (box) box(hx, pyy);
      ctx.fillStyle = '#DDDDDD';
      ctx.beginPath(); ctx.moveTo(hx - 120, pyy); ctx.lineTo(hx + 120, pyy); ctx.quadraticCurveTo(hx + 90, pyy + 50, hx, pyy + 50); ctx.quadraticCurveTo(hx - 90, pyy + 50, hx - 120, pyy); ctx.fill();
      if (t >= labelAt) {
        const s = U.slam(t - labelAt, 0.14, 1.4);
        U.withTransform(ctx, hx, pyy + 120, s.scale, s.alpha * env, () => {
          ctx.font = U.font(800, 46); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
          U.fillSpaced(ctx, label, hx, pyy + 120, 5);
        });
      }
    };
    const fall = (at, hx, pyy) => { const k = U.clamp((t - at) / 0.3); return pyy - (1 - k * k) * 420; };
    pan(lx, ly, seg.left_label || 'RECEBO', seg.receiveAtOut, (hx, pyy) => {
      if (t < seg.receiveAtOut) return;
      ctx.save(); ctx.globalAlpha = env * U.clamp((t - seg.receiveAtOut) / 0.1);
      giftBox(ctx, hx, fall(seg.receiveAtOut, hx, pyy), 1, '#5A5A5A'); ctx.restore();
    });
    pan(rx, ry, seg.right_label || 'DEVOLVO', seg.returnAtOut, (hx, pyy) => {
      if (t < seg.returnAtOut) return;
      const grow = t >= seg.moreAtOut ? U.lerp(1, 1.55, U.easeOutBack((t - seg.moreAtOut) / 0.3)) : 1;
      ctx.save(); ctx.globalAlpha = env * U.clamp((t - seg.returnAtOut) / 0.1);
      giftBox(ctx, hx, fall(seg.returnAtOut, hx, pyy), grow, U.COLORS.orange); ctx.restore();
    });
    // rótulo superior
    ctx.textBaseline = 'alphabetic';
    const top = t >= seg.moreAtOut ? seg.more_text : t >= seg.equalAtOut ? seg.equal_text : null;
    if (top) {
      const at = t >= seg.moreAtOut ? seg.moreAtOut : seg.equalAtOut;
      const s = U.slam(t - at, 0.14, 1.35);
      const isMore = t >= seg.moreAtOut;
      U.withTransform(ctx, W / 2, y0 + 95, s.scale, s.alpha * env, () => {
        const size = U.fitFont(ctx, top, 900, isMore ? 92 : 64, cardW - 120, true);
        ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
        ctx.fillStyle = isMore ? U.COLORS.orange : U.COLORS.white;
        ctx.fillText(top, W / 2, y0 + 95 + size * 0.35);
      });
    }
  });
}
balanceScale.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.6 }, { type: 'tick', t: s.receiveAtOut + 0.3, gain: 2.6 },
  { type: 'tick', t: s.returnAtOut + 0.3, gain: 2.6 }, { type: 'whoosh', t: s.equalAtOut - 0.06, gain: 0.45 }, { type: 'boom', t: s.moreAtOut, gain: 0.8 }];
module.exports = balanceScale;
