const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Lower-third: barra laranja vertical cresce, painel escuro abre por wipe e o texto desliza por dentro.
function lowerThird(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const kOut = U.clamp((dur - local) / 0.22);
  const exit = 1 - U.easeInOutCubic(kOut);
  const x0 = 64 - exit * 700, y = H * (seg.y || 0.075), panelH = 156;
  ctx.font = U.font(900, 70, true);
  const subW = ctx.measureText(seg.subtitle).width;
  ctx.font = U.font(700, 28);
  const titleW = F.spacedWidth(ctx, seg.title, 7);
  const fullW = Math.max(subW, titleW) + 70;
  ctx.save();
  ctx.fillStyle = U.COLORS.orange;
  ctx.fillRect(x0, y, 12, panelH * U.easeOutCubic(local / 0.16));
  const pw = fullW * U.easeOutCubic((local - 0.08) / 0.3);
  ctx.fillStyle = 'rgba(12,12,12,0.86)';
  ctx.fillRect(x0 + 12, y, pw, panelH);
  ctx.beginPath(); ctx.rect(x0 + 12, y, pw, panelH); ctx.clip();
  const k1 = U.easeOutCubic((local - 0.18) / 0.3), k2 = U.easeOutCubic((local - 0.28) / 0.32);
  ctx.textBaseline = 'alphabetic';
  ctx.font = U.font(700, 28); ctx.fillStyle = '#DDDDDD';
  ctx.globalAlpha = k1;
  F.fillSpacedLeft(ctx, seg.title, x0 + 42 - (1 - k1) * 160, y + 54, 7);
  ctx.font = U.font(900, 70, true); ctx.fillStyle = U.COLORS.orange;
  ctx.globalAlpha = k2;
  ctx.textAlign = 'left';
  ctx.fillText(seg.subtitle, x0 + 38 - (1 - k2) * 260, y + 128);
  ctx.restore();
}
lowerThird.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.9 }];
module.exports = lowerThird;
