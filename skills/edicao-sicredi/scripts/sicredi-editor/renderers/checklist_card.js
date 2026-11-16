const U = require('../utils/canvas_utils');
const { C } = U;
// Checklist: card branco com itens que ganham ✓ verde (círculo enche + traço do check desenhado) na palavra falada.
// seg: { title, items:[{text, at}], y? }
module.exports = function checklist_card(ctx, seg, t, W, H) {
  const local = t - seg.start, dur = seg.end - seg.start, items = seg.items || [];
  const w = W * 0.86, x = (W - w) / 2, rowH = 104, h = 120 + items.length * rowH;
  const inK = U.spring(local, 15, 9), outK = U.easeInCubic((local - (dur - 0.22)) / 0.22);
  const y = H * (seg.y != null ? seg.y : 0.5) + (1 - inK) * H * 0.3 + outK * H * 0.3;
  ctx.save(); ctx.globalAlpha = U.clamp(local / 0.1) * (1 - outK);
  U.uiCard(ctx, x, y, w, h, 46);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.muted; ctx.font = U.font(700, 28);
  ctx.fillText((seg.title || '').toUpperCase(), x + 50, y + 66);
  items.forEach((it, i) => {
    const cy = y + 130 + i * rowH + rowH / 2 - 20, cx = x + 80, k = U.clamp((t - it.at) / 0.35), sp = U.spring(t - it.at, 16, 8);
    if (i) { ctx.fillStyle = C.line; ctx.fillRect(x + 50, cy - rowH / 2, w - 100, 2); }
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    if (t >= it.at) {
      ctx.beginPath(); ctx.arc(cx, cy, 30 * Math.max(0, sp), 0, 7); ctx.fillStyle = C.green; ctx.fill();
      ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const p = U.easeOutCubic((t - it.at - 0.08) / 0.25), pts = [[-13, 1], [-4, 11], [14, -10]];
      ctx.beginPath(); ctx.moveTo(cx + pts[0][0], cy + pts[0][1]);
      if (p > 0) { const a = Math.min(1, p * 2); ctx.lineTo(cx + U.lerp(pts[0][0], pts[1][0], a), cy + U.lerp(pts[0][1], pts[1][1], a)); }
      if (p > 0.5) { const b = (p - 0.5) * 2; ctx.lineTo(cx + U.lerp(pts[1][0], pts[2][0], b), cy + U.lerp(pts[1][1], pts[2][1], b)); }
      ctx.stroke(); ctx.restore();
    }
    const done = t >= it.at;
    ctx.fillStyle = done ? C.ink : C.muted; ctx.globalAlpha *= done ? 1 : 0.55; ctx.font = U.font(done ? 700 : 500, 42);
    ctx.fillText(it.text, cx + 60 + (done ? 0 : 0) - (1 - k) * 0, cy); ctx.globalAlpha /= done ? 1 : 0.55;
  });
  ctx.restore();
};
module.exports.sfx = seg => [{ type: 'whoosh', t: seg.start - 0.1, gain: 0.8 }, ...(seg.items || []).map(i => ({ type: 'tick', t: i.at, gain: 3 }))];
