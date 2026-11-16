// Edição Sicredi — orquestrador: cortes rítmicos + cenas animadas (node-canvas) + SFX + ENCERRAMENTO COM LOGO (obrigatório).
// Uso:  node index.js [config.json] [--skip-base] [--preview [t1,t2,...|auto]]
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { createCanvas } = require('canvas');
const { buildKeeps, makeMapper } = require('./utils/timeline');
const { renderTrack } = require('./utils/sfx');
const U = require('./utils/canvas_utils');
const T = require('./renderers/transitions');

const ROOT = __dirname;
const args = process.argv.slice(2);
const cfgPath = args.find(a => a.endsWith('.json')) || path.join(ROOT, 'config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const CFG_DIR = path.dirname(path.resolve(cfgPath));
const SKIP_BASE = args.includes('--skip-base');
const PREVIEW = args.indexOf('--preview') >= 0 ? (args[args.indexOf('--preview') + 1] || 'auto') : null;
const R = p => path.isAbsolute(p) ? p : path.join(CFG_DIR, p);

// Registro: tipo → renderer. Para um elemento novo, crie renderers/<nome>.js e adicione aqui.
const renderers = {};
fs.readdirSync(path.join(ROOT, 'renderers')).filter(f => f.endsWith('.js') && f !== 'transitions.js').forEach(f => { renderers[f.slice(0, -3)] = require('./renderers/' + f); });
const TAKEOVER = new Set(['kinetic_scene', 'tiles_scene', 'outro']); // cobrem a tela inteira: sem legenda por cima

const TONEMAP = 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p';

function run(cmd, a, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, a, { stdio: opts.stdin ? ['pipe', 'inherit', 'inherit'] : ['ignore', 'inherit', 'inherit'] });
    p.on('error', reject); p.on('close', c => c === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${c}`)));
    if (opts.onSpawn) opts.onSpawn(p);
  });
}
const probe = f => { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', f], { encoding: 'utf8' }); return r.stdout.trim(); };
function parseSilences(input, [a, b], noiseDb, minDur) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(a), '-t', String(b - a), '-i', input, '-vn', '-af', `highpass=f=80,silencedetect=noise=${noiseDb}dB:d=${minDur}`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const starts = [...r.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1] + a), ends = [...r.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1] + a);
  return starts.map((s, i) => [s, ends[i] != null ? ends[i] : Infinity]);
}

function buildCaptions(words, mapper, hidden) {
  const { max_chars = 22, max_words = 4 } = cfg.captions || {};
  const kept = words.filter(w => w.e - w.s < 0.1 ? mapper.isKept((w.s + w.e) / 2) : mapper.overlap(w.s, w.e) >= 0.05);
  const phrases = []; let cur = [];
  kept.forEach(w => { cur.push(w); if (/[.?!,]$/.test(w.w.trim())) { phrases.push(cur); cur = []; } });
  if (cur.length) phrases.push(cur);
  const chunks = [];
  phrases.forEach(p => {
    const chars = p.map(x => x.w.trim()).join(' ').length;
    const n = Math.max(Math.ceil(p.length / max_words), Math.ceil(chars / (max_chars + 4))), per = Math.ceil(p.length / n);
    for (let i = 0; i < p.length; i += per) chunks.push(p.slice(i, i + per));
  });
  for (let i = chunks.length - 2; i >= 0; i--) {
    const a = chunks[i], b = chunks[i + 1], joined = [...a, ...b].map(x => x.w.trim()).join(' ');
    if (a.length === 1 && joined.length <= max_chars + 8 && mapper.map(b[0].s) - mapper.map(a[0].e) < 0.4) chunks.splice(i, 2, [...a, ...b]);
  }
  const clean = s => s.replace(/[.,!]/g, '').replace(/\s+/g, ' ').trim();
  const res = chunks.map(c => ({ text: clean(c.map(x => x.w.trim()).join(' ')), start: mapper.map(c[0].s), end: mapper.map(c[c.length - 1].e) + 0.15 }));
  for (let i = 0; i < res.length - 1; i++) { if (res[i + 1].start - res[i].end < 0.35) res[i].end = res[i + 1].start; res[i].end = Math.min(res[i].end, res[i + 1].start); }
  return res.filter(c => c.end - c.start > 0.05 && !hidden((c.start + c.end) / 2) && !hidden(Math.min(c.end, c.start + 0.25)));
}

// converte recursivamente todos os tempos (start,end,at,*_at) do vídeo original → vídeo editado
function mapTimes(o, m, endTime, lastIn) {
  if (Array.isArray(o)) return o.map(x => mapTimes(x, m, endTime, lastIn));
  if (o && typeof o === 'object') {
    const r = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'number' && (k === 'start' || k === 'at' || k.endsWith('_at'))) r[k] = m(v);
      else if (typeof v === 'number' && k === 'end') r[k] = v >= lastIn ? endTime : m(v);
      else r[k] = mapTimes(v, m, endTime, lastIn);
    }
    return r;
  }
  return o;
}

async function main() {
  const { fps = 30, width: W = 1080, height: H = 1920 } = cfg;
  const input = R(cfg.input), output = R(cfg.output), outDir = path.dirname(output);
  fs.mkdirSync(outDir, { recursive: true });
  const assets = await U.loadAssets();
  if (!PREVIEW && cfg.decupagem_aprovada !== true) {
    console.error('⛔ Render completo bloqueado: a decupagem ainda não foi aprovada pelo usuário.\n' +
      '   Mande a decupagem no chat, espere o "ok" e só então coloque "decupagem_aprovada": true no config.json.\n' +
      '   (Prévia em quadros continua liberada: --preview auto)');
    process.exit(2);
  }

  // 1. Cortes rítmicos
  console.log('→ Detectando pausas...');
  const sil = cfg.silence || { noise_db: -32, min_dur: 0.3, pad: 0.1 };
  const c2 = { ...cfg, silence: sil, fps };
  const keeps = buildKeeps(c2, parseSilences(input, cfg.range, sil.noise_db, sil.min_dur));
  const mapper = makeMapper(keeps);
  const outroCfg = { duration: 2.6, gap: 0.3, ...(cfg.outro || {}) };
  const speechEnd = mapper.total + outroCfg.gap;               // o orador termina; segura um respiro e entra o logo
  const duration = speechEnd + outroCfg.duration;
  console.log(`  ${keeps.length} trechos, ${(cfg.range[1] - cfg.range[0]).toFixed(1)}s → fala ${mapper.total.toFixed(1)}s + logo ${outroCfg.duration}s = ${duration.toFixed(1)}s`);

  // 2. Segmentos (tempos convertidos) + ENCERRAMENTO SICREDI SEMPRE NO FINAL
  const m = t => mapper.map(t);
  const segs = (cfg.segments || []).filter(s => s.type !== 'outro').map(s => {
    const r = mapTimes(s, m, speechEnd - 0.05, cfg.range[1]);
    r.end = Math.min(r.end, speechEnd - 0.05); r.type = s.type;
    if (TAKEOVER.has(r.type) && !r.transition_in) r.transition_in = { kind: 'wipe', dur: 0.55 };
    if (TAKEOVER.has(r.type) && !r.transition_out) r.transition_out = { kind: r.transition_in.kind, dur: 0.55 };
    return r;
  });
  segs.push({ type: 'outro', start: speechEnd, end: duration + 1, tagline: outroCfg.tagline, transition_in: { kind: outroCfg.transition || 'wipe', dur: 0.6 } });
  segs.forEach(s => { if (s.type === 'split') s.layout = { x: W * 0.1, y: H * 0.07, w: W * 0.8, h: H * 0.32, r: 54 }; });
  const hidden = t => segs.some(s => (s.hide_captions || TAKEOVER.has(s.type)) && t >= s.start - 0.05 && t < s.end + 0.05);

  // 3. Legendas
  let captions = { chunks: [], y: (cfg.captions && cfg.captions.y) || 0.88 };
  if (cfg.transcript && fs.existsSync(R(cfg.transcript)) && !(cfg.captions && cfg.captions.enabled === false)) {
    const words = JSON.parse(fs.readFileSync(R(cfg.transcript), 'utf8')).flatMap(s => s.words).filter(w => w.e > cfg.range[0] && w.s < cfg.range[1]);
    captions.chunks = buildCaptions(words, mapper, hidden);
  }

  // 4. SFX: cada renderer declara seus eventos; transições ganham whoosh; dedupe de eventos colados
  let ev = [];
  segs.forEach(s => {
    const r = renderers[s.type]; if (r && r.sfx) ev.push(...r.sfx(s));
    if (s.transition_in) ev.push({ type: 'whoosh', t: s.start - s.transition_in.dur / 2 - 0.05, gain: 0.8 });
    if (s.transition_out) ev.push({ type: 'whoosh', t: s.end - s.transition_out.dur / 2 - 0.05, gain: 0.6 });
  });
  ev = ev.sort((a, b) => a.t - b.t).filter((e, i, arr) => !arr.slice(0, i).some(p => p.type === e.type && Math.abs(p.t - e.t) < 0.2));
  const sfxFile = path.join(outDir, 'sfx.wav');
  renderTrack(ev.filter(e => e.t >= 0), duration, sfxFile);
  fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify({ keeps, segments: segs.map(({ layout, ...r }) => r), captions: captions.chunks, sfx: ev }, null, 1));

  // 5. Base: cortes + punch-in alternado + layout "split" (orador numa moldura sobre fundo desfocado)
  const base = path.join(outDir, 'base.mkv');
  const splits = segs.filter(s => s.type === 'split');
  if (!SKIP_BASE || !fs.existsSync(base)) {
    console.log('→ Renderizando base (cortes' + (splits.length ? ' + layout split' : '') + ')...');
    const hdr = /arib|smpte2084/.test(probe(input));
    const N = keeps.length, parts = [`[0:v]${hdr ? TONEMAP + ',' : ''}fps=${fps},split=${N}${keeps.map((_, i) => `[s${i}]`).join('')}`, `[0:a]asplit=${N}${keeps.map((_, i) => `[as${i}]`).join('')}`];
    const zoom = cfg.zoom || [1.0, 1.1];
    keeps.forEach((k, i) => {
      const z = zoom[i % zoom.length], sw = Math.round(W * z / 2) * 2, sh = Math.round(H * z / 2) * 2;
      const zf = z === 1 ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}` : `scale=${sw}:${sh}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
      parts.push(`[s${i}]trim=start=${k.s.toFixed(4)}:end=${k.e.toFixed(4)},setpts=PTS-STARTPTS,${zf},setsar=1[v${i}]`);
      parts.push(`[as${i}]atrim=start=${k.s.toFixed(4)}:end=${k.e.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=${(k.e - k.s - 0.012).toFixed(4)}:d=0.012[a${i}]`);
    });
    const pad = (duration - mapper.total).toFixed(3);
    parts.push(`${keeps.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${N}:v=1:a=1[cv][ca]`);
    const extra = ['-i'];
    let last = 'cv';
    if (splits.length) {
      const L = splits[0].layout, mc = createCanvas(Math.round(L.w), Math.round(L.h)), mg = mc.getContext('2d');
      mg.fillStyle = '#000'; mg.fillRect(0, 0, mc.width, mc.height); mg.fillStyle = '#fff'; U.roundRect(mg, 0, 0, mc.width, mc.height, L.r); mg.fill();
      fs.writeFileSync(path.join(outDir, 'split_mask.png'), mc.toBuffer('image/png'));
      const en = splits.map(s => `between(t,${s.start.toFixed(3)},${s.end.toFixed(3)})`).join('+');
      // máscara é a entrada 1 (loop)
      parts.push(`[${last}]split=3[cA][cB][orig]`);
      parts.push(`[cA]gblur=sigma=26,hue=s=0,eq=brightness=-0.18:contrast=1.05,colorchannelmixer=rr=0.8:gg=1:bb=0.8[bgs]`);
      parts.push(`[cB]scale=${Math.round(L.w)}:-2,crop=${Math.round(L.w)}:${Math.round(L.h)}:0:${Math.round(H * 0.06)},format=yuva420p[fgr]`);
      parts.push(`[1:v]format=gray,scale=${Math.round(L.w)}:${Math.round(L.h)}[mk]`);
      parts.push(`[fgr][mk]alphamerge[fga]`);
      parts.push(`[bgs][fga]overlay=${Math.round(L.x)}:${Math.round(L.y)}[comp]`);
      parts.push(`[orig][comp]overlay=0:0:enable='${en}'[mix]`); last = 'mix';
    }
    parts.push(`[${last}]tpad=stop_mode=clone:stop_duration=${pad}[bv]`);
    parts.push(`[ca]apad=pad_dur=${pad}[ba]`);
    const graphFile = path.join(outDir, 'base_graph.txt');
    fs.writeFileSync(graphFile, parts.join(';\n'));
    const maskIn = splits.length ? ['-loop', '1', '-i', path.join(outDir, 'split_mask.png')] : [];
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', '-i', input, ...maskIn, '-filter_complex_script', graphFile,
      '-map', '[bv]', '-map', '[ba]', '-t', duration.toFixed(3), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', '-ar', '48000', base]);
  }

  // 6. Desenho de um quadro
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  const drawFrame = t => {
    ctx.clearRect(0, 0, W, H);
    let any = false;
    const active = segs.filter(s => t >= s.start && t < s.end && renderers[s.type]);
    active.forEach(s => { ctx.save(); renderers[s.type](ctx, s, t, W, H); ctx.restore(); any = true; });
    if (!hidden(t) && captions.chunks.some(c => t >= c.start && t < c.end)) { ctx.save(); renderers.subtitle(ctx, captions, t, W, H); ctx.restore(); any = true; }
    // transições por cima de tudo
    segs.forEach(s => {
      [['transition_in', s.start], ['transition_out', s.end]].forEach(([k, mid]) => {
        const tr = s[k]; if (!tr || mid > duration) return;
        const p = (t - (mid - tr.dur / 2)) / tr.dur;
        if (p > 0 && p < 1) { T.draw(ctx, tr.kind, p, W, H, tr.color || U.C.green); any = true; }
      });
    });
    return any;
  };

  // --preview: quadros estáticos (base + overlay) para aprovação visual ANTES do render completo
  if (PREVIEW) {
    const pdir = path.join(outDir, 'preview'); fs.mkdirSync(pdir, { recursive: true });
    let times = PREVIEW === 'auto' ? segs.flatMap(s => s.type === 'outro' ? [s.start + 0.25, s.start + 1.6] : [(s.start + Math.min(s.end, s.start + 2.2)) / 2 + 0.2]) : PREVIEW.split(',').map(Number);
    times = times.map(t => Math.min(t, duration - 0.05));
    let i = 0;
    for (const t of times) {
      drawFrame(t); const ov = path.join(pdir, `ov_${i}.png`); fs.writeFileSync(ov, canvas.toBuffer('image/png'));
      await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', t.toFixed(3), '-i', base, '-i', ov, '-filter_complex', `[0:v][1:v]overlay=0:0,drawtext=text='${t.toFixed(1)}s':x=12:y=12:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.5`, '-frames:v', '1', path.join(pdir, `q_${String(i).padStart(2, '0')}.png`)]);
      fs.unlinkSync(ov); i++;
    }
    const cols = Math.min(6, times.length), rows = Math.ceil(times.length / cols);
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', '1', '-i', path.join(pdir, 'q_%02d.png'), '-vf', `scale=270:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(outDir, 'preview_sheet.png')]);
    console.log(`✅ Prévia: ${path.join(outDir, 'preview_sheet.png')} (${times.length} quadros em ${pdir})`); return;
  }

  // 7. Overlays → pipe → mix final
  console.log('→ Renderizando overlays + vídeo final...');
  const totalFrames = Math.round(duration * fps), empty = Buffer.alloc(W * H * 4);
  const sfxCfg = { volume: 0.22, duck: true, ...(cfg.sfx || {}) };
  const fc = [
    `[1:v]format=bgra[ov]`, `[0:v][ov]overlay=0:0:alpha=premultiplied:format=auto:eof_action=pass,format=yuv420p[v]`,
    `[0:a]highpass=f=70,afftdn=nf=-28,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000,asplit=2[voz][vozkey]`,
    `[2:a]volume=${sfxCfg.volume}[sfxv]`,
    sfxCfg.duck ? `[sfxv][vozkey]sidechaincompress=threshold=0.02:ratio=10:attack=5:release=300:makeup=1[sfx]` : `[sfxv]anull[sfx];[vozkey]anullsink`,
    `[voz]asplit=2[vozm][vozs]`, `[sfx]asplit=2[sfxm][sfxs]`,
    `[vozm][sfxm]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`,
  ].join(';');
  let ff;
  const done = run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', '-i', base,
    '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', `${W}x${H}`, '-r', String(fps), '-i', 'pipe:0', '-i', sfxFile,
    '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', duration.toFixed(3),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output,
    '-map', '[vozs]', '-t', duration.toFixed(3), '-ac', '1', '-c:a', 'pcm_s16le', path.join(outDir, 'stem_voz.wav'),
    '-map', '[sfxs]', '-t', duration.toFixed(3), '-ac', '1', '-c:a', 'pcm_s16le', path.join(outDir, 'stem_sfx.wav')],
    { stdin: true, onSpawn: p => { ff = p; } });
  for (let f = 0; f < totalFrames; f++) {
    const buf = drawFrame(f / fps) ? canvas.toBuffer('raw') : empty;
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done;
  console.log(`✅ Vídeo salvo em ${output}`);
  // medição automática: efeitos precisam ficar abaixo da voz
  const chk = spawnSync('node', [path.join(ROOT, 'check_audio.js'), outDir], { stdio: 'inherit' });
  if (chk.status !== 0) { console.error('⚠️  Efeitos acima do limite: baixe sfx.volume no config e rode com --skip-base.'); process.exit(3); }
}
main().catch(e => { console.error(e); process.exit(1); });
