// Prévia rápida (sem renderizar o vídeo): desenha um frame de cada motion em cima do frame da base.
// Uso: node preview.js <saida.png> [tempo_original ...]
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const { createCanvas, loadImage } = require('canvas');
const { makeMapper } = require('./utils/timeline');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(__dirname, 'output/timeline.json'), 'utf8'));
const mapper = makeMapper(tl.keeps); const m = t => mapper.map(t);
const R = {}; for (const f of fs.readdirSync(path.join(__dirname, 'renderers'))) R[f.replace('.js', '')] = require('./renderers/' + f);
const W = cfg.width, H = cfg.height, dur = mapper.total + cfg.tail_hold;
const segs = cfg.segments.map(s => {
  const r = { ...s, outStart: m(s.start), outEnd: s.end >= cfg.range[1] ? dur : m(s.end) };
  for (const [k, v] of Object.entries(s)) {
    if (k.endsWith('_at') && typeof v === 'number') r[k.slice(0, -3).replace(/_(\w)/g, (_, c) => c.toUpperCase()) + 'AtOut'] = m(v);
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0].at != null) r[k] = v.map(o => ({ ...o, atOut: m(o.at) }));
  }
  return r;
});
(async () => {
  const [out, ...times] = process.argv.slice(2);
  const tiles = [];
  for (const to of times.map(Number)) {
    const t = m(to);
    const png = path.join(path.dirname(out), `pv_${to}.png`);
    const seg = segs.find(s => t >= s.outStart && t < s.outEnd);
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', path.join(__dirname, 'output/base.mkv'), '-frames:v', '1',
      ...(seg && seg.bw ? ['-vf', 'hue=s=0'] : []), png]);
    const c = createCanvas(W, H), ctx = c.getContext('2d');
    ctx.drawImage(await loadImage(png), 0, 0, W, H);
    if (seg) { ctx.save(); R[seg.type](ctx, seg, t, W, H); ctx.restore(); }
    tiles.push(c);
  }
  const tw = 360, th = 640, cols = Math.min(5, tiles.length), rows = Math.ceil(tiles.length / cols);
  const sheet = createCanvas(tw * cols, th * rows), sc = sheet.getContext('2d');
  tiles.forEach((c, i) => sc.drawImage(c, (i % cols) * tw, Math.floor(i / cols) * th, tw, th));
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
})();
