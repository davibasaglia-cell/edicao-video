const U = require('../utils/canvas_utils');

function drawCakeIcon(ctx, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 9 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // prato
  ctx.beginPath(); ctx.moveTo(cx - 95 * s, cy + 70 * s); ctx.lineTo(cx + 95 * s, cy + 70 * s); ctx.stroke();
  // andar de baixo
  U.roundRect(ctx, cx - 75 * s, cy + 10 * s, 150 * s, 60 * s, 10 * s); ctx.stroke();
  // andar de cima
  U.roundRect(ctx, cx - 50 * s, cy - 40 * s, 100 * s, 50 * s, 10 * s); ctx.stroke();
  // cobertura
  ctx.beginPath(); ctx.moveTo(cx - 75 * s, cy + 32 * s);
  for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(cx - 60 * s + i * 30 * s, cy + 48 * s, cx - 45 * s + i * 30 * s, cy + 32 * s);
  ctx.stroke();
  // vela
  ctx.beginPath(); ctx.moveTo(cx, cy - 40 * s); ctx.lineTo(cx, cy - 78 * s); ctx.stroke();
  ctx.fillStyle = U.COLORS.orange;
  ctx.beginPath(); ctx.moveTo(cx, cy - 118 * s);
  ctx.quadraticCurveTo(cx + 18 * s, cy - 94 * s, cx, cy - 84 * s);
  ctx.quadraticCurveTo(cx - 18 * s, cy - 94 * s, cx, cy - 118 * s); ctx.fill();
  ctx.restore();
}

// Encerramento: overlay dourado + ícone + texto branco + palavra laranja gigante.
module.exports = function closer(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const ov = U.clamp(local / 0.2);
  ctx.save();
  ctx.globalAlpha = ov;
  ctx.fillStyle = seg.overlay_color || 'rgba(200,140,20,0.35)';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.15, W / 2, H * 0.5, H * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const cy = H * 0.5;
  const iconIn = U.popIn(local, 99, null, { from: 0.6 });
  U.withTransform(ctx, W / 2, cy - 330, iconIn.scale, iconIn.alpha, () => drawCakeIcon(ctx, W / 2, cy - 330, 1.25));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30;
  ctx.textBaseline = 'alphabetic';
  const s1 = U.slam(local - 0.05, 0.14, 1.3);
  if (local >= 0.05) U.withTransform(ctx, W / 2, cy - 90, s1.scale, s1.alpha, () => {
    const size = U.fitFont(ctx, seg.line1, 900, 96, W * 0.85, false, 4);
    ctx.font = U.font(900, size);
    ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.line1, W / 2, cy - 60, 4);
  });
  const at = seg.line2AtOut != null ? seg.line2AtOut : seg.outStart + 0.4;
  if (t >= at) {
    const s2 = U.slam(t - at, 0.16, 1.7);
    const size = U.fitFont(ctx, seg.line2, 900, 380, W * 0.9, true);
    U.withTransform(ctx, W / 2, cy + 130, s2.scale, s2.alpha, () => {
      ctx.font = U.font(900, size, true);
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(20,10,0,0.75)'; ctx.lineWidth = 14;
      ctx.strokeText(seg.line2, W / 2, cy + 260);
      ctx.fillStyle = U.COLORS.orange;
      ctx.fillText(seg.line2, W / 2, cy + 260);
    });
  }
  ctx.restore();
};
