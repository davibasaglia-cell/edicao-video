const { registerFont } = require('canvas');
const path = require('path');

const FONT_DIR = '/usr/share/fonts/opentype/inter';
// Uma única família (Inter) — só variações de peso (regra 7 do estilo)
[
  ['Inter-Regular.otf', '400', 'normal'],
  ['Inter-SemiBold.otf', '600', 'normal'],
  ['Inter-Bold.otf', '700', 'normal'],
  ['Inter-ExtraBold.otf', '800', 'normal'],
  ['Inter-ExtraBoldItalic.otf', '800', 'italic'],
  ['Inter-Black.otf', '900', 'normal'],
  ['Inter-BlackItalic.otf', '900', 'italic'],
].forEach(([file, weight, style]) => {
  try { registerFont(path.join(FONT_DIR, file), { family: 'Inter', weight, style }); } catch (_) {}
});

const COLORS = {
  orange: '#F5A020',
  white: '#FFFFFF',
  yellow: '#FFD700',
  card: 'rgba(15, 15, 15, 0.82)',
};

const font = (weight, size, italic = false) => `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px Inter`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Cantos estilo viewfinder (regra 5: card sempre com corner brackets)
function drawCornerBrackets(ctx, x, y, w, h, opts = {}) {
  const len = opts.len || 46;
  const inset = opts.inset || 22;
  ctx.save();
  ctx.strokeStyle = opts.color || 'rgba(255,255,255,0.9)';
  ctx.lineWidth = opts.width || 5;
  ctx.lineCap = 'square';
  const L = x + inset, R = x + w - inset, T = y + inset, B = y + h - inset;
  ctx.beginPath();
  ctx.moveTo(L, T + len); ctx.lineTo(L, T); ctx.lineTo(L + len, T);
  ctx.moveTo(R - len, T); ctx.lineTo(R, T); ctx.lineTo(R, T + len);
  ctx.moveTo(R, B - len); ctx.lineTo(R, B); ctx.lineTo(R - len, B);
  ctx.moveTo(L + len, B); ctx.lineTo(L, B); ctx.lineTo(L, B - len);
  ctx.stroke();
  ctx.restore();
}

function drawCard(ctx, x, y, w, h, r = 32) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = COLORS.card;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  drawCornerBrackets(ctx, x, y, w, h);
}

// Fonte que cabe numa largura máxima
function fitFont(ctx, text, weight, maxSize, maxWidth, italic = false, spacing = 0) {
  let size = maxSize;
  while (size > 12) {
    ctx.font = font(weight, size, italic);
    const w = ctx.measureText(text).width + spacing * Math.max(0, text.length - 1);
    if (w <= maxWidth) break;
    size -= 2;
  }
  return size;
}

// Texto com letter-spacing manual (node-canvas não tem ctx.letterSpacing confiável)
function fillSpaced(ctx, text, cx, y, spacing, stroke = false) {
  if (!spacing) {
    ctx.textAlign = 'center';
    if (stroke) ctx.strokeText(text, cx, y);
    ctx.fillText(text, cx, y);
    return;
  }
  const chars = [...text];
  const widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    if (stroke) ctx.strokeText(c, x, y);
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = 'center';
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInOutCubic = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutBack = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// Envelope de entrada/saída de um elemento: { alpha, scale }
function popIn(local, dur, total, opts = {}) {
  const inDur = opts.inDur || 0.22;
  const outDur = opts.outDur || 0.12;
  const from = opts.from != null ? opts.from : 0.82;
  const kIn = clamp(local / inDur);
  const kOut = clamp((dur - local) / outDur);
  const alpha = Math.min(clamp(local / (inDur * 0.6)), kOut);
  const scale = lerp(from, 1, easeOutBack(kIn));
  return { alpha, scale };
}

// Batida "slam": começa grande e assenta
function slam(local, dur = 0.16, from = 1.45) {
  const k = clamp(local / dur);
  return { alpha: clamp(local / (dur * 0.5)), scale: lerp(from, 1, easeOutCubic(k)) };
}

function withTransform(ctx, cx, cy, scale, alpha, fn) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

module.exports = {
  COLORS, font, roundRect, drawCornerBrackets, drawCard, fitFont, fillSpaced,
  clamp, lerp, easeOutCubic, easeInOutCubic, easeOutBack, popIn, slam, withTransform,
};
