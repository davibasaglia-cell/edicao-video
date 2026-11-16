const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Agenda da semana: horários vão sendo preenchidos em laranja até lotar; carimbo no fim.
const COLS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'], ROWS = 4;

function calendarFill(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cardW = W * 0.86, cardX = (W - cardW) / 2, cardY = H * (seg.y || 0.36);
  const pad = 46, headH = 120, gap = 14;
  const slotW = (cardW - pad * 2 - gap * (COLS.length - 1)) / COLS.length, slotH = 66;
  const cardH = headH + 46 + ROWS * (slotH + gap) + pad - gap;
  const n = COLS.length * ROWS;
  const rnd = F.prng(7);
  const order = [...Array(n).keys()].map(i => [i, rnd()]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  const pre = seg.prefilled || 6;
  const fs = seg.fillStartAtOut, fe = seg.fillEndAtOut;
  const filledCount = t < fs ? pre : Math.round(U.lerp(pre, n, U.clamp((t - fs) / (fe - fs)) ** 0.8));
  const stamped = t >= seg.stampAtOut;
  const shake = stamped ? Math.sin((t - seg.stampAtOut) * 90) * 14 * Math.max(0, 1 - (t - seg.stampAtOut) / 0.25) : 0;
  U.withTransform(ctx, W / 2 + shake, cardY + cardH / 2, env.scale, env.alpha, () => {
    ctx.save(); ctx.translate(shake, 0);
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 32);
    ctx.textBaseline = 'alphabetic';
    ctx.font = U.font(700, 32); ctx.fillStyle = '#DDDDDD';
    F.fillSpacedLeft(ctx, seg.title || 'AGENDA', cardX + pad, cardY + 76, 8);
    ctx.font = U.font(900, 44, true); ctx.fillStyle = filledCount >= n ? U.COLORS.orange : U.COLORS.white; ctx.textAlign = 'right';
    ctx.fillText(`${filledCount}/${n}`, cardX + cardW - pad, cardY + 80);
    ctx.font = U.font(700, 24); ctx.fillStyle = '#999';
    COLS.forEach((c, i) => { ctx.textAlign = 'center'; ctx.fillText(c, cardX + pad + i * (slotW + gap) + slotW / 2, cardY + headH + 20); });
    const filledSet = new Map(order.slice(0, filledCount).map((idx, j) => [idx, j]));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS.length; c++) {
      const idx = r * COLS.length + c;
      const x = cardX + pad + c * (slotW + gap), y = cardY + headH + 46 + r * (slotH + gap);
      const on = filledSet.has(idx);
      let s = 1;
      if (on && filledSet.get(idx) >= pre && t >= fs) {
        const tj = fs + (filledSet.get(idx) - pre) / (n - pre) * (fe - fs);
        s = 1 + 0.25 * Math.sin(Math.PI * U.clamp((t - tj) / 0.18));
      }
      U.withTransform(ctx, x + slotW / 2, y + slotH / 2, s, 1, () => {
        ctx.fillStyle = on ? U.COLORS.orange : 'rgba(255,255,255,0.08)';
        U.roundRect(ctx, x, y, slotW, slotH, 12); ctx.fill();
        if (!on) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.stroke(); }
      });
    }
    ctx.restore();
  });
  if (stamped) {
    const k = (t - seg.stampAtOut) / 0.16;
    const sc = U.lerp(2.4, 1, U.easeOutCubic(k));
    const cx = W / 2, cy = cardY + cardH / 2 + 30;
    ctx.save();
    ctx.globalAlpha = U.clamp(k * 2) * env.alpha;
    ctx.translate(cx, cy); ctx.rotate(-0.16); ctx.scale(sc, sc);
    const text = seg.stamp || 'LOTADA';
    ctx.font = U.font(900, 150, true);
    const tw = ctx.measureText(text).width + 90, th = 200;
    ctx.fillStyle = 'rgba(10,10,10,0.78)'; U.roundRect(ctx, -tw / 2, -th / 2, tw, th, 22); ctx.fill();
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 12; U.roundRect(ctx, -tw / 2, -th / 2, tw, th, 22); ctx.stroke();
    ctx.lineWidth = 4; U.roundRect(ctx, -tw / 2 + 18, -th / 2 + 18, tw - 36, th - 36, 14); ctx.stroke();
    ctx.fillStyle = U.COLORS.orange; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 8);
    ctx.restore();
  }
}
calendarFill.sfx = s => {
  const ev = [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.8 }];
  for (let i = 0; i < 6; i++) ev.push({ type: 'tick', t: s.fillStartAtOut + (i / 6) * (s.fillEndAtOut - s.fillStartAtOut), gain: 2 });
  ev.push({ type: 'boom', t: s.stampAtOut, gain: 0.9 });
  return ev;
};
module.exports = calendarFill;
