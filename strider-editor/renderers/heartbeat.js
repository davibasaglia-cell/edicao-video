const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Linha de batimento (ECG) atravessa a tela; o pico grande cai na palavra-chave.
function ecgPoints(W, yb, spikeX) {
  const pts = [];
  for (let x = 0; x <= W; x += 4) {
    let y = 0;
    const beat = (cx, amp) => {
      const d = x - cx;
      if (d > -60 && d < -40) y -= amp * 0.12 * Math.sin(Math.PI * (d + 60) / 20);
      if (d >= -12 && d < 0) y += amp * 0.18 * ((d + 12) / 12);
      if (d >= 0 && d < 10) y -= amp * (d / 10);
      if (d >= 10 && d < 22) y -= amp * (1 - (d - 10) / 12) - amp * 0.3 * ((d - 10) / 12);
      if (d >= 22 && d < 34) y += amp * 0.3 * (1 - (d - 22) / 12);
      if (d > 60 && d < 110) y -= amp * 0.16 * Math.sin(Math.PI * (d - 60) / 50);
    };
    beat(spikeX - 330, 70);
    beat(spikeX, 300);
    beat(spikeX + 330, 70);
    pts.push([x, yb + y]);
  }
  return pts;
}

function heartbeat(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = U.clamp((dur - local) / 0.15) * U.clamp(local / 0.1);
  const yb = H * (seg.y || 0.5);
  const spikeX = W * 0.55;
  const sAt = seg.spikeAtOut;
  const headX = t < sAt
    ? U.lerp(0, spikeX - 10, U.clamp(local / Math.max(0.2, sAt - seg.outStart)))
    : U.lerp(spikeX - 10, W, U.easeOutCubic((t - sAt) / 0.5));
  const pts = ecgPoints(W, yb, spikeX);
  ctx.save();
  ctx.globalAlpha = fade;
  const g = ctx.createLinearGradient(0, yb - 420, 0, yb + 420);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(0,0,0,0.5)'); g.addColorStop(0.7, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, yb - 420, W, 840);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 28;
  ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 9;
  const head = F.partialPolyline(ctx, pts.filter(p => p[0] <= headX + 4), 1);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = U.COLORS.white;
  ctx.beginPath(); ctx.arc(head[0], head[1], 12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textBaseline = 'alphabetic';
  if (seg.small) {
    const s = U.slam(t - (seg.smallAtOut ?? seg.outStart), 0.14, 1.25);
    U.withTransform(ctx, W / 2, yb - 360, s.scale, s.alpha, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.small, 800, 58, W * 0.85, false, 6));
      ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, yb - 340, 6);
    });
  }
  if (t >= sAt) {
    const pulse = 1 + 0.06 * Math.max(0, Math.sin((t - sAt) * Math.PI * 2 * 1.2)) ** 6;
    const s = U.slam(t - sAt, 0.15, 1.7);
    const size = U.fitFont(ctx, seg.big, 900, 250, W * 0.9, true);
    U.withTransform(ctx, W / 2, yb + 250, s.scale * pulse, s.alpha, () => {
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 12; ctx.strokeText(seg.big, W / 2, yb + 330);
      ctx.fillStyle = U.COLORS.orange; ctx.fillText(seg.big, W / 2, yb + 330);
    });
  }
  if (seg.small2 && t >= seg.small2AtOut) {
    const s = U.slam(t - seg.small2AtOut, 0.12, 1.3);
    U.withTransform(ctx, W / 2, yb + 420, s.scale, s.alpha, () => {
      ctx.font = U.font(800, 60); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small2, W / 2, yb + 430, 8);
    });
  }
  ctx.restore();
}
heartbeat.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 }, { type: 'boom', t: s.spikeAtOut, gain: 0.9 }, ...(s.small2AtOut ? [{ type: 'tick', t: s.small2AtOut, gain: 2.5 }] : [])];
module.exports = heartbeat;
