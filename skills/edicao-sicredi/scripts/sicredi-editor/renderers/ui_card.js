const U = require('../utils/canvas_utils');
const { C } = U;
// Card branco de UI que sobe sobre o orador e "mostra" o que está sendo dito.
// variant: "slider" (régua de progresso) | "timeline" (linha vertical com etapas) | "stat" (número que conta)
// Tudo em out-time: seg.start/seg.end, items[].at, stages[].at
module.exports = function ui_card(ctx, seg, t, W, H) {
  const local = t - seg.start, dur = seg.end - seg.start;
  const variant = seg.variant || 'slider';
  const w = W * 0.86, x = (W - w) / 2;
  const h = seg.h || (variant === 'timeline' ? H * 0.36 : variant === 'stat' ? H * 0.2 : H * 0.15);
  const yBase = H * (seg.y != null ? seg.y : (variant === 'timeline' ? 0.54 : 0.66));
  const inK = U.spring(local, 15, 9), outK = U.easeInCubic((local - (dur - 0.22)) / 0.22);
  const y = yBase + (1 - inK) * H * 0.35 + outK * H * 0.3;
  ctx.save(); ctx.globalAlpha = U.clamp(local / 0.1) * (1 - outK);
  U.uiCard(ctx, x, y, w, h, 46);
  const pad = w * 0.07;
  if (variant === 'slider') slider(ctx, seg, t, x, y, w, h, pad);
  else if (variant === 'timeline') timeline(ctx, seg, t, x, y, w, h, pad);
  else stat(ctx, seg, t, x, y, w, h, pad);
  ctx.restore();
};

function header(ctx, seg, x, y, w, pad) {
  const chip = 46;
  U.roundRect(ctx, x + pad, y + pad * 0.8, chip, chip, 12); ctx.fillStyle = C.green; ctx.fill();
  ctx.fillStyle = C.white; ctx.font = U.font(800, 24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((seg.chip || seg.title || 'S')[0].toUpperCase(), x + pad + chip / 2, y + pad * 0.8 + chip / 2 + 1);
  ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = U.font(600, 30);
  ctx.fillText(seg.title || '', x + pad + chip + 18, y + pad * 0.8 + chip / 2 + 1);
  [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.arc(x + w - pad - 40 + i * 18, y + pad * 0.8 + chip / 2, 3.5, 0, 7); ctx.fillStyle = C.line; ctx.fill(); });
}

function slider(ctx, seg, t, x, y, w, h, pad) {
  header(ctx, seg, x, y, w, pad);
  const ty = y + h * 0.66, x0 = x + pad, x1 = x + w - pad;
  const st = seg.stages || [{ at: seg.start, value: 1 }];
  // posição do thumb: interpola (easeInOut) para o próximo stage quando ele chega
  let v = 0;
  for (let i = 0; i < st.length; i++) { const prev = i ? st[i - 1].value : 0; v = U.lerp(prev, st[i].value, U.easeInOutCubic((t - st[i].at) / (st[i].dur || 0.6))); if (t < st[i].at + (st[i].dur || 0.6)) break; }
  const tx = U.lerp(x0, x1, v);
  ctx.lineCap = 'round'; ctx.lineWidth = 8;
  ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x1, ty); ctx.stroke();
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.greenDark); g.addColorStop(1, C.green);
  ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(tx, ty); ctx.stroke();
  const labels = seg.labels || [];
  labels.forEach((lb, i) => { const lx = U.lerp(x0, x1, labels.length > 1 ? i / (labels.length - 1) : 0);
    ctx.fillStyle = C.muted; ctx.font = U.font(500, 22); ctx.textAlign = i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(lb, lx, ty + 44); });
  ctx.save(); ctx.shadowColor = 'rgba(6,33,15,0.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.arc(tx, ty, 21, 0, 7); ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(tx, ty, 21, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = C.green; ctx.stroke();
}

function timeline(ctx, seg, t, x, y, w, h, pad) {
  const items = seg.items || [];
  const x0 = x + pad + 20, top = y + pad, bot = y + h - pad;
  const n = Math.max(items.length, 2), gap = (bot - top) / (n - 1);
  // trilho + progresso
  ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.line;
  ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bot); ctx.stroke();
  const reached = items.reduce((m, it, i) => t >= it.at ? i : m, -1);
  const nextAt = items[reached + 1] ? items[reached + 1].at : null;
  let prog = reached < 0 ? 0 : reached;
  if (nextAt != null && reached >= 0) prog += U.easeInOutCubic((t - (nextAt - 0.5)) / 0.5);
  ctx.strokeStyle = C.green; ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, top + gap * Math.min(prog, n - 1)); ctx.stroke();
  items.forEach((it, i) => {
    const cy = top + gap * i, k = U.clamp((t - it.at) / 0.4), active = i === reached;
    const kk = U.spring(t - it.at, 16, 8);
    if (t >= it.at - 0.01) {
      if (active) { ctx.beginPath(); ctx.arc(x0, cy, 30 * kk, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = C.green; ctx.stroke();
        ctx.beginPath(); ctx.arc(x0, cy, 15 * kk, 0, 7); ctx.fillStyle = C.green; ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x0, cy, 13, 0, 7); ctx.fillStyle = C.greenDark; ctx.globalAlpha *= 0.55; ctx.fill(); ctx.globalAlpha /= 0.55; }
      // máquina de escrever: caracteres aparecem em ~0.7s
      const txt = it.text || '', nch = Math.ceil(txt.length * U.clamp((t - it.at) / Math.min(0.9, 0.04 * txt.length + 0.1)));
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = active ? C.ink : C.muted;
      ctx.font = U.font(active ? 700 : 500, active ? 38 : 30);
      const lines = U.wrap(ctx, txt.slice(0, nch), w - pad * 2 - 90);
      lines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, x0 + 54, cy + (li - (Math.min(lines.length, 2) - 1) / 2) * 44));
    } else { ctx.beginPath(); ctx.arc(x0, cy, 11, 0, 7); ctx.fillStyle = C.line; ctx.fill(); }
  });
}

function stat(ctx, seg, t, x, y, w, h, pad) {
  header(ctx, seg, x, y, w, pad);
  const k = U.easeOutCubic((t - seg.start - 0.15) / (seg.count_dur || 1.0));
  const val = U.lerp(seg.from || 0, seg.value, k), dec = seg.decimals || 0;
  const num = (seg.prefix || '') + val.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (seg.suffix || '');
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = C.ink;
  const sz = U.fitFont(ctx, num, 800, 120, w - pad * 2); ctx.font = U.font(800, sz);
  ctx.fillText(num, x + pad, y + h - pad * 0.9);
  if (seg.caption) { ctx.font = U.font(500, 26); ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(seg.caption, x + w - pad, y + h - pad * 0.95); }
}
module.exports.sfx = seg => [{ type: 'whoosh', t: seg.start - 0.1, gain: 0.8 },
  ...(seg.items || []).map(i => ({ type: 'tick', t: i.at, gain: 3 })), ...(seg.stages || []).slice(1).map(s => ({ type: 'tick', t: s.at, gain: 3 }))];
