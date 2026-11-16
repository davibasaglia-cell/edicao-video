const U = require('../utils/canvas_utils');
// Transições desenhadas em canvas. p ∈ [0,1]: 0→0.5 cobre a tela, 0.5→1 revela o que está por baixo.
// A cena nova aparece exatamente em p=0.5 (tela 100% coberta).
const KINDS = {
  // mancha orgânica varrendo na diagonal (como a mancha vermelha do vídeo de referência)
  wipe(ctx, p, W, H, color) {
    const D = Math.hypot(W, H), e = U.easeInOutCubic(p);
    const lead = U.lerp(-0.7, 1.45, e), tail = U.lerp(-1.6, 0.55, e);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.62);
    const wob = (v, ph) => Math.sin(v * 0.006 + ph) * 90 + Math.sin(v * 0.013 + ph * 2) * 40;
    ctx.beginPath();
    for (let v = -D; v <= D; v += 24) { const x = lead * D - D / 2 + wob(v, 0.3); v === -D ? ctx.moveTo(x, v) : ctx.lineTo(x, v); }
    for (let v = D; v >= -D; v -= 24) ctx.lineTo(tail * D - D / 2 + wob(v, 2.1), v);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  },
  // mosaico de quadrados (eco do "pixel" do vídeo de referência) em 3 verdes do logo
  squares(ctx, p, W, H, color) {
    const cols = 9, s = Math.ceil(W / cols), rows = Math.ceil(H / s), R = U.rnd(5);
    const tones = [U.C.green, U.C.greenMid, U.C.greenDark];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = R(), b = R(), tone = tones[Math.floor(R() * 3)];
      const k = p < 0.5 ? U.clamp((p * 2 - a * 0.6) / 0.4) : 1 - U.clamp(((p - 0.5) * 2 - b * 0.6) / 0.4);
      if (k <= 0) continue;
      const sz = s * U.easeOutCubic(k) + 1;
      ctx.fillStyle = tone; ctx.fillRect(c * s + (s - sz) / 2, r * s + (s - sz) / 2, sz, sz);
    }
  },
  // círculo cobre do centro; depois abre um buraco circular que revela
  iris(ctx, p, W, H, color) {
    const maxR = Math.hypot(W, H) / 2 + 20;
    ctx.fillStyle = color;
    if (p < 0.5) { ctx.beginPath(); ctx.arc(W / 2, H / 2, maxR * U.easeInOutCubic(p * 2), 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, maxR * U.easeInOutCubic((p - 0.5) * 2), 0, Math.PI * 2, true); ctx.fill('evenodd'); }
  },
  // painel sobe cobrindo e sai por cima
  slide(ctx, p, W, H, color) {
    const e = U.easeInOutCubic(p), top = H * (1 - e * 2), bot = H * (2 - e * 2);
    ctx.fillStyle = color; ctx.fillRect(0, Math.max(0, top), W, Math.min(H, bot) - Math.max(0, top));
  },
};
function draw(ctx, kind, p, W, H, color = U.C.green) { if (KINDS[kind]) { ctx.save(); KINDS[kind](ctx, p, W, H, color); ctx.restore(); } }
module.exports = { draw, kinds: Object.keys(KINDS) };
