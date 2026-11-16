const U = require('../utils/canvas_utils');
// Moldura do layout "orador no topo" (o vídeo em si é recomposto no FFmpeg — ver index.js, tipo "split").
// Aqui só desenha contorno arredondado + linhas de grade que se estendem, como no vídeo de referência.
module.exports = function split_frame(ctx, seg, t, W, H) {
  const L = seg.layout, local = t - seg.start, dur = seg.end - seg.start;
  const k = U.easeOutCubic(local / 0.5) * (1 - U.easeInCubic((local - (dur - 0.2)) / 0.2));
  ctx.save(); ctx.globalAlpha = k;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
  U.roundRect(ctx, L.x, L.y, L.w, L.h, L.r); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  const ext = U.easeOutCubic(local / 0.8);
  [[L.x + L.w * 0.12, 'v'], [L.x + L.w * 0.88, 'v'], [L.y + L.h * 0.9, 'h'], [L.y + L.h * 0.06, 'h']].forEach(([p, o]) => {
    ctx.beginPath(); if (o === 'v') { ctx.moveTo(p, L.y + L.h / 2 - H * 0.5 * ext); ctx.lineTo(p, L.y + L.h / 2 + H * 0.5 * ext); }
    else { ctx.moveTo(W / 2 - W * 0.5 * ext, p); ctx.lineTo(W / 2 + W * 0.5 * ext, p); } ctx.stroke();
  });
  ctx.restore();
};
