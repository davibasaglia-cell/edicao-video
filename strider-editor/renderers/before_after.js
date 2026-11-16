const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

// "Antes … e depois": dois cards lado a lado. ANTES entra apagado com uma linha reta e sem graça;
// uma seta curva se desenha e DEPOIS bate em laranja com uma linha que dá um salto para cima.
function beforeAfter(ctx, seg, t, W, H) {
  const fade = X.segFade(seg, t, 0.1, 0.2);
  const cy = H * (seg.y || 0.6);
  const pw = 420, ph = 470, gap = 70;
  const lx = W / 2 - gap / 2 - pw, rx = W / 2 + gap / 2;
  const py = cy - ph / 2;
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, py - 200, py + ph + 260, 0.55);

  const panel = (x, label, on, k, kind) => {
    ctx.save();
    ctx.translate(x + pw / 2, cy);
    ctx.scale(k, k);
    ctx.translate(-(x + pw / 2), -cy);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 26;
    ctx.fillStyle = on ? U.COLORS.orange : 'rgba(30,30,30,0.92)';
    U.roundRect(ctx, x, py, pw, ph, 30); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = U.font(900, 76, true); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = on ? '#111' : '#8a8a8a';
    ctx.fillText(label, x + pw / 2, py + 110);
    // mini gráfico
    const gx = x + 50, gw = pw - 100, gy = py + ph - 70, gh = 230;
    ctx.strokeStyle = on ? 'rgba(17,17,17,0.35)' : 'rgba(255,255,255,0.15)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
    const pts = kind === 'flat'
      ? [[0, 0.22], [0.2, 0.28], [0.4, 0.2], [0.6, 0.26], [0.8, 0.19], [1, 0.24]]
      : [[0, 0.18], [0.25, 0.24], [0.45, 0.3], [0.6, 0.42], [0.75, 0.68], [1, 0.97]];
    const P = pts.map(([a, b]) => [gx + a * gw, gy - b * gh]);
    ctx.strokeStyle = on ? '#111' : '#9a9a9a'; ctx.lineWidth = on ? 11 : 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lk = kind === 'flat' ? U.clamp((t - seg.beforeAtOut - 0.15) / 0.5) : U.easeInOutCubic((t - seg.afterAtOut - 0.12) / 0.45);
    const head = F.partialPolyline(ctx, P, lk); ctx.stroke();
    if (on && lk > 0.98) {
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.moveTo(head[0] + 6, head[1] - 34); ctx.lineTo(head[0] + 30, head[1] + 6); ctx.lineTo(head[0] - 18, head[1] + 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  const bk = U.easeOutBack((t - seg.beforeAtOut) / 0.3);
  if (t >= seg.beforeAtOut) panel(lx, seg.before, false, bk, 'flat');
  // seta curva entre os cards
  const ak = U.easeInOutCubic((t - seg.beforeAtOut - 0.5) / Math.max(0.4, seg.afterAtOut - seg.beforeAtOut - 0.6));
  if (ak > 0) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const s = i / 30;
      pts.push([U.lerp(lx + pw * 0.55, rx + pw * 0.45, s), py - 40 - Math.sin(s * Math.PI) * 120]);
    }
    ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.setLineDash([18, 14]);
    const head = F.partialPolyline(ctx, pts, ak); ctx.stroke();
    ctx.setLineDash([]);
    if (ak > 0.95) {
      ctx.fillStyle = U.COLORS.white;
      ctx.beginPath(); ctx.moveTo(head[0] + 4, head[1] + 30); ctx.lineTo(head[0] - 24, head[1] - 10); ctx.lineTo(head[0] + 24, head[1] - 14); ctx.closePath(); ctx.fill();
    }
  }
  if (t >= seg.afterAtOut) {
    const s = U.slam(t - seg.afterAtOut, 0.15, 1.5);
    ctx.save(); ctx.globalAlpha = fade * s.alpha;
    panel(rx, seg.after, true, s.scale, 'jump');
    ctx.restore();
  }
  if (seg.sub && t >= seg.afterAtOut + 0.25) {
    const k = U.easeOutCubic((t - seg.afterAtOut - 0.25) / 0.3);
    ctx.globalAlpha = fade * k;
    const size = U.fitFont(ctx, seg.sub, 800, 46, W * 0.9, false, 5);
    ctx.font = U.font(800, size); ctx.fillStyle = U.COLORS.white;
    U.fillSpaced(ctx, seg.sub, W / 2, py + ph + 110 + (1 - k) * 30, 5);
  }
  ctx.restore();
}
beforeAfter.sfx = s => [{ type: 'whoosh', t: s.beforeAtOut - 0.08, gain: 0.7 }, { type: 'whoosh', t: s.afterAtOut - 0.1, gain: 0.6 },
  { type: 'boom', t: s.afterAtOut, gain: 0.9 }];
module.exports = beforeAfter;
