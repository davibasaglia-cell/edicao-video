// Edição Strider — orquestrador: cortes rítmicos + P&B seletivo + overlays animados (node-canvas) + SFX.
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { createCanvas } = require('canvas');
const { buildKeeps, makeMapper } = require('./utils/timeline');
const { renderTrack } = require('./utils/sfx');

const ROOT = __dirname;
const cfgPath = process.argv.find(a => a.endsWith('.json')) || path.join(ROOT, 'config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const SKIP_BASE = process.argv.includes('--skip-base');
// --takes            → só os takes das animações (para aprovação antes do render completo)
// --takes=2,5        → só os takes 2 e 5 (numeração = ordem dos segmentos no config)
const TAKES_ARG = process.argv.find(a => a.startsWith('--takes'));
const TAKES = !!TAKES_ARG;
const TAKES_ONLY = TAKES_ARG && TAKES_ARG.includes('=') ? TAKES_ARG.split('=')[1].split(',').map(Number) : null;
const R = p => path.isAbsolute(p) ? p : path.join(ROOT, p);

const renderers = {
  card_hook: require('./renderers/card_hook'),
  impact_text: require('./renderers/impact_text'),
  subtitle: require('./renderers/subtitle'),
  checkbox_card: require('./renderers/checkbox_card'),
  gauge: require('./renderers/gauge'),
  hierarchy: require('./renderers/hierarchy'),
  logo: require('./renderers/logo'),
  closer: require('./renderers/closer'),
  lower_third: require('./renderers/lower_third'),
  kinetic_words: require('./renderers/kinetic_words'),
  heartbeat: require('./renderers/heartbeat'),
  icon_chips: require('./renderers/icon_chips'),
  flip_reveal: require('./renderers/flip_reveal'),
  calendar_fill: require('./renderers/calendar_fill'),
  brain_layers: require('./renderers/brain_layers'),
  glitch_split: require('./renderers/glitch_split'),
  counter_echo: require('./renderers/counter_echo'),
  absorb_stamp: require('./renderers/absorb_stamp'),
  name_callout: require('./renderers/name_callout'),
  question_bar: require('./renderers/question_bar'),
  tape_measure: require('./renderers/tape_measure'),
  focus_pull: require('./renderers/focus_pull'),
  route_pin: require('./renderers/route_pin'),
  switch_toggle: require('./renderers/switch_toggle'),
  stories_bar: require('./renderers/stories_bar'),
  magnet_pull: require('./renderers/magnet_pull'),
  meta_split: require('./renderers/meta_split'),
  bullseye_arrow: require('./renderers/bullseye_arrow'),
  magnifier: require('./renderers/magnifier'),
  before_after: require('./renderers/before_after'),
  float_up: require('./renderers/float_up'),
  padlock_price: require('./renderers/padlock_price'),
  signpost: require('./renderers/signpost'),
  compass: require('./renderers/compass'),
  chat_notify: require('./renderers/chat_notify'),
  bar_growth: require('./renderers/bar_growth'),
  broadcast_close: require('./renderers/broadcast_close'),
};

const BW = 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3';
// iPhone grava HDR (HLG 10-bit) → tone-map para SDR bt709
const TONEMAP = 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: opts.stdin ? ['pipe', 'inherit', 'inherit'] : ['ignore', 'inherit', 'inherit'] });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${code}`)));
    if (opts.onSpawn) opts.onSpawn(p);
  });
}

function detectSilences(input, [a, b], noiseDb, minDur) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(a), '-t', String(b - a), '-i', input, '-vn',
    '-af', `highpass=f=80,silencedetect=noise=${noiseDb}dB:d=${minDur}`, '-f', 'null', '-'], { encoding: 'utf8' });
  return r.stderr;
}

function parseSilences(stderr, offset) {
  const starts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1] + offset);
  const ends = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1] + offset);
  return starts.map((s, i) => [s, ends[i] != null ? ends[i] : Infinity]);
}

function buildCaptions(words, mapper, hidden) {
  const { max_chars, max_words } = cfg.captions;
  // palavra fica se tiver ≥50ms dentro de algum trecho mantido (timestamps do Whisper vazam p/ pausas)
  const kept = words.filter(w => w.e - w.s < 0.1 ? mapper.isKept((w.s + w.e) / 2) : mapper.overlap(w.s, w.e) >= 0.05);
  // 1) frases separadas por pontuação  2) cada frase dividida em blocos equilibrados
  const phrases = [];
  let cur = [];
  kept.forEach(w => { cur.push(w); if (/[.?!,]$/.test(w.w.trim())) { phrases.push(cur); cur = []; } });
  if (cur.length) phrases.push(cur);
  const chunks = [];
  phrases.forEach(p => {
    const chars = p.map(x => x.w.trim()).join(' ').length;
    const n = Math.max(Math.ceil(p.length / max_words), Math.ceil(chars / (max_chars + 4)));
    const per = Math.ceil(p.length / n);
    for (let i = 0; i < p.length; i += per) chunks.push(p.slice(i, i + per));
  });
  // bloco de 1 palavra ("Então", "tipo") gruda no seguinte para não piscar sozinho
  for (let i = chunks.length - 2; i >= 0; i--) {
    const a = chunks[i], b = chunks[i + 1];
    const joined = [...a, ...b].map(x => x.w.trim()).join(' ');
    if (a.length === 1 && joined.length <= max_chars + 8 && mapper.map(b[0].s) - mapper.map(a[0].e) < 0.4) chunks.splice(i, 2, [...a, ...b]);
  }
  const clean = s => s.replace(/[.,!]/g, '').replace(/\s+/g, ' ').trim();
  const res = chunks.map(c => ({
    text: clean(c.map(x => x.w.trim()).join(' ')),
    start: mapper.map(c[0].s),
    end: mapper.map(c[c.length - 1].e) + 0.15,
  }));
  for (let i = 0; i < res.length - 1; i++) {
    if (res[i + 1].start - res[i].end < 0.35) res[i].end = res[i + 1].start; // legenda contínua
    res[i].end = Math.min(res[i].end, res[i + 1].start);
  }
  return res.filter(c => c.end - c.start > 0.05 && !hidden((c.start + c.end) / 2) && !hidden(Math.min(c.end, c.start + 0.25)));
}

async function main() {
  const { fps, width: W, height: H } = cfg;
  const input = R(cfg.input);
  const outDir = path.dirname(R(cfg.output));
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Cortes rítmicos (remove pausas e trechos fora do assunto)
  console.log('→ Detectando pausas...');
  const silences = parseSilences(detectSilences(input, cfg.range, cfg.silence.noise_db, cfg.silence.min_dur), cfg.range[0]);
  const keeps = buildKeeps(cfg, silences);
  const mapper = makeMapper(keeps);
  const tail = cfg.tail_hold || 0;
  const duration = mapper.total + tail;
  console.log(`  ${keeps.length} trechos, ${(cfg.range[1] - cfg.range[0]).toFixed(1)}s → ${duration.toFixed(1)}s`);

  // 2. Segmentos em tempo de saída
  const m = t => mapper.map(t);
  const segs = cfg.segments.map(s => {
    const r = { ...s, outStart: m(s.start), outEnd: s.end >= cfg.range[1] ? duration : m(s.end) };
    // qualquer campo "<nome>_at" vira "<nomeCamel>AtOut"; arrays de objetos com "at" ganham "atOut"
    for (const [k, v] of Object.entries(s)) {
      if (k.endsWith('_at') && typeof v === 'number') r[k.slice(0, -3).replace(/_(\w)/g, (_, c) => c.toUpperCase()) + 'AtOut'] = m(v);
      if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0].at != null) r[k] = v.map(o => ({ ...o, atOut: m(o.at) }));
    }
    return r;
  });
  const hidden = t => segs.some(s => s.hide_captions && t >= s.outStart && t < s.outEnd);

  // 3. Legendas palavra-a-palavra a partir da transcrição
  const transcript = JSON.parse(fs.readFileSync(R(cfg.transcript), 'utf8'));
  const words = transcript.flatMap(s => s.words).filter(w => w.e > cfg.range[0] && w.s < cfg.range[1]);
  const captions = { type: 'subtitle', y: cfg.captions.y, chunks: buildCaptions(words, mapper, hidden) };

  // 4. Trilha de SFX
  const ev = [];
  segs.forEach(s => {
    if (['card_hook', 'checkbox_card', 'gauge', 'logo', 'hierarchy', 'closer'].includes(s.type)) ev.push({ type: 'whoosh', t: s.outStart - 0.12, gain: 0.9 });
    if (s.type === 'card_hook') ev.push({ type: 'boom', t: (s.emphasisAtOut != null ? s.emphasisAtOut : s.outStart + 0.12), gain: 0.8 });
    if (s.type === 'impact_text') s.lines.forEach((l, i) => ev.push(l.boom ? { type: 'boom', t: l.atOut } : { type: 'whoosh', t: l.atOut - 0.1, gain: 0.6 }));
    if (s.type === 'checkbox_card') s.items.forEach(i => ev.push(i.highlight ? { type: 'chime', t: i.atOut, gain: 2.5 } : { type: 'tick', t: i.atOut, gain: 3 }));
    if (s.type === 'gauge') s.stages.slice(1).forEach(st => ev.push({ type: 'whoosh', t: st.atOut - 0.05, gain: 0.7 }));
    if (s.type === 'hierarchy') { ev.push({ type: 'boom', t: s.bigAtOut, gain: 0.8 }); if (s.small2AtOut) ev.push({ type: 'tick', t: s.small2AtOut, gain: 3 }); }
    if (renderers[s.type] && renderers[s.type].sfx) ev.push(...renderers[s.type].sfx(s));
    if (s.type === 'closer') ev.push({ type: 'boom', t: s.line2AtOut }, { type: 'chime', t: s.line2AtOut + 0.05, gain: 0.8 });
  });
  const sfxFile = path.join(outDir, 'sfx.wav');
  renderTrack(ev, duration, sfxFile);

  fs.writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify({ keeps, segments: segs, captions: captions.chunks, sfx: ev }, null, 1));

  // 5. Base: tone-map + cortes + punch-in alternado + P&B seletivo
  const base = path.join(outDir, 'base.mkv');
  if (!SKIP_BASE || !fs.existsSync(base)) {
    console.log('→ Renderizando base (cortes + P&B)...');
    const N = keeps.length;
    const parts = [`[0:v]${TONEMAP},fps=${fps},split=${N}${keeps.map((_, i) => `[s${i}]`).join('')}`, `[0:a]asplit=${N}${keeps.map((_, i) => `[as${i}]`).join('')}`];
    keeps.forEach((k, i) => {
      const z = cfg.zoom[i % cfg.zoom.length];
      const sw = Math.round(W * z / 2) * 2, sh = Math.round(H * z / 2) * 2;
      const zoom = z === 1 ? `scale=${W}:${H}` : `scale=${sw}:${sh},crop=${W}:${H}:${(sw - W) / 2}:${Math.round((sh - H) * 0.3)}`;
      const d = (k.e - k.s).toFixed(4);
      parts.push(`[s${i}]trim=start=${k.s.toFixed(4)}:end=${k.e.toFixed(4)},setpts=PTS-STARTPTS,${zoom},setsar=1[v${i}]`);
      parts.push(`[as${i}]atrim=start=${k.s.toFixed(4)}:end=${k.e.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st=${(k.e - k.s - 0.012).toFixed(4)}:d=0.012[a${i}]`);
    });
    const bw = segs.filter(s => s.bw).map(s => `between(t,${s.outStart.toFixed(3)},${s.outEnd.toFixed(3)})`).join('+');
    parts.push(`${keeps.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${N}:v=1:a=1[cv][ca]`);
    parts.push(`[cv]${bw ? `${BW}:enable='${bw}',` : ''}tpad=stop_mode=clone:stop_duration=${tail}[bv]`);
    parts.push(`[ca]apad=pad_dur=${tail}[ba]`);
    const graphFile = path.join(outDir, 'base_graph.txt');
    fs.writeFileSync(graphFile, parts.join(';\n'));
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats', '-i', input, '-filter_complex_script', graphFile,
      '-map', '[bv]', '-map', '[ba]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', '-ar', '48000', base]);
  }

  // 6. Overlays (node-canvas → pipe RGBA) + mix. renderClip serve tanto para o vídeo final quanto para os takes.
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const empty = Buffer.alloc(W * H * 4);
  const sfxCfg = { volume: 0.22, duck: true, ...(cfg.sfx || {}) };

  async function renderClip(t0, t1, output, opts = {}) {
    const preview = !!opts.label;
    const scaleOut = preview ? `,scale=${W / 2}:${H / 2}` : '';
    const fc = [
      `[1:v]format=bgra[ov]`,
      `[0:v][ov]overlay=0:0:alpha=premultiplied:format=auto:eof_action=pass${scaleOut},format=yuv420p[v]`,
      `[0:a]highpass=f=70,afftdn=nf=-28,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000,asplit=2[voz][vozkey]`,
      // SFX sempre ABAIXO da voz: volume reduzido + ducking (comprime os efeitos quando há fala)
      `[2:a]volume=${sfxCfg.volume}[sfxv]`,
      sfxCfg.duck ? `[sfxv][vozkey]sidechaincompress=threshold=0.02:ratio=10:attack=5:release=300:makeup=1[sfx]` : `[sfxv]anull[sfx];[vozkey]anullsink`,
      `[voz][sfx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`,
    ].join(';');
    const enc = preview
      ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', String(fps), '-c:a', 'aac', '-b:a', '128k', '-ar', '48000']
      : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
         '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k'];
    let ff;
    const done = run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...(preview ? [] : ['-stats']),
      '-ss', t0.toFixed(3), '-i', base,
      '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', `${W}x${H}`, '-r', String(fps), '-i', 'pipe:0',
      '-ss', t0.toFixed(3), '-i', sfxFile,
      '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', (t1 - t0).toFixed(3),
      ...enc, '-movflags', '+faststart', output], { stdin: true, onSpawn: p => { ff = p; } });

    const f0 = Math.round(t0 * fps), f1 = Math.round(t1 * fps);
    for (let f = f0; f < f1; f++) {
      const t = f / fps;
      const active = segs.filter(s => t >= s.outStart && t < s.outEnd && renderers[s.type]);
      const capOn = !hidden(t) && captions.chunks.some(c => t >= c.start && t < c.end);
      let buf = empty;
      if (active.length || capOn || preview) {
        ctx.clearRect(0, 0, W, H);
        active.forEach(s => { ctx.save(); renderers[s.type](ctx, s, t, W, H); ctx.restore(); });
        if (capOn) { ctx.save(); renderers.subtitle(ctx, captions, t, W, H); ctx.restore(); }
        if (preview) drawTakeLabel(ctx, opts.label, W, H);
        buf = canvas.toBuffer('raw');
      }
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;
  }

  if (TAKES) {
    // 7a. Takes: um clipe curto por animação (meia resolução, com áudio) + um reel com todos, para aprovação
    const takesDir = path.join(outDir, 'takes');
    fs.rmSync(takesDir, { recursive: true, force: true });
    fs.mkdirSync(takesDir, { recursive: true });
    const list = segs.map((s, i) => ({ s, i })).filter(({ i }) => !TAKES_ONLY || TAKES_ONLY.includes(i + 1));
    const files = [];
    for (const { s, i } of list) {
      const t0 = Math.max(0, s.outStart - 0.4), t1 = Math.min(duration, s.outEnd + 0.3);
      const file = path.join(takesDir, `take_${String(i + 1).padStart(2, '0')}_${s.type}.mp4`);
      console.log(`  take ${i + 1}/${segs.length}: ${s.type} (${t0.toFixed(1)}s–${t1.toFixed(1)}s)`);
      await renderClip(t0, t1, file, { label: `TAKE ${i + 1} · ${s.type.toUpperCase()} · ${fmtTime(s.outStart)}` });
      files.push(file);
    }
    const listFile = path.join(takesDir, 'list.txt');
    fs.writeFileSync(listFile, files.map(f => `file '${f}'`).join('\n'));
    const reel = path.join(outDir, 'takes_reel.mp4');
    await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', reel]);
    console.log(`✅ Takes em ${takesDir}\n✅ Reel com todos os takes: ${reel}`);
    return;
  }

  // 7b. Vídeo final
  console.log('→ Renderizando overlays + vídeo final...');
  const output = R(cfg.output);
  await renderClip(0, duration, output);
  console.log(`✅ Vídeo salvo em ${output}`);
}

function fmtTime(t) { return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`; }

// Etiqueta no canto dos takes para o usuário saber qual animação está vendo
function drawTakeLabel(ctx, label, W, H) {
  ctx.save();
  ctx.font = '700 30px Inter';
  const w = ctx.measureText(label).width + 40;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(24, H - 90, w, 56);
  ctx.fillStyle = '#F5A020';
  ctx.fillRect(24, H - 90, 8, 56);
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(label, 48, H - 61);
  ctx.restore();
}

main().catch(e => { console.error(e); process.exit(1); });
