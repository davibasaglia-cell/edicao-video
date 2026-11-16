const U = require('../utils/canvas_utils');
const { C } = U;
// Cena clara (takeover): título + 2–4 tiles em gradiente verde que "pulam" na ordem da fala + régua opcional.
// seg: { title, title_at?, tiles:[{label, at, tone:"green"|"mid"|"dark"}], slider:[{at,value}] }
const TONES = { green: [C.green, C.greenMid], mid: [C.greenMid, C.greenDark], dark: [C.greenDark, C.greenDeep] };
module.exports = function tiles_scene(ctx, seg, t, W, H) {
  const local = t - seg.start;
  ctx.fillStyle = U.linGrad(ctx, 0, 0, W, H, 180, [[0, C.white], [1, C.mist]]); ctx.fillRect(0, 0, W, H);
  const R = U.rnd(3); ctx.fillStyle = 'rgba(20,113,54,0.035)'; for (let i = 0; i < 900; i++) ctx.fillRect(R() * W, R() * H, 2, 2);
  const cy = H * 0.46;
  if (seg.title) {
    const k = U.easeOutCubic((t - (seg.title_at != null ? seg.title_at : seg.start + 0.1)) / 0.4);
    ctx.save(); ctx.globalAlpha = k; ctx.filter = `blur(${((1 - k) * 12).toFixed(1)}px)`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink; ctx.font = U.font(700, 64);
    const ls = U.wrap(ctx, seg.title, W * 0.8); ls.forEach((l, i) => ctx.fillText(l, W / 2, cy - H * 0.17 + i * 74 + (1 - k) * 30)); ctx.restore();
  }
  const tiles = seg.tiles || [], n = tiles.length, size = Math.min(W * 0.27, (W * 0.88 - 40 * (n - 1)) / n), gap = 36;
  const tot = n * size + (n - 1) * gap, x0 = (W - tot) / 2;
  tiles.forEach((tl, i) => {
    const k = U.spring(t - tl.at, 14, 8); if (t < tl.at) return;
    const [a, b] = TONES[tl.tone || ['green', 'mid', 'dark'][i % 3]];
    const x = x0 + i * (size + gap), y = cy - size / 2 + (1 - k) * 140 - Math.sin(local * 1.8 + i * 1.3) * 7;
    ctx.save(); ctx.globalAlpha = U.clamp((t - tl.at) / 0.1); ctx.translate(x + size / 2, y + size / 2); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.translate(-size / 2, -size / 2);
    ctx.shadowColor = 'rgba(20,113,54,0.35)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16;
    U.roundRect(ctx, 0, 0, size, size, size * 0.2); ctx.fillStyle = U.linGrad(ctx, 0, 0, size, size, 150, [[0, a], [1, b]]); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.stroke();
    [0, 1, 2].forEach(j => { ctx.beginPath(); ctx.arc(size - 34 + j * 0 - 18 * (2 - j) + 18, 30, 3.5, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); });
    ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const fs = U.fitFont(ctx, tl.label || '', 700, 34, size * 0.8); ctx.font = U.font(700, fs);
    ctx.fillText(tl.label || '', size / 2, size * 0.82); ctx.restore();
  });
  if (seg.slider) {
    const y = cy + size / 2 + 110, xa = W * 0.12, xb = W * 0.88;
    let v = 0; seg.slider.forEach((s, i) => { const prev = i ? seg.slider[i - 1].value : 0; if (t >= s.at) v = U.lerp(prev, s.value, U.easeInOutCubic((t - s.at) / 0.7)); });
    const k = U.clamp((t - seg.start - 0.3) / 0.3); ctx.globalAlpha = k;
    ctx.lineCap = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
    ctx.strokeStyle = C.greenDark; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(U.lerp(xa, xb, v), y); ctx.stroke();
    ctx.save(); ctx.shadowColor = 'rgba(6,33,15,0.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.arc(U.lerp(xa, xb, v), y, 22, 0, 7); ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(U.lerp(xa, xb, v), y, 22, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = C.green; ctx.stroke();
  }
};
module.exports.sfx = seg => (seg.tiles || []).map(tl => ({ type: 'tick', t: tl.at, gain: 3 }));
