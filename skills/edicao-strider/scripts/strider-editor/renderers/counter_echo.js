const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// "Mil vezes": a palavra se multiplica em eco pelo fundo enquanto um contador dispara até ×1000.
function counterEcho(ctx, seg, t, W, H) {
  const dur = seg.outEnd - seg.outStart, local = t - seg.outStart;
  const fade = U.clamp((dur - local) / 0.12);
  const cs = seg.countStartAtOut, ce = seg.countEndAtOut;
  const kc = U.clamp((t - cs) / (ce - cs));
  const count = t < cs ? 1 : Math.max(1, Math.round(Math.pow(seg.count_to || 1000, U.easeOutCubic(kc))));
  ctx.save();
  ctx.globalAlpha = fade;
  // ecos de fundo
  const rows = 14, rnd = F.prng(3);
  const shown = t < cs ? 0 : Math.ceil(rows * U.clamp((t - cs) / (ce - cs) * 1.1));
  ctx.font = U.font(900, 96, true); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  for (let r = 0; r < shown; r++) {
    const y = H * 0.12 + r * (H * 0.76 / rows);
    const off = (rnd() - 0.5) * 300 + Math.sin(t * 3 + r) * 20;
    const age = U.clamp((t - cs - r * (ce - cs) / rows) / 0.15);
    ctx.globalAlpha = fade * (0.12 + 0.12 * (r % 3 === 0)) * age;
    ctx.fillStyle = r % 4 === 0 ? U.COLORS.orange : U.COLORS.white;
    ctx.fillText(`${seg.echo} ${seg.echo} ${seg.echo}`, W / 2 + off, y);
  }
  ctx.globalAlpha = fade;
  // painel central
  const g = ctx.createRadialGradient(W / 2, H * 0.5, 50, W / 2, H * 0.5, W * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.25, W, H * 0.5);
  ctx.textBaseline = 'alphabetic';
  if (t >= seg.lineAtOut) {
    const s = U.slam(t - seg.lineAtOut, 0.14, 1.3);
    U.withTransform(ctx, W / 2, H * 0.4, s.scale, s.alpha, () => {
      ctx.font = U.font(800, U.fitFont(ctx, seg.line, 800, 64, W * 0.86, false, 6)); ctx.fillStyle = U.COLORS.white;
      U.fillSpaced(ctx, seg.line, W / 2, H * 0.41, 6);
    });
  }
  if (t >= cs) {
    const txt = `×${count.toLocaleString('pt-BR')}`;
    const jitter = kc < 1 ? 1 + 0.03 * Math.sin(t * 60) : U.slam(t - ce, 0.15, 1.35).scale;
    const size = U.fitFont(ctx, '×1.000', 900, 280, W * 0.88, true);
    U.withTransform(ctx, W / 2, H * 0.5, jitter, U.clamp((t - cs) / 0.08), () => {
      ctx.font = U.font(900, size, true); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 14; ctx.strokeText(txt, W / 2, H * 0.555);
      ctx.fillStyle = U.COLORS.orange; ctx.fillText(txt, W / 2, H * 0.555);
    });
  }
  if (seg.line2 && t >= seg.line2AtOut) {
    const s = U.slam(t - seg.line2AtOut, 0.14, 1.4);
    U.withTransform(ctx, W / 2, H * 0.62, s.scale, s.alpha, () => {
      ctx.font = U.font(900, U.fitFont(ctx, seg.line2, 900, 92, W * 0.86, true), true); ctx.fillStyle = U.COLORS.white;
      ctx.textAlign = 'center'; ctx.fillText(seg.line2, W / 2, H * 0.635);
    });
  }
  ctx.restore();
}
counterEcho.sfx = s => {
  const ev = [{ type: 'whoosh', t: s.lineAtOut - 0.1, gain: 0.7 }];
  for (let i = 0; i < 7; i++) ev.push({ type: 'tick', t: s.countStartAtOut + (1 - Math.pow(1 - i / 7, 1.6)) * (s.countEndAtOut - s.countStartAtOut), gain: 2 });
  ev.push({ type: 'boom', t: s.countEndAtOut, gain: 0.7 });
  if (s.line2AtOut) ev.push({ type: 'whoosh', t: s.line2AtOut - 0.08, gain: 0.55 });
  return ev;
};
module.exports = counterEcho;
