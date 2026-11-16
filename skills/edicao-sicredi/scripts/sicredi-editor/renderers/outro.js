const U = require('../utils/canvas_utils');
const { C, assets } = U;
// ENCERRAMENTO OBRIGATÓRIO: tela branca com o logo Sicredi. Ícone gira e entra com mola; o nome desliza para fora do ícone.
module.exports = function outro(ctx, seg, t, W, H) {
  const local = t - seg.start;
  ctx.fillStyle = U.linGrad(ctx, 0, 0, W, H, 180, [[0, C.white], [1, C.mist]]); ctx.fillRect(0, 0, W, H);
  const ic = assets.sicredi_icon, wm = assets.sicredi_wordmark;
  const logoW = W * 0.62, scale = logoW / assets.sicredi_logo.width;     // proporção original do logo
  const iw = ic.width * scale, ih = ic.height * scale, ww = wm.width * scale, wh = wm.height * scale;
  const gap = (assets.sicredi_logo.width - ic.width - wm.width) * scale;
  const total = iw + gap + ww, cx = W / 2, cy = H / 2;
  // anel que expande atrás do ícone
  const ringK = U.clamp(local / 0.9);
  if (ringK < 1) { ctx.beginPath(); ctx.arc(cx, cy, iw * (0.6 + ringK * 2.2), 0, 7); ctx.lineWidth = 6 * (1 - ringK); ctx.strokeStyle = C.green; ctx.globalAlpha = 0.5 * (1 - ringK); ctx.stroke(); ctx.globalAlpha = 1; }
  const k = U.spring(local - 0.05, 12, 7), rot = (1 - U.easeOutCubic(local / 0.9)) * -Math.PI * 1.5;
  const icx = cx - total / 2 + iw / 2;
  // ícone final desloca para a esquerda enquanto o nome aparece (centraliza o logo completo no fim)
  const slide = U.easeInOutCubic((local - 0.45) / 0.55);
  const startX = cx, iconX = U.lerp(startX, icx, slide);
  ctx.save(); ctx.globalAlpha = U.clamp(local / 0.1); ctx.translate(iconX, cy); ctx.rotate(rot); ctx.scale(Math.max(0.01, k), Math.max(0.01, k));
  ctx.drawImage(ic, -iw / 2, -ih / 2, iw, ih); ctx.restore();
  // nome: revelado por máscara a partir do ícone
  if (slide > 0) {
    const wx = cx - total / 2 + iw + gap;
    ctx.save(); ctx.beginPath(); ctx.rect(wx - 4, cy - wh, (ww + 8) * slide, wh * 2); ctx.clip();
    ctx.globalAlpha = U.clamp(slide * 1.4); ctx.drawImage(wm, wx - (1 - slide) * 40, cy - wh / 2, ww, wh); ctx.restore();
  }
  if (seg.tagline) { const a = U.easeOutCubic((local - 1.1) / 0.5); ctx.globalAlpha = a; ctx.fillStyle = C.muted; ctx.font = U.font(500, 34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(seg.tagline, W / 2, cy + ih * 1.3 + (1 - a) * 14); ctx.globalAlpha = 1; }
};
module.exports.sfx = seg => [{ type: 'whoosh', t: seg.start - 0.15, gain: 0.8 }, { type: 'chime', t: seg.start + 0.55, gain: 0.8 }];
