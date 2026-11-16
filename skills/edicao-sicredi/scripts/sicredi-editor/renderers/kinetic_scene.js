const U = require('../utils/canvas_utils');
const { C } = U;
// Cena de tela cheia (takeover) com fundo verde e texto cinético: frases entram no ritmo da fala.
// seg.lines: [{ text, at, size?, emphasis?:true }]  — emphasis = branco pleno; demais = branco 92%
// seg.fan: n (0–3) → leque de mini-cards brancos na base. seg.bg: "green" | "dark"
module.exports = function kinetic_scene(ctx, seg, t, W, H) {
  const local = t - seg.start, dur = seg.end - seg.start;
  const dark = seg.bg === 'dark';
  const g = U.linGrad(ctx, 0, 0, W, H, 160, dark ? [[0, C.greenDeep], [1, C.ink]] : [[0, C.green], [0.55, C.greenMid], [1, C.greenDark]]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // brilhos suaves + grão determinístico (textura do vídeo de referência)
  [[0.15, 0.2, 0.55], [0.9, 0.7, 0.5]].forEach(([fx, fy, r], i) => {
    const rg = ctx.createRadialGradient(W * fx, H * fy + Math.sin(local * 0.8 + i) * 30, 0, W * fx, H * fy, W * r);
    rg.addColorStop(0, 'rgba(255,255,255,0.20)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  });
  const R = U.rnd(9); ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 700; i++) ctx.fillRect(R() * W, R() * H, 2, 2);

  const lines = seg.lines || [];
  const fanN = seg.fan || 0;
  const blockTop = H * (seg.y != null ? seg.y : (fanN ? 0.12 : 0.32));
  let y = blockTop;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  lines.forEach(ln => {
    const k = U.spring(t - ln.at, 15, 9), a = U.clamp((t - ln.at) / 0.14);
    const size = ln.size || (ln.emphasis ? 112 : 78);
    ctx.font = U.font(ln.emphasis ? 800 : 700, size);
    const wl = U.wrap(ctx, ln.text, W * 0.84), lh = size * 1.1;
    if (t >= ln.at - 0.01) {
      wl.forEach((l, i) => {
        const yy = y + i * lh + (1 - k) * 60, blur = (1 - U.clamp((t - ln.at) / 0.25)) * 10;
        ctx.save(); ctx.globalAlpha = a * (ln.emphasis ? 1 : 0.94);
        if (blur > 0.5) ctx.filter = `blur(${blur.toFixed(1)}px)`;
        // aberração cromática sutil — só com verdes do logo
        ctx.fillStyle = C.greenDeep; ctx.globalAlpha *= 0.55; ctx.fillText(l, W / 2 - 4, yy + 3);
        ctx.fillStyle = '#B9EE9C'; ctx.fillText(l, W / 2 + 4, yy - 2); ctx.globalAlpha = a * (ln.emphasis ? 1 : 0.94);
        ctx.fillStyle = C.white; ctx.shadowColor = 'rgba(6,33,15,0.25)'; ctx.shadowBlur = 24; ctx.fillText(l, W / 2, yy);
        ctx.restore();
      });
    }
    y += wl.length * lh + 26;
  });
  // leque de mini-cards
  for (let i = 0; i < fanN; i++) {
    const at = seg.fan_at != null ? seg.fan_at + i * 0.12 : seg.start + 0.5 + i * 0.12;
    const k = U.spring(t - at, 13, 8); if (t < at) continue;
    const ang = (i - (fanN - 1) / 2) * 0.2, cw = W * 0.58, ch = H * 0.32;
    ctx.save(); ctx.translate(W / 2 + (i - (fanN - 1) / 2) * W * 0.17, H * 1.02 - k * H * 0.28 + Math.sin(local * 1.6 + i) * 8);
    ctx.rotate(ang);
    U.uiCard(ctx, -cw / 2, -ch / 2, cw, ch, 40, { blur: 40 });
    ctx.fillStyle = C.mist; U.roundRect(ctx, -cw / 2 + 28, -ch / 2 + 28, cw - 56, ch * 0.34, 22); ctx.fill();
    [0.55, 0.72].forEach((f, j) => { ctx.fillStyle = C.line; U.roundRect(ctx, -cw / 2 + 28, -ch / 2 + ch * f, (cw - 56) * (j ? 0.55 : 0.85), 18, 9); ctx.fill(); });
    ctx.fillStyle = i === Math.floor(fanN / 2) ? C.green : C.greenDark; U.roundRect(ctx, -cw / 2, ch / 2 - 90, cw, 90, 0); ctx.fill();
    ctx.restore();
  }
};
module.exports.sfx = seg => (seg.lines || []).map((l, i) => ({ type: l.emphasis ? 'boom' : 'whoosh', t: l.at - (l.emphasis ? 0 : 0.08), gain: l.emphasis ? 0.6 : 0.5 }));
