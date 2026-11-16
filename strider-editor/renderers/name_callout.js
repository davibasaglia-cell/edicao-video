const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// Identificação das pessoas: um ponto marca cada uma (acompanha a câmera por uma trilha de pontos),
// a linha se desenha até a etiqueta, e a etiqueta abre com wipe (nome branco + cargo laranja).
// Cabeçalho no topo digitado letra a letra.
function nameCallout(ctx, seg, t, W, H) {
  const fade = X.segFade(seg, t, 0.01, 0.25);
  ctx.save();
  ctx.globalAlpha = fade;

  if (seg.header) {
    const hk = U.clamp((t - (seg.headerAtOut ?? seg.outStart)) / 0.9);
    const n = Math.round(seg.header.length * hk);
    if (n > 0) {
      const y = H * 0.05;
      ctx.font = U.font(700, 27);
      const shown = seg.header.slice(0, n);
      const tw = F.spacedWidth(ctx, seg.header, 6);
      ctx.fillStyle = 'rgba(10,10,10,0.72)';
      U.roundRect(ctx, 44, y - 40, tw + 92, 62, 31); ctx.fill();
      const blink = (Math.floor(t * 2.2) % 2 === 0) ? 1 : 0.35;
      ctx.fillStyle = U.COLORS.orange; ctx.globalAlpha = fade * blink;
      ctx.beginPath(); ctx.arc(76, y - 9, 10, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = fade;
      ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
      F.fillSpacedLeft(ctx, shown, 100, y + 1, 6);
    }
  }

  for (const p of seg.people) {
    const lt = t - p.atOut;
    if (lt < 0) continue;
    const anchor = X.track(p.track, t) || p.anchor;
    const ax = anchor[0] * W, ay = anchor[1] * H;
    const right = p.align === 'right';
    ctx.font = U.font(900, 74, true);
    const nameW = ctx.measureText(p.name).width;
    ctx.font = U.font(700, 26);
    const roleW = F.spacedWidth(ctx, p.role, 5);
    const bw = Math.max(nameW, roleW) + 74, bh = 150;
    const bx = right ? p.box[0] * W - bw : p.box[0] * W, by = p.box[1] * H;
    // ponto de conexão na etiqueta: borda de cima (etiqueta abaixo) ou de baixo (etiqueta acima)
    const below = by > ay;
    const cx = U.clamp(ax, bx + 40, bx + bw - 40), cy = below ? by : by + bh;

    // linha + ponto
    const lk = U.easeInOutCubic((lt - 0.12) / 0.3);
    ctx.save();
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
    if (lk > 0) { F.partialPolyline(ctx, [[ax, ay], [cx, cy]], lk); ctx.stroke(); }
    const pk = U.easeOutBack(lt / 0.22);
    const pulse = (lt * 1.4) % 1;
    ctx.globalAlpha = fade * (1 - pulse) * 0.8;
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(ax, ay, 14 + pulse * 30, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.fillStyle = U.COLORS.orange;
    ctx.beginPath(); ctx.arc(ax, ay, 15 * pk, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = U.COLORS.white;
    ctx.beginPath(); ctx.arc(ax, ay, 6 * pk, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // etiqueta
    const bar = U.easeOutCubic((lt - 0.3) / 0.16);
    const wk = U.easeOutCubic((lt - 0.38) / 0.32);
    if (bar <= 0) continue;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24;
    const barX = right ? bx + bw - 12 : bx;
    ctx.fillStyle = U.COLORS.orange;
    ctx.fillRect(barX, by + bh / 2 - (bh / 2) * bar, 12, bh * bar);
    const pw = (bw - 12) * wk;
    ctx.fillStyle = 'rgba(12,12,12,0.86)';
    const px = right ? bx + bw - 12 - pw : bx + 12;
    ctx.fillRect(px, by, pw, bh);
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.rect(px, by, pw, bh); ctx.clip();
    const k1 = U.easeOutCubic((lt - 0.48) / 0.3), k2 = U.easeOutCubic((lt - 0.58) / 0.3);
    const tx = right ? bx + bw - 44 : bx + 42;
    const dir = right ? 1 : -1;
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = fade * k1;
    ctx.font = U.font(900, 74, true); ctx.fillStyle = U.COLORS.white;
    ctx.textAlign = right ? 'right' : 'left';
    ctx.fillText(p.name, tx + dir * (1 - k1) * 220, by + 82);
    ctx.globalAlpha = fade * k2;
    ctx.font = U.font(700, 26); ctx.fillStyle = U.COLORS.orange;
    F.fillSpacedLeft(ctx, p.role, (right ? tx - roleW : tx) + dir * (1 - k2) * 260, by + 124, 5);
    ctx.restore();
  }
  ctx.restore();
}
nameCallout.sfx = s => s.people.flatMap(p => [{ type: 'tick', t: p.atOut, gain: 2.2 }, { type: 'whoosh', t: p.atOut + 0.25, gain: 0.7 }]);
module.exports = nameCallout;
