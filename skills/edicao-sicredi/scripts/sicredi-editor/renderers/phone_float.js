const U = require('../utils/canvas_utils');
const { C, assets } = U;
// Celular 3D flutuando sobre o orador (sobe girando, balança, encolhe e sai). Tela gerada em canvas (app genérico verde).
// seg: { screen:"app"|"feed", title?, rows?:[...], tilt? }
let cache = null;
function screenCanvas(createCanvas, seg, pw, ph) {
  const c = createCanvas(pw, ph), g = c.getContext('2d');
  g.fillStyle = C.white; U.roundRect(g, 0, 0, pw, ph, 64); g.fill(); g.clip();
  // dynamic island + header verde
  g.fillStyle = U.linGrad(g, 0, 0, pw, 300, 160, [[0, C.green], [1, C.greenDark]]); g.fillRect(0, 0, pw, 300);
  g.fillStyle = C.ink; U.roundRect(g, pw / 2 - 70, 22, 140, 38, 19); g.fill();
  g.drawImage(assets.sicredi_icon, 40, 96, 52 * assets.sicredi_icon.width / assets.sicredi_icon.height, 52);
  g.fillStyle = C.white; g.font = U.font(600, 30); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(seg.title || 'Olá, cooperado', 120, 122);
  g.font = U.font(500, 24); g.globalAlpha = 0.8; g.fillText(seg.subtitle || 'Saldo disponível', 40, 196); g.globalAlpha = 1;
  g.font = U.font(800, 58); g.fillText(seg.value || 'R$ 12.480,00', 40, 246);
  const rows = seg.rows || ['Pix enviado', 'Investimento', 'Cartão', 'Seguro'];
  rows.forEach((r, i) => { const y = 340 + i * 150;
    g.fillStyle = C.mist; U.roundRect(g, 30, y, pw - 60, 124, 28); g.fill();
    g.fillStyle = i % 2 ? C.greenDark : C.green; g.beginPath(); g.arc(88, y + 62, 28, 0, 7); g.fill();
    g.fillStyle = C.ink; g.font = U.font(600, 28); g.fillText(r, 138, y + 48);
    g.fillStyle = C.line; U.roundRect(g, 138, y + 72, 190 - i * 20, 14, 7); g.fill(); });
  g.fillStyle = C.white; g.fillRect(0, ph - 130, pw, 130); g.fillStyle = C.line; g.fillRect(0, ph - 130, pw, 2);
  [0, 1, 2, 3].forEach(i => { g.beginPath(); g.arc(pw * (0.14 + i * 0.24), ph - 62, 18, 0, 7); g.fillStyle = i === 0 ? C.green : C.line; g.fill(); });
  return c;
}
module.exports = function phone_float(ctx, seg, t, W, H) {
  const { createCanvas } = require('canvas');
  const local = t - seg.start, dur = seg.end - seg.start;
  const pw = 520, ph = 1060;
  if (!cache || cache.seg !== seg) {
    const c = createCanvas(pw + 40, ph + 40), g = c.getContext('2d');
    g.translate(20, 20);
    g.fillStyle = C.ink; U.roundRect(g, -10, -10, pw + 20, ph + 20, 80); g.fill();           // corpo
    g.strokeStyle = '#2f4a38'; g.lineWidth = 3; U.roundRect(g, -10, -10, pw + 20, ph + 20, 80); g.stroke();
    g.drawImage(screenCanvas(createCanvas, seg, pw, ph), 0, 0);
    cache = { seg, img: c };
  }
  const inK = U.clamp(local / 0.9), outK = U.easeInCubic((local - (dur - 0.45)) / 0.45);
  const rise = 1 - U.spring(local, 11, 7);
  const scale = U.lerp(0.35, 0.78, U.clamp(U.spring(local, 11, 7))) * (1 - outK * 0.55);
  const cx = W / 2, cy = H * 0.5 + rise * H * 0.55 + outK * H * 0.45 + Math.sin(local * 1.5) * 14;
  const rz = (seg.tilt != null ? seg.tilt : -0.1) + (1 - U.easeOutCubic(inK)) * 0.5 + Math.sin(local * 1.1) * 0.03 + outK * 0.5;
  const ry = Math.sin(local * 1.2 + 0.6) * 0.5 * (0.4 + 0.6 * inK) + (1 - U.easeOutCubic(inK)) * -0.6; // "rotateY" falso (trapézio)
  const img = cache.img, iw = img.width, ih = img.height;
  ctx.save(); ctx.globalAlpha = U.clamp(local / 0.12) * (1 - outK);
  ctx.translate(cx, cy); ctx.rotate(rz); ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40;
  // perspectiva por faixas horizontais: largura varia linearmente (topo ↔ base)
  const slices = 260, sh = ih / slices;
  for (let i = 0; i < slices; i++) {
    const f = i / slices - 0.5, k = 1 + ry * f * 0.55, wdt = iw * k;
    ctx.drawImage(img, 0, i * sh, iw, sh + 1, -wdt / 2 + ry * 30, -ih / 2 + i * sh, wdt, sh + 1);
    if (i === 0) ctx.shadowColor = 'transparent';
  }
  ctx.restore();
};
module.exports.sfx = seg => [{ type: 'whoosh', t: seg.start - 0.05, gain: 0.9 }, { type: 'whoosh', t: seg.end - 0.4, gain: 0.5 }];
