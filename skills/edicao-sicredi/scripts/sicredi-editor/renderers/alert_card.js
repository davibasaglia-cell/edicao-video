const U = require('../utils/canvas_utils');
const { C } = U;
// Card de alerta estilo notificação do celular: desliza, "treme" levemente e mostra ícone de vento animado.
// seg: { title, body, tag?, y?, shake_at? }
module.exports = function alert_card(ctx, seg, t, W, H) {
  const local = t - seg.start, dur = seg.end - seg.start;
  const w = W * 0.88, h = 210, x = (W - w) / 2;
  const inK = U.spring(local, 14, 8), outK = U.easeInCubic((local - (dur - 0.25)) / 0.25);
  const sh = seg.shake_at != null && t > seg.shake_at ? Math.sin((t - seg.shake_at) * 60) * 10 * Math.exp(-(t - seg.shake_at) * 6) : 0;
  const y = H * (seg.y != null ? seg.y : 0.6) + (1 - inK) * -160 - outK * 160;
  ctx.save(); ctx.globalAlpha = U.clamp(local / 0.12) * (1 - outK); ctx.translate(sh, 0);
  U.uiCard(ctx, x, y, w, h, 48);
  // ícone: quadrado verde-escuro com linhas de vento que correm
  const ix = x + 34, iy = y + 40, is = 130;
  U.roundRect(ctx, ix, iy, is, is, 32); ctx.fillStyle = U.linGrad(ctx, ix, iy, is, is, 150, [[0, C.greenDark], [1, C.greenDeep]]); ctx.fill();
  ctx.save(); U.roundRect(ctx, ix, iy, is, is, 32); ctx.clip(); ctx.strokeStyle = C.white; ctx.lineCap = 'round'; ctx.lineWidth = 9;
  [[0.32, 0.62, 0], [0.5, 0.8, 0.35], [0.68, 0.55, 0.7]].forEach(([fy, len, ph]) => {
    const off = ((local * 1.4 + ph) % 1) * is * 0.5 - is * 0.15, yy = iy + is * fy;
    ctx.beginPath(); ctx.moveTo(ix + is * 0.15 + off, yy); ctx.lineTo(ix + is * 0.15 + off + is * len * 0.6, yy);
    ctx.arc(ix + is * 0.15 + off + is * len * 0.6, yy - 12, 12, Math.PI / 2, -Math.PI * 0.6, true); ctx.stroke(); });
  ctx.restore();
  // textos
  const tx = ix + is + 32;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.green; ctx.font = U.font(800, 24); ctx.fillText((seg.tag || 'ALERTA').toUpperCase(), tx, y + 70);
  ctx.fillStyle = C.ink; ctx.font = U.font(800, U.fitFont(ctx, seg.title || '', 800, 50, x + w - tx - 30)); ctx.fillText(seg.title || '', tx, y + 124);
  ctx.fillStyle = C.muted; ctx.font = U.font(500, 30); ctx.fillText(seg.body || '', tx, y + 168);
  ctx.restore();
};
module.exports.sfx = seg => [{ type: 'whoosh', t: seg.start - 0.1, gain: 0.8 }, ...(seg.shake_at != null ? [{ type: 'boom', t: seg.shake_at, gain: 0.5 }] : [])];
