const U = require('../utils/canvas_utils');

// Pergunta → resposta: card com a pergunta gira 180° (flip 3D) e revela a resposta laranja; depois entra o complemento.
function flipReveal(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cw = W * 0.82, ch = 340, cx = W / 2, cy = H * (seg.y || 0.45);
  const fk = U.clamp((t - seg.flipAtOut) / 0.32);
  const ang = Math.PI * U.easeInOutCubic(fk);
  const sx = Math.abs(Math.cos(ang)) || 0.001;
  const back = ang > Math.PI / 2;
  const lift = 1 + 0.08 * Math.sin(ang);
  U.withTransform(ctx, cx, cy, env.scale * lift, env.alpha, () => {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sx, 1); ctx.translate(-cx, -cy);
    const x = cx - cw / 2, y = cy - ch / 2;
    if (!back) {
      U.drawCard(ctx, x, y, cw, ch, 36);
      ctx.font = U.font(700, 40); ctx.fillStyle = '#CCCCCC'; ctx.textBaseline = 'alphabetic';
      U.fillSpaced(ctx, seg.question_small, cx, y + 100, 8);
      const size = U.fitFont(ctx, seg.question, 900, 190, cw - 100, true);
      ctx.font = U.font(900, size, true); ctx.fillStyle = U.COLORS.white; ctx.textAlign = 'center';
      ctx.fillText(seg.question, cx, y + 100 + size * 0.95);
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(245,160,32,0.6)'; ctx.shadowBlur = 50;
      ctx.fillStyle = U.COLORS.orange; U.roundRect(ctx, x, y, cw, ch, 36); ctx.fill();
      ctx.restore();
      U.drawCornerBrackets(ctx, x, y, cw, ch, { color: 'rgba(17,17,17,0.85)' });
      const size = U.fitFont(ctx, seg.answer, 900, 170, cw - 110, true);
      ctx.font = U.font(900, size, true); ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(seg.answer, cx, cy + 8);
    }
    ctx.restore();
  });
  if (seg.extra && t >= seg.extraAtOut) {
    const k = U.easeOutBack((t - seg.extraAtOut) / 0.28);
    const y2 = cy + ch / 2 + 40 + (1 - k) * 160;
    ctx.save();
    ctx.globalAlpha = U.clamp((t - seg.extraAtOut) / 0.1) * env.alpha;
    const size = U.fitFont(ctx, seg.extra, 900, 130, W * 0.8, true);
    ctx.font = U.font(900, size, true);
    const tw = ctx.measureText(seg.extra).width, plus = size * 0.75;
    const total = plus + 24 + tw, x0 = cx - total / 2;
    ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.fillStyle = U.COLORS.orange; ctx.textAlign = 'left';
    ctx.fillRect(x0, y2 + size * 0.42 - 9, plus, 18); ctx.fillRect(x0 + plus / 2 - 9, y2 + size * 0.42 - plus / 2, 18, plus);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 11;
    ctx.strokeText(seg.extra, x0 + plus + 24, y2 + size * 0.8);
    ctx.fillStyle = U.COLORS.white; ctx.fillText(seg.extra, x0 + plus + 24, y2 + size * 0.8);
    ctx.restore();
  }
}
flipReveal.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.8 }, { type: 'whoosh', t: s.flipAtOut - 0.05, gain: 0.6 },
  { type: 'boom', t: s.flipAtOut + 0.16, gain: 0.8 }, ...(s.extraAtOut ? [{ type: 'whoosh', t: s.extraAtOut - 0.08, gain: 0.55 }] : [])];
module.exports = flipReveal;
