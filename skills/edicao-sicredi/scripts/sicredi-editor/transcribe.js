// Transcrição com timestamps por palavra, em JavaScript (Whisper via @huggingface/transformers, onnx).
// Uso: node transcribe.js <video_ou_audio> <saida.json> [modelo=onnx-community/whisper-small_timestamped] [--local <pasta_de_modelos>]
// Saída no formato que o index.js lê: [{start,end,text,words:[{w,s,e}]}]
// Rede: o modelo vem do Hugging Face (huggingface.co). Sem acesso, baixe o modelo antes e passe --local <pasta>.
const { spawnSync } = require('child_process');
const fs = require('fs');
// O fetch nativo do Node ignora HTTPS_PROXY; em ambientes com proxy, reexecuta com NODE_USE_ENV_PROXY=1 (Node ≥ 22.21).
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status == null ? 1 : r.status);
}
const args = process.argv.slice(2);
const li = args.indexOf('--local'); const localDir = li >= 0 ? args.splice(li, 2)[1] : null;
const [inp, out, model = 'onnx-community/whisper-small_timestamped'] = args;
if (!inp || !out) { console.error('uso: node transcribe.js <video> <saida.json> [modelo] [--local pasta]'); process.exit(1); }

(async () => {
  const { pipeline, env } = await import('@huggingface/transformers');
  // modelo PRECISA ser exportado com cross-attentions (variantes *_timestamped) para dar tempo por palavra
  if (localDir) { env.localModelPath = localDir; env.allowRemoteModels = false; }
  // decodifica o áudio para PCM float32 16 kHz mono via FFmpeg (stdout → Buffer)
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', inp, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) { console.error(String(r.stderr)); process.exit(1); }
  const audio = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 4));
  console.log(`→ Carregando ${model}...`);
  const asr = await pipeline('automatic-speech-recognition', model);
  console.log(`→ Transcrevendo ${(audio.length / 16000).toFixed(1)}s de áudio...`);
  const res = await asr(audio, { language: 'portuguese', task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
  const words = (res.chunks || []).map(c => ({ w: ' ' + c.text.trim(), s: c.timestamp[0], e: c.timestamp[1] != null ? c.timestamp[1] : c.timestamp[0] + 0.3 }));
  // agrupa em frases (pontuação ou pausa > 0,6s)
  const segs = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); const nx = words[i + 1]; if (/[.?!]$/.test(w.w.trim()) || !nx || nx.s - w.e > 0.6) { segs.push({ start: cur[0].s, end: w.e, text: cur.map(x => x.w).join('').trim(), words: cur }); cur = []; } });
  fs.writeFileSync(out, JSON.stringify(segs, null, 1));
  segs.forEach(s => console.log(`[${s.start.toFixed(2).padStart(6)}-${s.end.toFixed(2).padStart(6)}] ${s.text}`));
  console.log(`✅ ${out}`);
})().catch(e => { console.error('✗ Falha na transcrição:', e.message, '\n  (sem acesso ao huggingface.co? use --local com o modelo baixado ou peça a liberação do host)'); process.exit(1); });
