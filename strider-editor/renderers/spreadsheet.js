const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Planilha se desenhando (linhas da grade traçadas) → linhas preenchem com valor contando → scanner desce pelas opções.
const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

function spreadsheet(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.2, 0.15);
  const local = t - seg.outStart;
  const cardW = W * 0.86, x0 = (W - cardW) / 2, y0 = H * (seg.y || 0.4);
  const pad = 40, headH = 110, colH = 64, rowH = 92;
  const rows = seg.rows, extra = seg.extra_rows || 2;
  const nRows = rows.length + extra;
  const cardH = headH + colH + nRows * rowH + pad;
  const rise = (1 - U.easeOutCubic(local / 0.35)) * 120;
  ctx.save();
  ctx.globalAlpha = env;
  ctx.translate(0, rise);
  U.drawCard(ctx, x0, y0, cardW, cardH, 28);
  ctx.textBaseline = 'alphabetic';
  ctx.font = U.font(700, 34); ctx.fillStyle = '#DDDDDD';
  F.fillSpacedLeft(ctx, seg.title, x0 + pad + 10, y0 + 74, 7);
  // ícone de planilha no canto
  ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 4;
  const ix = x0 + cardW - pad - 70, iy = y0 + 36;
  ctx.strokeRect(ix, iy, 60, 48); ctx.beginPath(); ctx.moveTo(ix, iy + 16); ctx.lineTo(ix + 60, iy + 16); ctx.moveTo(ix + 22, iy); ctx.lineTo(ix + 22, iy + 48); ctx.stroke();

  // grade sendo desenhada
  const gx0 = x0 + pad, gx1 = x0 + cardW - pad, gy0 = y0 + headH, gy1 = gy0 + colH + nRows * rowH;
  const colX = gx0 + (gx1 - gx0) * 0.5;
  const gk = U.easeInOutCubic(local / 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
  for (let r = 0; r <= nRows + 1; r++) {
    const yy = r === 0 ? gy0 : gy0 + colH + (r - 1) * rowH;
    const k = U.clamp(gk * 1.6 - r * 0.08);
    ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(U.lerp(gx0, gx1, k), yy); ctx.stroke();
  }
  [gx0, colX, gx1].forEach((xx, i) => { const k = U.clamp(gk * 1.4 - i * 0.15); ctx.beginPath(); ctx.moveTo(xx, gy0); ctx.lineTo(xx, U.lerp(gy0, gy1, k)); ctx.stroke(); });
  ctx.globalAlpha = env * U.clamp((local - 0.3) / 0.2);
  ctx.font = U.font(700, 28); ctx.fillStyle = '#999';
  F.fillSpacedLeft(ctx, seg.col1 || 'OPÇÃO', gx0 + 24, gy0 + 42, 5);
  F.fillSpacedLeft(ctx, seg.col2 || 'COMPROMISSO', colX + 24, gy0 + 42, 5);
  ctx.globalAlpha = env;

  // scanner (linha atual destacada)
  const revealed = rows.filter(r => t >= r.atOut).length;
  let scan = revealed - 1;
  if (seg.descendAtOut != null && t >= seg.descendAtOut) {
    const k = U.easeInOutCubic((t - seg.descendAtOut) / (seg.descend_dur || 1.1));
    scan = U.lerp(rows.length - 1, nRows - 1, k);
  }
  if (scan >= 0) {
    const sy = gy0 + colH + scan * rowH;
    ctx.save();
    ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 24;
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 6;
    U.roundRect(ctx, gx0 - 6, sy + 4, gx1 - gx0 + 12, rowH - 8, 10); ctx.stroke();
    ctx.restore();
    // seta descendo à direita
    if (seg.descendAtOut != null && t >= seg.descendAtOut) {
      ctx.fillStyle = U.COLORS.orange;
      const ax = gx1 + 2, ay = sy + rowH / 2;
      ctx.beginPath(); ctx.moveTo(ax - 22, ay - 10); ctx.lineTo(ax + 0, ay + 16); ctx.lineTo(ax + 22, ay - 10); ctx.closePath(); ctx.fill();
    }
  }
  // linhas
  rows.forEach((r, i) => {
    if (t < r.atOut) return;
    const k = U.clamp((t - r.atOut) / 0.3);
    const ry = gy0 + colH + i * rowH;
    ctx.save();
    ctx.globalAlpha = env * U.clamp(k * 2);
    ctx.font = U.font(800, 46); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'left';
    ctx.fillText(r.label, gx0 + 24 - (1 - U.easeOutCubic(k)) * 60, ry + 62);
    const isMax = i === 0;
    ctx.font = U.font(900, 50, true); ctx.fillStyle = isMax ? U.COLORS.orange : U.COLORS.white;
    const txt = r.value != null ? brl(r.value * U.easeOutCubic(k)) : '···';
    ctx.fillText(txt, colX + 24, ry + 62);
    ctx.restore();
  });
  // linhas extras ao "descer"
  if (seg.descendAtOut != null) {
    for (let j = 0; j < extra; j++) {
      const at = seg.descendAtOut + (j + 0.5) * (seg.descend_dur || 1.1) / extra;
      if (t < at) continue;
      const k = U.clamp((t - at) / 0.25);
      const ry = gy0 + colH + (rows.length + j) * rowH;
      ctx.globalAlpha = env * k * 0.75;
      ctx.font = U.font(800, 46); ctx.fillStyle = '#BBBBBB'; ctx.textAlign = 'left';
      ctx.fillText(`${rows.length + j + 1}ª OPÇÃO`, gx0 + 24, ry + 62);
      ctx.font = U.font(900, 50, true); ctx.fillText('···', colX + 24, ry + 62);
    }
  }
  ctx.restore();
}
spreadsheet.sfx = s => {
  const ev = [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 }];
  s.rows.forEach(r => ev.push({ type: 'tick', t: r.atOut, gain: 2.2 }));
  if (s.descendAtOut != null) ev.push({ type: 'whoosh', t: s.descendAtOut - 0.05, gain: 0.5 });
  return ev;
};
module.exports = spreadsheet;
