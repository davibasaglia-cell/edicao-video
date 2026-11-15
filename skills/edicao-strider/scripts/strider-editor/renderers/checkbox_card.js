const U = require('../utils/canvas_utils');

// Card de checkboxes: itens marcam conforme a fala; o último vira ✓ laranja.
module.exports = function checkboxCard(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cardW = W * 0.88, cardX = (W - cardW) / 2;
  const rowH = 104, top = 128, bottom = 52;
  const cardH = top + rowH * seg.items.length + bottom;
  const cardY = H * (seg.y || 0.47);
  const cx = W / 2;

  U.withTransform(ctx, cx, cardY + cardH / 2, env.scale, env.alpha, () => {
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 30);
    ctx.font = U.font(700, 32);
    ctx.fillStyle = U.COLORS.white;
    ctx.textBaseline = 'alphabetic';
    U.fillSpaced(ctx, seg.title, cx, cardY + 84, 8);

    const box = 66;
    const boxX = cardX + 64;
    seg.items.forEach((it, i) => {
      const rowY = cardY + top + i * rowH;
      const by = rowY + (rowH - box) / 2;
      const done = t >= it.atOut;
      const k = done ? U.clamp((t - it.atOut) / 0.18) : 0;
      const pop = done ? 1 + 0.18 * Math.sin(Math.PI * U.clamp((t - it.atOut) / 0.22)) : 1;
      const hl = it.highlight && done;

      U.withTransform(ctx, boxX + box / 2, by + box / 2, pop, 1, () => {
        ctx.fillStyle = hl ? U.COLORS.orange : 'rgba(60,60,60,0.95)';
        U.roundRect(ctx, boxX, by, box, box, 12);
        ctx.fill();
        if (done) {
          // check desenhado progressivamente
          const p1 = [boxX + 15, by + box * 0.52], p2 = [boxX + box * 0.42, by + box - 16], p3 = [boxX + box - 13, by + 17];
          const l1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), l2 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
          const d = k * (l1 + l2);
          ctx.strokeStyle = U.COLORS.white;
          ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(...p1);
          if (d <= l1) ctx.lineTo(p1[0] + (p2[0] - p1[0]) * d / l1, p1[1] + (p2[1] - p1[1]) * d / l1);
          else { ctx.lineTo(...p2); const e = (d - l1) / l2; ctx.lineTo(p2[0] + (p3[0] - p2[0]) * e, p2[1] + (p3[1] - p2[1]) * e); }
          ctx.stroke();
        }
      });

      const maxTextW = cardW - (boxX - cardX) - box - 64 - 40;
      const size = U.fitFont(ctx, it.text, 800, 40, maxTextW);
      ctx.save();
      ctx.globalAlpha = done ? 1 : 0.38;
      ctx.font = U.font(800, size);
      ctx.fillStyle = hl ? U.COLORS.orange : U.COLORS.white;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, boxX + box + 30, rowY + rowH / 2 + 2);
      ctx.restore();
    });
  });
};
