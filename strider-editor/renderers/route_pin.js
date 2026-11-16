const U = require('../utils/canvas_utils');
const F = require('../utils/fx');
const X = require('../utils/fx2');

function bezierPts(p0, p1, p2, p3, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, a = (1 - s) ** 3, b = 3 * (1 - s) ** 2 * s, c = 3 * (1 - s) * s * s, d = s ** 3;
    pts.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return pts;
}

function pinShape(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - r * 0.3, y - r * 0.9, x - r, y - r * 1.25, x - r, y - r * 1.9);
  ctx.arc(x, y - r * 1.9, r, Math.PI, 0);
  ctx.bezierCurveTo(x + r, y - r * 1.25, x + r * 0.3, y - r * 0.9, x, y);
  ctx.closePath();
}

// "Direcionamento": uma rota tracejada se desenha do ponto de partida até o destino, o pin cai
// quicando na palavra; depois a equipe aparece ao longo do caminho ("suporte de toda a equipe").
function routePin(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, H * 0.44, H * 0.9, 0.6);

  const p0 = [W * 0.12, H * 0.75], p3 = [W * 0.84, H * 0.64];
  const pts = bezierPts(p0, [W * 0.35, H * 0.55], [W * 0.55, H * 0.86], p3);
  const drawK = U.easeInOutCubic(local / Math.max(0.4, seg.pinAtOut - seg.outStart));
  // rota (base apagada + traço laranja tracejado andando)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 14;
  F.partialPolyline(ctx, pts, drawK); ctx.stroke();
  ctx.setLineDash([26, 20]); ctx.lineDashOffset = -local * 60;
  ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 9;
  const head = F.partialPolyline(ctx, pts, drawK); ctx.stroke();
  ctx.setLineDash([]);
  // partida
  ctx.fillStyle = U.COLORS.white; ctx.beginPath(); ctx.arc(p0[0], p0[1], 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p0[0], p0[1], 28, 0, Math.PI * 2); ctx.stroke();
  if (drawK < 1) { ctx.fillStyle = U.COLORS.white; ctx.beginPath(); ctx.arc(head[0], head[1], 10, 0, Math.PI * 2); ctx.fill(); }

  // equipe ao longo da rota
  if (seg.teamAtOut != null) {
    [0.3, 0.52, 0.74].forEach((f, i) => {
      const lt = t - seg.teamAtOut - i * 0.14;
      if (lt < 0) return;
      const k = U.easeOutBack(lt / 0.3);
      const [px, py] = pts[Math.round(f * (pts.length - 1))];
      ctx.save();
      ctx.translate(px, py - 70); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(12,12,12,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = U.COLORS.white; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = U.COLORS.white; X.person(ctx, 0, 6, 30, true);
      ctx.restore();
    });
    const lk = U.easeOutCubic((t - seg.teamAtOut - 0.35) / 0.3);
    if (lk > 0) {
      ctx.globalAlpha = fade * lk;
      const size = U.fitFont(ctx, seg.team_label, 800, 50, W * 0.9, false, 5);
      ctx.font = U.font(800, size); ctx.fillStyle = U.COLORS.white; ctx.textBaseline = 'alphabetic';
      U.fillSpaced(ctx, seg.team_label, W / 2, H * 0.83 + (1 - lk) * 30, 5);
      ctx.globalAlpha = fade;
    }
  }

  // pin caindo
  const lt = t - seg.pinAtOut;
  if (lt >= 0) {
    const drop = U.clamp(lt / 0.22);
    const bounce = lt < 0.22 ? -(1 - drop * drop) * 300 : -Math.abs(Math.sin((lt - 0.22) * 14)) * 40 * Math.exp(-(lt - 0.22) * 7);
    const rip = (lt % 1.1) / 1.1;
    ctx.save();
    ctx.globalAlpha = fade * (1 - rip);
    ctx.strokeStyle = U.COLORS.orange; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(p3[0], p3[1], 20 + rip * 90, (20 + rip * 90) * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
    ctx.fillStyle = U.COLORS.orange; pinShape(ctx, p3[0], p3[1] + bounce, 44); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(p3[0], p3[1] + bounce - 44 * 1.9, 17, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // rótulo
    const s = U.slam(lt, 0.15, 1.5);
    const size = U.fitFont(ctx, seg.pin_label, 900, 130, W * 0.9, true);
    U.withTransform(ctx, W / 2, H * 0.52, s.scale, s.alpha * fade, () => {
      X.strokedText(ctx, seg.pin_label, W / 2, H * 0.52 + size * 0.35, U.font(900, size, true), U.COLORS.orange, 13);
    });
  }
  ctx.restore();
}
routePin.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.08, gain: 0.75 }, { type: 'boom', t: s.pinAtOut + 0.2, gain: 0.85 },
  ...(s.teamAtOut != null ? [0, 1, 2].map(i => ({ type: 'tick', t: s.teamAtOut + i * 0.14, gain: 2.2 })) : [])];
module.exports = routePin;
