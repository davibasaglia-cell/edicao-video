// Cortes rítmicos: intervalos mantidos (tempo de origem) e mapeamento origem → saída.

function subtract(intervals, [a, b]) {
  const out = [];
  for (const [s, e] of intervals) {
    if (b <= s || a >= e) { out.push([s, e]); continue; }
    if (a > s) out.push([s, a]);
    if (b < e) out.push([b, e]);
  }
  return out;
}

function buildKeeps(cfg, silences) {
  const fps = cfg.fps;
  const q = x => Math.round(x * fps) / fps; // alinhar ao grid de frames → sem drift
  let keeps = [[cfg.range[0], cfg.range[1]]];
  for (const r of cfg.remove || []) keeps = subtract(keeps, r);
  const pad = cfg.silence.pad;
  for (const [s, e] of silences) {
    if (e - s < cfg.silence.min_dur) continue;
    const a = s + pad, b = e - pad;
    if (b - a > 0.05) keeps = subtract(keeps, [a, b]);
  }
  keeps = keeps.map(([s, e]) => [q(s), q(e)]).filter(([s, e]) => e - s >= 2 / fps);
  // une pedaços minúsculos separados por menos de 2 frames
  const merged = [];
  for (const k of keeps) {
    const last = merged[merged.length - 1];
    if (last && k[0] - last[1] < 2 / fps) last[1] = k[1];
    else merged.push([...k]);
  }
  let acc = 0;
  return merged.map(([s, e]) => { const r = { s, e, out: acc }; acc += e - s; return r; });
}

function makeMapper(keeps) {
  const total = keeps.length ? keeps[keeps.length - 1].out + (keeps[keeps.length - 1].e - keeps[keeps.length - 1].s) : 0;
  const map = t => {
    for (const k of keeps) {
      if (t < k.s) return k.out;            // caiu num corte → início do próximo trecho
      if (t <= k.e) return k.out + (t - k.s);
    }
    return total;
  };
  const isKept = t => keeps.some(k => t >= k.s && t <= k.e);
  const overlap = (a, b) => keeps.reduce((acc, k) => acc + Math.max(0, Math.min(b, k.e) - Math.max(a, k.s)), 0);
  return { map, isKept, overlap, total };
}

module.exports = { buildKeeps, makeMapper };
