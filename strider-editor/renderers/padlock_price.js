const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

function tag(ctx, cx, cy, s) {
  // etiqueta de preço com furo
  const w = 420 * s, h = 230 * s;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 70 * s, cy - h / 2);
  ctx.lineTo(cx + w / 2 - 24 * s, cy - h / 2);
  ctx.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + 24 * s);
  ctx.lineTo(cx + w / 2, cy + h / 2 - 24 * s);
  ctx.quadraticCurveTo(cx + w / 2, cy + h / 2, cx + w / 2 - 24 * s, cy + h / 2);
  ctx.lineTo(cx - w / 2 + 70 * s, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
}

// "Mexendo nos valores… bloqueios de aumentar preços": etiqueta de preço com seta tentando subir;
// na palavra "bloqueios" um cadeado cai e trava na etiqueta (clique + tremida) e a seta para.
function padlockPrice(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const env = U.popIn(local, dur, dur, { from: 0.6, inDur: 0.3 });
  const cx = W / 2, cy = H * (seg.y || 0.6);
  const lt = t - seg.lockAtOut;
  const locked = lt >= 0;
  const shake = locked ? Math.sin(lt * 60) * 10 * Math.max(0, 1 - lt / 0.35) : 0;
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 420, cy + 520, 0.55);

  // rótulo de cima
  const tk = U.easeOutCubic((local - 0.15) / 0.3);
  ctx.globalAlpha = fade * tk;
  const ts = U.fitFont(ctx, seg.top, 800, 46, W * 0.9, false, 5);
  ctx.font = U.font(800, ts); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
  U.fillSpaced(ctx, seg.top, cx, cy - 300 + (1 - tk) * 30, 5);
  ctx.globalAlpha = fade;

  // etiqueta + seta
  U.withTransform(ctx, cx + shake, cy, env.scale, env.alpha * fade, () => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30;
    ctx.fillStyle = locked ? '#3a3a3a' : U.COLORS.orange;
    tag(ctx, cx, cy, 1); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 130, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.font = U.font(900, 120, true); ctx.fillStyle = locked ? '#9a9a9a' : '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('R$', cx + 10, cy + 6);
    // seta que tenta subir
    const tries = locked ? 0 : Math.abs(Math.sin(local * 5)) * 60;
    const ax = cx + 150, ay = cy - 40 - tries;
    ctx.fillStyle = locked ? '#777' : '#111';
    ctx.fillRect(ax - 14, ay, 28, 90);
    ctx.beginPath(); ctx.moveTo(ax - 40, ay + 4); ctx.lineTo(ax, ay - 46); ctx.lineTo(ax + 40, ay + 4); ctx.closePath(); ctx.fill();
    ctx.textBaseline = 'alphabetic';
  });

  // cadeado caindo
  if (lt > -0.25) {
    const k = U.clamp((lt + 0.25) / 0.25);
    const ly = cy - 40 - (1 - k * k) * 700;
    const lx = cx + 215 + shake;
    ctx.save();
    ctx.globalAlpha = fade * U.clamp(k * 3);
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24;
    // haste (fecha ao travar)
    const open = locked ? Math.max(0, 1 - lt / 0.08) : 1;
    ctx.strokeStyle = '#d9d9d9'; ctx.lineWidth = 26; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(lx, ly - 30 - open * 40, 62, Math.PI, 0); ctx.lineTo(lx + 62, ly + 10 - open * 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx - 62, ly - 30 - open * 40); ctx.lineTo(lx - 62, ly + 10); ctx.stroke();
    ctx.fillStyle = U.COLORS.white; U.roundRect(ctx, lx - 100, ly, 200, 170, 26); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(lx, ly + 70, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(lx - 9, ly + 80, 18, 50);
    ctx.restore();
  }

  if (locked) {
    const s = U.slam(lt, 0.15, 1.7);
    const size = U.fitFont(ctx, seg.big, 900, 220, W * 0.9, true);
    U.withTransform(ctx, cx, cy + 300, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.big, cx, cy + 220 + size * 0.7, U.font(900, size, true), U.COLORS.orange, 14);
    });
    if (seg.small && seg.smallAtOut != null && t >= seg.smallAtOut) {
      const k = U.easeOutCubic((t - seg.smallAtOut) / 0.25);
      ctx.globalAlpha = fade * k;
      const ss = U.fitFont(ctx, seg.small, 800, 52, W * 0.9, false, 6);
      ctx.font = U.font(800, ss); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.small, cx, cy + 250 + size * 0.7 + 60 + (1 - k) * 30, 6);
    }
  }
  ctx.restore();
}
padlockPrice.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.7 }, { type: 'whoosh', t: s.lockAtOut - 0.22, gain: 0.6 },
  { type: 'tick', t: s.lockAtOut, gain: 3 }, { type: 'boom', t: s.lockAtOut + 0.02, gain: 0.85 }];
module.exports = padlockPrice;
