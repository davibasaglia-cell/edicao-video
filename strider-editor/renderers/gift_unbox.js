const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Presente cai e amassa no chão (squash) → na palavra a tampa voa, raios + confete, e a palavra sobe de dentro da caixa.
function giftUnbox(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.1, 0.15);
  F.vignette(ctx, W, H, env * 0.85, 0.55);
  const local = t - seg.outStart;
  const cx = W / 2, floor = H * (seg.y || 0.66);
  const bw = 300, bh = 230;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  if (seg.small) {
    const s = U.slam(local, 0.14, 1.3);
    U.withTransform(ctx, W / 2, floor - 700, s.scale, s.alpha, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.small, 800, 60, W * 0.86, false, 8)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, floor - 690, 8);
    });
  }
  // queda + squash
  const fk = U.clamp(local / 0.32);
  const by = floor - (1 - fk * fk) * 900;
  const landed = local > 0.32;
  const sq = landed ? 1 + 0.18 * Math.exp(-12 * (local - 0.32)) * Math.cos(30 * (local - 0.32)) : 1;
  const opened = t >= seg.openAtOut;
  const ok = opened ? (t - seg.openAtOut) : 0;
  // raios
  if (opened) {
    ctx.save();
    ctx.globalAlpha = env * U.clamp(ok / 0.15) * 0.55;
    ctx.translate(cx, floor - bh);
    ctx.rotate(ok * 0.6);
    ctx.fillStyle = U.COLORS.orange;
    for (let i = 0; i < 14; i++) {
      ctx.rotate(Math.PI * 2 / 14);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -900); ctx.lineTo(40, -900); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(cx, by); ctx.scale(1 / sq, sq);
  // corpo
  ctx.fillStyle = '#F2F2F0'; U.roundRect(ctx, -bw / 2, -bh, bw, bh, 14); ctx.fill();
  ctx.fillStyle = U.COLORS.orange; ctx.fillRect(-22, -bh, 44, bh);
  ctx.restore();
  // tampa
  const lidW = bw + 40, lidH = 70;
  ctx.save();
  let lx = cx, ly = by * 1 - bh * sq - lidH / 2, rot = 0;
  if (opened) { lx += ok * 700; ly -= ok * 1400 - 2200 * ok * ok; rot = ok * 6; }
  ctx.translate(lx, ly); ctx.rotate(rot);
  ctx.fillStyle = '#FFFFFF'; U.roundRect(ctx, -lidW / 2, -lidH / 2, lidW, lidH, 12); ctx.fill();
  ctx.fillStyle = U.COLORS.orange; ctx.fillRect(-22, -lidH / 2, 44, lidH);
  ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.ellipse(-46, -lidH / 2 - 30, 46, 28, -0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(46, -lidH / 2 - 30, 46, 28, 0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  if (opened) {
    // confete
    const rnd = F.prng(13);
    for (let i = 0; i < 46; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.2, v = 900 + rnd() * 900;
      const px = cx + Math.cos(a) * v * ok, py = floor - bh + Math.sin(a) * v * ok + 1600 * ok * ok;
      ctx.save(); ctx.globalAlpha = env * U.clamp(1 - ok / 1.4);
      ctx.translate(px, py); ctx.rotate(ok * 10 + i);
      ctx.fillStyle = i % 3 === 0 ? U.COLORS.white : U.COLORS.orange;
      ctx.fillRect(-9, -5, 18, 10);
      ctx.restore();
    }
    // palavra sobe de dentro da caixa
    const k = U.easeOutBack(ok / 0.35);
    const size = U.fitFont(ctx, seg.word, 900, 230, W * 0.9, true);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, floor - bh + 10); ctx.clip();
    ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
    F.strokeFill(ctx, seg.word, cx, U.lerp(floor - bh + size, floor - bh - 120, k), U.COLORS.orange, 14);
    ctx.restore();
  }
  ctx.restore();
}
giftUnbox.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.05, gain: 0.7 }, { type: 'tick', t: s.outStart + 0.32, gain: 2.5 },
  { type: 'boom', t: s.openAtOut, gain: 0.9 }, { type: 'chime', t: s.openAtOut + 0.05, gain: 0.7 }];
module.exports = giftUnbox;
