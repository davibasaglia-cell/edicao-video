const { createCanvas } = require('canvas');
const U = require('../utils/canvas_utils');
const X = require('../utils/fx2');

const COLS = 4, ROWS = 3;

function blockCanvas(w, h, label) {
  const c = createCanvas(w, h), o = c.getContext('2d');
  o.fillStyle = '#141414'; U.roundRect(o, 0, 0, w, h, 30); o.fill();
  o.strokeStyle = U.COLORS.orange; o.lineWidth = 8; U.roundRect(o, 4, 4, w - 8, h - 8, 26); o.stroke();
  o.font = U.font(800, 52); o.fillStyle = U.COLORS.orange; o.textAlign = 'left'; o.fillText('R$', 44, 86);
  const size = U.fitFont(o, label, 900, 230, w - 120, true);
  o.font = U.font(900, size, true); o.fillStyle = U.COLORS.white; o.textAlign = 'center';
  o.fillText(label, w / 2, h / 2 + size * 0.42);
  return c;
}

// "Olha pro valor e pensa que é muito… mas vê a quantidade de serviços": um bloco pesado "META"
// cai e treme na dúvida; depois se parte em peças que viram vários cards pequenos de SERVIÇO.
function metaSplit(ctx, seg, t, W, H) {
  const local = t - seg.outStart;
  const fade = X.segFade(seg, t, 0.12, 0.2);
  const bw = 720, bh = 380, cx = W / 2, cy = H * (seg.y || 0.6);
  if (!seg._block) seg._block = blockCanvas(bw, bh, seg.label);
  ctx.save();
  ctx.globalAlpha = fade;
  X.scrim(ctx, W, cy - 400, cy + 520, 0.55);

  const st = t - seg.splitAtOut;
  // queda pesada do bloco
  const drop = U.clamp(local / 0.28);
  const dy = -(1 - drop * drop) * 900;
  const land = local - 0.28;
  const squash = land > 0 && land < 0.2 ? 1 - 0.06 * Math.sin(land / 0.2 * Math.PI) : 1;
  const dt = t - seg.doubtAtOut;
  const shake = dt > 0 && st < 0 ? Math.sin(dt * 55) * 9 * Math.max(0.25, 1 - dt / 0.6) : 0;

  if (st < 0) {
    ctx.save();
    ctx.translate(cx + shake, cy + dy + bh / 2);
    ctx.scale(1 / squash, squash);
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40;
    ctx.drawImage(seg._block, -bw / 2, -bh);
    ctx.restore();
  } else {
    // peças: saem da posição no bloco e vão para a grade
    const tw = bw / COLS, th = bh / ROWS;
    const gw = 214, gh = 132, gap = 22;
    const gx0 = cx - (COLS * gw + (COLS - 1) * gap) / 2, gy0 = cy - (ROWS * gh + (ROWS - 1) * gap) / 2;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const k = U.easeOutBack((st - i * 0.025) / 0.45);
      const k0 = U.clamp(k);
      const sx = cx - bw / 2 + c * tw, sy = cy - bh / 2 + r * th;
      const tx = gx0 + c * (gw + gap), ty = gy0 + r * (gh + gap);
      const x = U.lerp(sx, tx, k), y = U.lerp(sy, ty, k);
      const w = U.lerp(tw, gw, k0), h = U.lerp(th, gh, k0);
      const rot = (1 - k0) * (((i * 7) % 5) - 2) * 0.18 + Math.sin(st * 6 + i) * 0.02 * k0;
      const flip = U.clamp((st - 0.45 - i * 0.04) / 0.2);
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
      const fx = Math.abs(Math.cos(flip * Math.PI)) || 0.01;
      ctx.scale(fx, 1);
      if (flip < 0.5) {
        ctx.drawImage(seg._block, c * tw, r * th, tw, th, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = U.COLORS.orange; U.roundRect(ctx, -w / 2, -h / 2, w, h, 18); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = U.font(900, 28, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SERVIÇO', 0, -10);
        ctx.font = U.font(800, 26); ctx.fillText('+1', 0, 26);
        ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
    }
    const lk = U.easeOutCubic((st - 0.7) / 0.3);
    if (lk > 0) {
      ctx.globalAlpha = fade * lk;
      const size = U.fitFont(ctx, seg.split_label, 900, 84, W * 0.9, true);
      X.strokedText(ctx, seg.split_label, cx, cy + bh / 2 + 150 + (1 - lk) * 40, U.font(900, size, true), U.COLORS.white, 11);
      ctx.globalAlpha = fade;
    }
  }
  // dúvida
  if (dt >= 0) {
    const out = st > 0 ? U.clamp(st / 0.2) : 0;
    const k = U.easeOutBack(dt / 0.3);
    ctx.save();
    ctx.globalAlpha = fade * (1 - out);
    ctx.translate(cx + 150, cy - bh / 2 - 90); ctx.rotate(-0.08); ctx.scale(k, k);
    X.chip(ctx, seg.doubt, 0, 0, 72, U.COLORS.orange, '#111', 40);
    ctx.restore();
  }
  ctx.restore();
}
metaSplit.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.7 }, { type: 'boom', t: s.outStart + 0.28, gain: 0.9 },
  { type: 'tick', t: s.doubtAtOut, gain: 2.5 }, { type: 'whoosh', t: s.splitAtOut - 0.06, gain: 0.8 }, { type: 'chime', t: s.splitAtOut + 0.55, gain: 1.6 }];
module.exports = metaSplit;
