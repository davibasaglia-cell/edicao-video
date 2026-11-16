const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const tryL = cur ? cur + ' ' + w : w;
    if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Pergunta da entrevista no topo: etiqueta "PERGUNTA N" cai de cima, painel abre e as palavras
// da pergunta sobem uma a uma; um "?" laranja gigante gira para dentro no canto.
function questionBar(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const out = U.easeInOutCubic(1 - U.clamp((dur - local) / 0.28));
  const y0 = H * 0.035 - out * 360;
  const x0 = 50, maxW = W - 100 - 150;
  ctx.save();
  ctx.globalAlpha = 1 - out;

  // etiqueta
  const ck = U.easeOutBack(local / 0.3);
  const label = `PERGUNTA ${seg.num}`;
  ctx.font = U.font(900, 30, true);
  const lw = F.spacedWidth(ctx, label, 5) + 48;
  ctx.save();
  ctx.translate(0, (1 - ck) * -120);
  ctx.fillStyle = U.COLORS.orange;
  U.roundRect(ctx, x0, y0, lw, 54, 10); ctx.fill();
  ctx.fillStyle = '#111'; ctx.textBaseline = 'alphabetic';
  F.fillSpacedLeft(ctx, label, x0 + 24, y0 + 38, 5);
  ctx.restore();

  // painel + texto
  const size = 60;
  ctx.font = U.font(900, size, true);
  const lines = wrap(ctx, seg.question, maxW);
  const ph = 46 + lines.length * size * 1.12;
  const py = y0 + 70;
  const pk = U.easeOutCubic((local - 0.12) / 0.35);
  const pw = (W - 2 * x0) * pk;
  ctx.fillStyle = 'rgba(12,12,12,0.84)';
  U.roundRect(ctx, x0, py, Math.max(1, pw), ph, 22); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, py, pw, ph); ctx.clip();
  // "?" gigante no canto
  const qk = U.easeOutBack((local - 0.3) / 0.4);
  ctx.save();
  ctx.translate(W - x0 - 85, py + ph / 2);
  ctx.rotate((1 - qk) * -0.9);
  ctx.scale(qk, qk);
  ctx.font = U.font(900, Math.min(200, ph * 1.05), true);
  ctx.fillStyle = U.COLORS.orange; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 6);
  ctx.restore();
  // palavras uma a uma
  ctx.font = U.font(900, size, true); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let wi = 0;
  const totalWords = seg.question.split(' ').length;
  const per = Math.min(0.09, 0.9 / totalWords);
  lines.forEach((line, li) => {
    let x = x0 + 34;
    const by = py + 28 + size * 0.86 + li * size * 1.12;
    for (const w of line.split(' ')) {
      const k = U.easeOutCubic((local - 0.3 - wi * per) / 0.22);
      if (k > 0) {
        ctx.globalAlpha = (1 - out) * k;
        ctx.fillStyle = U.COLORS.white;
        ctx.fillText(w, x, by + (1 - k) * 40);
      }
      x += ctx.measureText(w + ' ').width;
      wi++;
    }
  });
  ctx.restore();
  ctx.restore();
}
questionBar.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.8 }, { type: 'tick', t: s.outStart + 0.3, gain: 2.2 }];
module.exports = questionBar;
