// Utilitários de desenho + PALETA SICREDI (única paleta permitida).
const { registerFont, loadImage } = require('canvas');
const path = require('path');

const FONT_DIR = '/usr/share/fonts/opentype/inter';
// Uma família só (Inter), variando o peso — igual ao vídeo de referência (grotesca limpa).
[
  ['Inter-Regular.otf', '400'], ['Inter-Medium.otf', '500'], ['Inter-SemiBold.otf', '600'],
  ['Inter-Bold.otf', '700'], ['Inter-ExtraBold.otf', '800'], ['Inter-Black.otf', '900'],
].forEach(([file, weight]) => { try { registerFont(path.join(FONT_DIR, file), { family: 'Inter', weight }); } catch (_) {} });

// Cores tiradas do logo da Sicredi (amostradas do PNG oficial). Só tons/tints/sombras DESTAS cores + branco.
const C = {
  green: '#64C830',      // verde Sicredi (principal, ênfase)
  greenMid: '#3FA11E',   // transição entre os dois verdes do ícone
  greenDark: '#147136',  // verde escuro do ícone
  greenDeep: '#006426',  // verde mais profundo do ícone
  ink: '#06210F',        // "preto" = verde profundo bem escuro (superfícies escuras, texto)
  white: '#FFFFFF',
  mist: '#F2F8EF',       // branco esverdeado (fundos claros)
  line: '#D5E6CC',       // divisórias suaves
  muted: '#6F8A66',      // texto secundário
};
const ASSETS = path.join(__dirname, '..', '..', '..', 'assets');
const assets = {};
async function loadAssets() {
  for (const n of ['sicredi_logo', 'sicredi_icon', 'sicredi_wordmark']) assets[n] = await loadImage(path.join(ASSETS, n + '.png'));
  return assets;
}

const font = (weight, size) => `${weight} ${Math.round(size)}px Inter`;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInCubic = t => Math.pow(clamp(t), 3);
const easeInOutCubic = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutBack = (t, s = 1.70158) => { t = clamp(t); const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
// mola amortecida (0→1 com leve overshoot), t em segundos
const spring = (t, k = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * (Math.cos(k * t) + (d / k) * Math.sin(k * t));
const rnd = seed => { let x = (seed * 9301 + 49297) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Card branco estilo UI com sombra suave (assinatura do vídeo de referência)
function uiCard(ctx, x, y, w, h, r = 44, opts = {}) {
  ctx.save();
  ctx.shadowColor = opts.shadow || 'rgba(6,33,15,0.28)';
  ctx.shadowBlur = opts.blur || 50; ctx.shadowOffsetY = opts.offY != null ? opts.offY : 18;
  ctx.fillStyle = opts.fill || C.white;
  roundRect(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();
}

function fitFont(ctx, text, weight, maxSize, maxWidth) {
  let size = maxSize;
  while (size > 10) { ctx.font = font(weight, size); if (ctx.measureText(text).width <= maxWidth) break; size -= 2; }
  return size;
}

// quebra texto em linhas que cabem em maxWidth
function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/), lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(t).width > maxWidth) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Envelope de entrada/saída: { alpha, scale } (pop com mola)
function pop(local, dur, o = {}) {
  const inD = o.inDur || 0.35, outD = o.outDur || 0.18, from = o.from != null ? o.from : 0.8;
  const sc = lerp(from, 1, clamp(spring(local, 16, 8)));
  const alpha = Math.min(clamp(local / 0.12), clamp((dur - local) / outD));
  return { alpha, scale: sc };
}
function around(ctx, cx, cy, scale, alpha, fn) {
  ctx.save(); ctx.globalAlpha *= clamp(alpha);
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy); fn(); ctx.restore();
}

// gradiente linear de ângulo livre dentro de um retângulo
function linGrad(ctx, x, y, w, h, deg, stops) {
  const a = deg * Math.PI / 180, cx = x + w / 2, cy = y + h / 2, L = Math.abs(w * Math.sin(a)) / 2 + Math.abs(h * Math.cos(a)) / 2;
  const g = ctx.createLinearGradient(cx - Math.sin(a) * L, cy + Math.cos(a) * L, cx + Math.sin(a) * L, cy - Math.cos(a) * L);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

module.exports = { C, assets, loadAssets, font, clamp, lerp, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack, spring, rnd,
  roundRect, uiCard, fitFont, wrap, pop, around, linGrad };
