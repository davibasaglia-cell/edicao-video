const U = require('../utils/canvas_utils');

// Encerramento: barra de "absorção" enche conforme a fala e um carimbo crava a palavra final.
function absorbStamp(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const stamped = t >= seg.stampAtOut;
  const st = t - seg.stampAtOut;
  const shake = stamped ? Math.sin(st * 95) * 16 * Math.max(0, 1 - st / 0.28) : 0;
  ctx.save();
  ctx.translate(shake, shake * 0.4);
  // vinheta escura
  const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.12, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.globalAlpha = U.clamp(local / 0.25);
  ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
  const barW = W * 0.78, barX = (W - barW) / 2, barY = H * 0.36, barH = 44;
  const a1 = U.clamp((t - seg.barAtOut) / 0.2);
  if (t >= seg.barAtOut) {
    ctx.globalAlpha = a1;
    ctx.font = U.font(800, 40); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.bar_label, W / 2, barY - 34, 6);
    const k = U.easeInOutCubic((t - seg.barAtOut) / (seg.barEndAtOut - seg.barAtOut));
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; U.roundRect(ctx, barX, barY, barW, barH, barH / 2); ctx.fill();
    ctx.save(); ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 24;
    ctx.fillStyle = U.COLORS.orange; U.roundRect(ctx, barX, barY, Math.max(barH, barW * k), barH, barH / 2); ctx.fill();
    ctx.restore();
    ctx.font = U.font(900, 34, true); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(k * 100)}%`, barX + barW, barY + barH + 50);
    ctx.globalAlpha = 1;
  }
  if (t >= seg.lineAtOut) {
    const s = U.slam(t - seg.lineAtOut, 0.14, 1.3);
    U.withTransform(ctx, W / 2, H * 0.47, s.scale, s.alpha, () => {
      ctx.font = U.font(900, U.fitFont(ctx, seg.line, 900, 84, W * 0.86, false, 4)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.line, W / 2, H * 0.48, 4);
    });
  }
  if (stamped) {
    const k = st / 0.17;
    const sc = U.lerp(2.6, 1, U.easeOutCubic(k));
    ctx.save();
    ctx.globalAlpha = U.clamp(k * 2);
    ctx.translate(W / 2, H * 0.585); ctx.rotate(-0.12); ctx.scale(sc, sc);
    const size = U.fitFont(ctx, seg.stamp, 900, 210, W * 0.72, true);
    ctx.font = U.font(900, size, true);
    const tw = ctx.measureText(seg.stamp).width + 100, th = size * 1.25;
    ctx.fillStyle = 'rgba(10,10,10,0.55)'; U.roundRect(ctx, -tw / 2, -th / 2, tw, th, 24); ctx.fill();
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 14; U.roundRect(ctx, -tw / 2, -th / 2, tw, th, 24); ctx.stroke();
    ctx.lineWidth = 5; U.roundRect(ctx, -tw / 2 + 20, -th / 2 + 20, tw - 40, th - 40, 16); ctx.stroke();
    ctx.fillStyle = U.COLORS.orange; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(seg.stamp, 0, size * 0.06);
    // respingos de tinta do impacto
    if (st < 0.5) {
      ctx.globalAlpha = 1 - st / 0.5;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, d = tw * 0.5 + 30 + 140 * U.easeOutCubic(st / 0.4);
        ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.45, 7 - (i % 3) * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}
absorbStamp.sfx = s => [{ type: 'whoosh', t: s.barAtOut - 0.1, gain: 0.7 }, { type: 'whoosh', t: s.lineAtOut - 0.08, gain: 0.55 },
  { type: 'boom', t: s.stampAtOut, gain: 1 }, { type: 'chime', t: s.stampAtOut + 0.05, gain: 0.8 }];
module.exports = absorbStamp;
