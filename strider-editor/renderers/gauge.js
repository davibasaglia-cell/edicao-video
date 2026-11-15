const U = require('../utils/canvas_utils');

// Manômetro preto/laranja; agulha anima entre estágios.
function needleAt(seg, t) {
  const st = seg.stages;
  if (t <= st[0].atOut) return { v: st[0].needle, sub: st[0].sub, idx: 0 };
  for (let i = 1; i < st.length; i++) {
    if (t < st[i].atOut) {
      const a = st[i - 1], b = st[i];
      const k = U.easeInOutCubic((t - a.atOut) / Math.min(0.45, b.atOut - a.atOut));
      return { v: U.lerp(a.needle, b.needle, k), sub: a.sub, idx: i - 1 };
    }
  }
  const last = st[st.length - 1];
  const prev = st[st.length - 2] || last;
  const k = U.easeInOutCubic((t - last.atOut) / 0.45);
  return { v: U.lerp(prev.needle, last.needle, k), sub: last.sub, idx: st.length - 1, settleT: t - last.atOut };
}

module.exports = function gauge(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cx = W / 2, cy = H * (seg.y || 0.6), r = 230;
  const st = needleAt(seg, t);
  const isFinal = st.idx === seg.stages.length - 1;

  U.withTransform(ctx, cx, cy, env.scale, env.alpha, () => {
    const cardW = W * 0.8, cardH = 560, cardX = (W - cardW) / 2, cardY = cy - r - 100;
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 34);

    // trilho
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 38; ctx.stroke();
    // ticks
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = i % 5 === 0 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 34), cy + Math.sin(a) * (r - 34));
      ctx.lineTo(cx + Math.cos(a) * (r - (i % 5 === 0 ? 62 : 50)), cy + Math.sin(a) * (r - (i % 5 === 0 ? 62 : 50)));
      ctx.stroke();
    }
    // progresso laranja
    const p = U.clamp(st.v, 0, 1);
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + p * Math.PI);
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 38; ctx.stroke();

    // label
    ctx.font = U.font(700, 30);
    ctx.fillStyle = '#CCCCCC';
    ctx.textBaseline = 'alphabetic';
    U.fillSpaced(ctx, seg.label, cx, cy - r - 46, 6);

    // agulha
    const ang = Math.PI + p * Math.PI;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = U.COLORS.white;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(r - 70, -3); ctx.lineTo(r - 70, 3); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fillStyle = U.COLORS.white; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();

    // sub-label (troca no estágio final com slam)
    let s = { scale: 1, alpha: 1 };
    if (isFinal && st.settleT != null) s = U.slam(st.settleT, 0.16, 1.5);
    U.withTransform(ctx, cx, cy + 120, s.scale, s.alpha, () => {
      const size = U.fitFont(ctx, st.sub, 900, 96, cardW - 80, true);
      ctx.font = U.font(900, size, true);
      ctx.textAlign = 'center';
      ctx.fillStyle = isFinal ? U.COLORS.orange : U.COLORS.white;
      ctx.fillText(st.sub, cx, cy + 150);
    });
  });
};
