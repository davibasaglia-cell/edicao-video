const U = require('../utils/canvas_utils');
const F = require('../utils/fx');

// Cérebro em 3 camadas (córtex / límbico / reptiliano), igual ao quadro do treinamento.
// Contornos são desenhados ao vivo; a camada destacada acende em laranja na palavra falada.
function blob(cx, cy, rx, ry, bumps, amp, phase = 0) {
  const pts = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    const r = 1 + amp * Math.sin(bumps * a + phase) + amp * 0.5 * Math.sin((bumps * 2 + 1) * a);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return pts;
}

function brainLayers(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  const env = U.popIn(local, dur);
  const cardW = W * 0.9, cardH = 640, cardX = (W - cardW) / 2, cardY = H * (seg.y || 0.34);
  const bx = cardX + 250, by = cardY + 300;
  const layers = [
    { name: 'CÓRTEX', pts: blob(bx, by, 190, 150, 9, 0.05), lab: [cardX + cardW - 60, cardY + 150] },
    { name: 'LÍMBICO', pts: blob(bx + 6, by + 14, 118, 92, 4, 0.04, 1), lab: [cardX + cardW - 60, cardY + 300] },
    { name: 'REPTILIANO', pts: blob(bx + 12, by + 26, 52, 42, 3, 0.03, 2), lab: [cardX + cardW - 60, cardY + 450] },
  ];
  const hiIdx = layers.findIndex(l => l.name === seg.highlight);
  const hiOn = t >= seg.highlightAtOut;
  U.withTransform(ctx, W / 2, cardY + cardH / 2, env.scale, env.alpha, () => {
    U.drawCard(ctx, cardX, cardY, cardW, cardH, 34);
    layers.forEach((L, i) => {
      const k = U.easeInOutCubic((local - 0.08 - i * 0.12) / 0.45);
      const hi = i === hiIdx && hiOn;
      if (hi) {
        const pulse = 0.55 + 0.25 * Math.sin((t - seg.highlightAtOut) * 8);
        ctx.save();
        ctx.shadowColor = U.COLORS.orange; ctx.shadowBlur = 50;
        ctx.fillStyle = `rgba(245,160,32,${pulse})`;
        F.partialPolyline(ctx, L.pts, 1, true); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = hi ? U.COLORS.orange : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = hi ? 8 : 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      F.partialPolyline(ctx, L.pts, k, true); ctx.stroke();
      // linha guia até o rótulo
      const lk = U.easeOutCubic((local - 0.3 - i * 0.12) / 0.3);
      if (lk > 0) {
        const anchor = L.pts.reduce((a, p) => (p[0] > a[0] ? p : a), L.pts[0]);
        const sx = anchor[0] + 8, sy = i === 0 ? anchor[1] - 40 : anchor[1];
        const ex = L.lab[0] - 260, ey = L.lab[1];
        ctx.strokeStyle = hi ? U.COLORS.orange : 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3;
        F.partialPolyline(ctx, [[sx, sy], [ex - 30, ey], [ex, ey]], lk); ctx.stroke();
        ctx.globalAlpha = lk;
        const size = hi ? 58 : 36;
        ctx.font = U.font(hi ? 900 : 700, size, hi); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillStyle = hi ? U.COLORS.orange : '#CCCCCC';
        const sc = hi ? U.slam(t - seg.highlightAtOut, 0.15, 1.6).scale : 1;
        U.withTransform(ctx, L.lab[0] - 120, ey, sc, 1, () => ctx.fillText(L.name, L.lab[0], ey));
        ctx.globalAlpha = 1;
      }
    });
    if (seg.caption && t >= seg.captionAtOut) {
      const s = U.slam(t - seg.captionAtOut, 0.14, 1.3);
      U.withTransform(ctx, W / 2, cardY + cardH - 70, s.scale, s.alpha, () => {
        ctx.font = U.font(800, U.fitFont(ctx, seg.caption, 800, 46, cardW - 100, false, 6));
        ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
        U.fillSpaced(ctx, seg.caption, W / 2, cardY + cardH - 56, 6);
      });
    }
  });
}
brainLayers.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.8 }, { type: 'boom', t: s.highlightAtOut, gain: 0.8 },
  ...(s.captionAtOut ? [{ type: 'tick', t: s.captionAtOut, gain: 2.5 }] : [])];
module.exports = brainLayers;
