const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Título digitado letra a letra (cursor laranja piscando) + abas que acendem na palavra falada.
function typewriterTabs(ctx, seg, t, W, H) {
  const env = F.fadeEnv(t, seg.outStart, seg.outEnd, 0.1, 0.15);
  const y = H * (seg.y || 0.44);
  ctx.save();
  ctx.globalAlpha = env;
  const g = ctx.createLinearGradient(0, y - 330, 0, y + 330);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(0,0,0,0.62)'); g.addColorStop(0.75, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 330, W, 660);

  // título: duas linhas digitadas em sequência
  const lines = seg.title_lines;
  const ta = seg.titleAtOut ?? seg.outStart, td = seg.type_dur || 0.75;
  const totalChars = lines.reduce((a, l) => a + l.length, 0);
  let typed = Math.floor(U.clamp((t - ta) / td) * totalChars);
  const size = Math.min(...lines.map(l => U.fitFont(ctx, l, 900, 150, W * 0.86, true)));
  ctx.font = U.font(900, size, true); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let cursor = null;
  lines.forEach((l, i) => {
    const ly = y - 150 + i * size * 1.02;
    const fw = ctx.measureText(l).width, x0 = (W - fw) / 2;
    const n = Math.max(0, Math.min(l.length, typed));
    typed -= l.length;
    const sub = l.slice(0, n);
    ctx.fillStyle = i === lines.length - 1 ? U.COLORS.orange : U.COLORS.white;
    F.strokeFill(ctx, sub, x0, ly, ctx.fillStyle, 10);
    if (n < l.length && !cursor) cursor = [x0 + ctx.measureText(sub).width + 8, ly];
    if (i === lines.length - 1 && n === l.length && !cursor) cursor = [x0 + fw + 8, ly];
  });
  const doneT = ta + td;
  if (cursor && (t < doneT || Math.floor((t - doneT) * 3) % 2 === 0) && t < (seg.tabs[0].atOut || 99)) {
    ctx.fillStyle = U.COLORS.orange; ctx.fillRect(cursor[0], cursor[1] - size * 0.78, 12, size * 0.85);
  }

  // abas
  const tabs = seg.tabs;
  ctx.font = U.font(800, 52);
  const tw = tabs.map(tb => ctx.measureText(tb.text).width + 90);
  const gap = 90, total = tw.reduce((a, b) => a + b, 0) + gap * (tabs.length - 1);
  let x = (W - total) / 2;
  const ty = y + size * 1.02 * (lines.length - 1) - 40;
  const appear = U.clamp((t - doneT) / 0.25);
  tabs.forEach((tb, i) => {
    const on = t >= tb.atOut;
    const k = on ? U.clamp((t - tb.atOut) / 0.18) : 0;
    const bump = on ? 1 + 0.18 * Math.sin(Math.PI * k) : 1;
    const w = tw[i], h = 104, cx = x + w / 2;
    U.withTransform(ctx, cx, ty + h / 2, bump * U.lerp(0.7, 1, U.easeOutBack(appear)), appear, () => {
      ctx.fillStyle = on ? U.COLORS.orange : 'rgba(255,255,255,0.08)';
      U.roundRect(ctx, x, ty, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = on ? U.COLORS.orange : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = on ? '#111' : 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = U.font(800, 52); ctx.fillText(tb.text, cx, ty + h / 2 + 3);
    });
    if (i < tabs.length - 1) {
      ctx.globalAlpha = env * appear; ctx.fillStyle = U.COLORS.white; ctx.font = U.font(900, 56, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', x + w + gap / 2, ty + h / 2 + 3); ctx.globalAlpha = env;
    }
    x += w + gap;
  });
  ctx.restore();
}
typewriterTabs.sfx = s => {
  const ev = [];
  const ta = s.titleAtOut ?? s.outStart, td = s.type_dur || 0.75;
  for (let i = 0; i < 7; i++) ev.push({ type: 'tick', t: ta + i * td / 7, gain: 1.4 });
  s.tabs.forEach(tb => ev.push({ type: 'boom', t: tb.atOut, gain: 0.55 }));
  return ev;
};
module.exports = typewriterTabs;
