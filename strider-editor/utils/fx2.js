// Helpers do 3º vídeo (feedback Clínica Áurea): trilha de pontos no tempo, texto desfocado,
// ícone de pessoa, etiqueta (chip) e texto com contorno.
const { createCanvas } = require('canvas');
const U = require('./canvas_utils');

// Interpola uma trilha [{atOut, x, y}] (x,y em fração da tela) no tempo t
function track(points, t) {
  if (!points || !points.length) return null;
  if (t <= points[0].atOut) return [points[0].x, points[0].y];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (t <= b.atOut) {
      const k = U.easeInOutCubic((t - a.atOut) / Math.max(0.001, b.atOut - a.atOut));
      return [U.lerp(a.x, b.x, k), U.lerp(a.y, b.y, k)];
    }
  }
  const l = points[points.length - 1];
  return [l.x, l.y];
}

// Texto desfocado: desenha pequeno e amplia (node-canvas não tem ctx.filter). blur 0..1
function blurredText(ctx, text, cx, baseline, fontStr, color, blur) {
  ctx.font = fontStr;
  const m = ctx.measureText(text);
  const pad = 80;
  const w = Math.ceil(m.width + pad * 2), h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2);
  const s = U.lerp(1, 0.06, U.clamp(blur));
  const off = createCanvas(Math.max(2, Math.ceil(w * s)), Math.max(2, Math.ceil(h * s))), o = off.getContext('2d');
  o.scale(s, s);
  o.font = fontStr; o.textAlign = 'center'; o.fillStyle = color;
  o.fillText(text, w / 2, pad + m.actualBoundingBoxAscent);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, cx - w / 2, baseline - m.actualBoundingBoxAscent - pad, w, h);
  ctx.restore();
}

// Pessoa em linha/sólida (cabeça + ombros), tamanho r
function person(ctx, cx, cy, r, fill) {
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.55, r * 0.42, 0, Math.PI * 2);
  if (fill) ctx.fill(); else ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.75, r * 0.8, Math.PI * 1.08, Math.PI * 1.92);
  if (fill) { ctx.closePath(); ctx.fill(); } else ctx.stroke();
}

// Chip/pílula com texto centralizado em (cx, cy)
function chip(ctx, text, cx, cy, size, bg, fg, padX = 34) {
  ctx.font = U.font(900, size, true);
  const w = ctx.measureText(text).width + padX * 2, h = size * 1.55;
  ctx.fillStyle = bg; U.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + size * 0.04);
  ctx.textBaseline = 'alphabetic';
  return w;
}

// Texto grande com contorno escuro
function strokedText(ctx, text, x, y, fontStr, color, lw = 12, align = 'center') {
  ctx.font = fontStr; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = lw; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

// Faixa escura com degradê vertical para dar leitura ao motion
function scrim(ctx, W, y0, y1, a = 0.55) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, `rgba(0,0,0,${a})`);
  g.addColorStop(0.75, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
}

// Fade de entrada/saída simples do segmento inteiro
function segFade(seg, t, inD = 0.12, outD = 0.15) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  return Math.min(U.clamp(local / inD), U.clamp((dur - local) / outD));
}

module.exports = { track, blurredText, person, chip, strokedText, scrim, segFade };
