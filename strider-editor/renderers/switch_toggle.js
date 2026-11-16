const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// "Tendo esse apoio, fica muito mais fácil": card com uma chave liga/desliga rotulada APOIO.
// A chave liga na palavra (trilho acende laranja, faísca), e a frase sobe com a palavra-chave gigante.
function switchToggle(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur, dur, { from: 0.7, inDur: 0.25, outDur: 0.15 });
  const cy = H * (seg.y || 0.58);
  const cw = W * 0.8, ch = 200, cx = W / 2;
  const on = U.easeOutBack((t - seg.onAtOut) / 0.25);
  const onC = U.clamp((t - seg.onAtOut) / 0.12);
  ctx.save();
  ctx.globalAlpha = env.alpha;
  X.scrim(ctx, W, cy - 260, cy + 520, 0.5);
  U.withTransform(ctx, cx, cy, env.scale, env.alpha, () => {
    U.drawCard(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 36);
    ctx.font = U.font(900, 78, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = U.COLORS.white;
    ctx.fillText(seg.label, cx - cw / 2 + 64, cy + 4);
    // chave
    const sw = 210, sh = 108, sx = cx + cw / 2 - 64 - sw, sy = cy - sh / 2;
    ctx.fillStyle = onC > 0.5 ? U.COLORS.orange : '#3b3b3b';
    U.roundRect(ctx, sx, sy, sw, sh, sh / 2); ctx.fill();
    ctx.font = U.font(900, 30); ctx.textAlign = 'center';
    ctx.fillStyle = onC > 0.5 ? '#111' : '#9a9a9a';
    ctx.fillText(onC > 0.5 ? 'ON' : 'OFF', onC > 0.5 ? sx + 62 : sx + sw - 62, cy + 2);
    const kx = U.lerp(sx + sh / 2, sx + sw - sh / 2, U.clamp(on, 0, 1.08));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12;
    ctx.fillStyle = U.COLORS.white; ctx.beginPath(); ctx.arc(kx, cy, sh / 2 - 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // faísca quando liga
    const sp = t - seg.onAtOut;
    if (sp > 0 && sp < 0.45) {
      const k = sp / 0.45;
      ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.globalAlpha = env.alpha * (1 - k);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, r0 = sh * 0.6 + k * 40, r1 = r0 + 30;
        ctx.beginPath(); ctx.moveTo(kx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(kx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
    }
  });
  ctx.textBaseline = 'alphabetic';
  // frase
  const lk = U.easeOutCubic((t - seg.onAtOut - 0.15) / 0.3);
  if (lk > 0 && seg.line) {
    ctx.globalAlpha = env.alpha * lk;
    ctx.font = U.font(800, 54); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.line, W / 2, cy + ch / 2 + 110 + (1 - lk) * 40, 7);
  }
  if (t >= seg.bigAtOut) {
    const s = U.slam(t - seg.bigAtOut, 0.15, 1.7);
    const size = U.fitFont(ctx, seg.big, 900, 290, W * 0.9, true);
    U.withTransform(ctx, W / 2, cy + ch / 2 + 300, s.scale, s.alpha * env.alpha, () => {
      X.strokedText(ctx, seg.big, W / 2, cy + ch / 2 + 180 + size * 0.75, U.font(900, size, true), U.COLORS.orange, 14);
    });
  }
  ctx.restore();
}
switchToggle.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 }, { type: 'tick', t: s.onAtOut, gain: 3 }, { type: 'boom', t: s.bigAtOut, gain: 0.85 }];
module.exports = switchToggle;
