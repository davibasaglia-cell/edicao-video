const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// "+ A MAIS" desliza; depois uma faixa laranja com pontas dobradas desenrola do centro e revela a palavra; brilhos estouram.
function star4(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
}

function ribbonBanner(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.12, 0.15);
  F.vignette(ctx, W, H, env * 0.9);
  const cy = H * (seg.y || 0.5);
  ctx.save();
  ctx.globalAlpha = env;
  ctx.textBaseline = 'alphabetic';
  if (seg.small && t >= (seg.smallAtOut ?? seg.outStart)) {
    const s = U.slam(t - (seg.smallAtOut ?? seg.outStart), 0.14, 1.3);
    U.withTransform(ctx, W / 2, cy - 330, s.scale, s.alpha, () => {
      ctx.font = U.font(800, 58); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, W / 2, cy - 310, 9);
    });
  }
  if (seg.plus && t >= seg.plusAtOut) {
    const k = U.easeOutCubic((t - seg.plusAtOut) / 0.3);
    const banner = t >= seg.bannerAtOut ? U.easeInOutCubic((t - seg.bannerAtOut) / 0.25) : 0;
    ctx.save();
    ctx.globalAlpha = env * U.clamp(k * 2);
    const size = U.fitFont(ctx, seg.plus, 900, 150, W * 0.8, true);
    ctx.font = U.font(900, size, true); ctx.textAlign = 'center';
    F.strokeFill(ctx, seg.plus, W / 2 + (1 - k) * 500, cy - 150 - banner * 40, U.COLORS.white, 12);
    ctx.restore();
  }
  if (t >= seg.bannerAtOut) {
    const bt = t - seg.bannerAtOut;
    const k = U.easeOutBack(bt / 0.4);
    const size = U.fitFont(ctx, seg.word, 900, 190, W * 0.68, true);
    const bw = W * 0.8 * U.clamp(k, 0, 1.1), bh = size * 1.25, by = cy + 40;
    // pontas dobradas
    const tail = (dir) => {
      const ex = W / 2 + dir * bw / 2;
      ctx.fillStyle = '#B87412';
      ctx.beginPath(); ctx.moveTo(ex, by + 30); ctx.lineTo(ex + dir * 110, by + 30); ctx.lineTo(ex + dir * 70, by + 30 + bh / 2); ctx.lineTo(ex + dir * 110, by + 30 + bh); ctx.lineTo(ex, by + 30 + bh); ctx.closePath(); ctx.fill();
    };
    if (k > 0.3) { tail(-1); tail(1); }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30;
    ctx.fillStyle = U.COLORS.orange;
    ctx.fillRect(W / 2 - bw / 2, by, bw, bh);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(W / 2 - bw / 2, by, bw, bh); ctx.clip();
    ctx.font = U.font(900, size, true); ctx.textAlign = 'center'; ctx.fillStyle = '#111';
    ctx.fillText(seg.word, W / 2, by + bh / 2 + size * 0.36);
    ctx.restore();
    // brilhos
    if (bt < 0.9) {
      const rnd = F.prng(21);
      ctx.fillStyle = U.COLORS.white;
      for (let i = 0; i < 10; i++) {
        const a = rnd() * Math.PI * 2, d = 300 + rnd() * 250;
        const p = U.easeOutCubic(bt / 0.6);
        ctx.globalAlpha = env * (1 - bt / 0.9);
        star4(ctx, W / 2 + Math.cos(a) * d * p, by + bh / 2 + Math.sin(a) * d * 0.6 * p, 18 + rnd() * 20);
      }
    }
  }
  ctx.restore();
}
ribbonBanner.sfx = s => [{ type: 'whoosh', t: (s.smallAtOut ?? s.outStart) - 0.1, gain: 0.5 }, ...(s.plusAtOut ? [{ type: 'whoosh', t: s.plusAtOut - 0.06, gain: 0.6 }] : []),
  { type: 'boom', t: s.bannerAtOut + 0.05, gain: 0.9 }, { type: 'chime', t: s.bannerAtOut + 0.1, gain: 0.6 }];
module.exports = ribbonBanner;
