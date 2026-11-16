const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// "Ficou uma coisa mais leve": Bolhas sobem devagar, as palavras sobem flutuando
// e balançam como se não tivessem peso; "no nosso dia a dia" assenta com um traço laranja desenhado.
function floatUp(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = Math.min(U.clamp(local / 0.3), U.clamp((seg.outEnd - t) / 0.2));
  const cy = H * (seg.y || 0.6);
  ctx.save();
  ctx.globalAlpha = fade;
  // escurece levemente o vídeo, com tom quente
  ctx.fillStyle = `rgba(20,12,4,${0.35 * fade})`; ctx.fillRect(0, 0, W, H);
  X.scrim(ctx, W, cy - 520, cy + 520, 0.45);

  // bolhas leves
  const rnd = F.prng(7);
  for (let i = 0; i < 22; i++) {
    const x0 = rnd() * W, sp = 120 + rnd() * 160, r = 8 + rnd() * 26, ph = rnd() * 10;
    const y = H + 60 - ((local * sp + ph * 200) % (H + 120));
    const x = x0 + Math.sin(local * 1.5 + ph) * 30;
    ctx.globalAlpha = fade * 0.5;
    ctx.strokeStyle = i % 4 === 0 ? U.COLORS.orange : 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = fade;

  // palavras flutuando
  const words = seg.words || [];
  words.forEach((w, i) => {
    const lt = t - w.atOut;
    if (lt < 0) return;
    const big = i === words.length - 1;
    const size = big ? U.fitFont(ctx, w.text, 900, 330, W * 0.9, true) : 130;
    const k = U.easeOutCubic(lt / 0.9);
    const baseY = big ? cy + 120 : cy - 170;
    const y = U.lerp(baseY + 260, baseY, k) + Math.sin(lt * 2.2 + i) * 12;
    const rot = Math.sin(lt * 1.7 + i * 2) * 0.035;
    ctx.save();
    ctx.globalAlpha = fade * U.clamp(lt / 0.35);
    ctx.translate(W / 2, y); ctx.rotate(rot);
    X.strokedText(ctx, w.text, 0, 0, U.font(900, size, true), big ? U.COLORS.orange : U.COLORS.white, big ? 16 : 11);
    ctx.restore();
  });

  if (seg.line && seg.lineAtOut != null && t >= seg.lineAtOut) {
    const lt = t - seg.lineAtOut;
    const k = U.easeOutCubic(lt / 0.35);
    ctx.globalAlpha = fade * k;
    const size = U.fitFont(ctx, seg.line, 800, 58, W * 0.88, false, 7);
    ctx.font = U.font(800, size); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
    const y = cy + 290;
    U.fillSpaced(ctx, seg.line, W / 2, y + (1 - k) * 30, 7);
    const tw = F.spacedWidth(ctx, seg.line, 7);
    const dk = U.easeInOutCubic((lt - 0.2) / 0.45);
    if (dk > 0) {
      ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 10; ctx.lineCap = 'round';
      const pts = [];
      for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push([W / 2 - tw / 2 + s * tw, y + 34 + Math.sin(s * Math.PI * 3) * 6]); }
      F.partialPolyline(ctx, pts, dk); ctx.stroke();
    }
  }
  ctx.restore();
}
floatUp.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.05, gain: 0.6 },
  ...(s.words || []).map((w, i, a) => i === a.length - 1 ? { type: 'boom', t: w.atOut, gain: 0.7 } : { type: 'whoosh', t: w.atOut - 0.05, gain: 0.5 }),
  ...(s.lineAtOut != null ? [{ type: 'chime', t: s.lineAtOut + 0.2, gain: 1.2 }] : [])];
module.exports = floatUp;
