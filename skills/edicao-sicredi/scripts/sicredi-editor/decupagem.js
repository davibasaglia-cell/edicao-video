// Prepara a DECUPAGEM (rascunho) a partir da transcrição: frases com tempo, pausas, cortes sugeridos e palavras-chave candidatas.
// Uso: node decupagem.js <video> <transcript.json> [inicio fim]     → imprime e salva output/decupagem_rascunho.md
// É só o insumo: quem monta a decupagem final (blocos, textos, transições) é você, e o usuário aprova antes do render.
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const [video, tr, a0, a1] = process.argv.slice(2);
if (!video || !tr) { console.error('uso: node decupagem.js <video> <transcript.json> [inicio fim]'); process.exit(1); }
const segs = JSON.parse(fs.readFileSync(tr, 'utf8'));
const dur = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' }).stdout;
const A = a0 != null ? +a0 : 0, B = a1 != null ? +a1 : dur;
const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(A), '-t', String(B - A), '-i', video, '-vn', '-af', 'highpass=f=80,silencedetect=noise=-32dB:d=0.3', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const ss = [...se.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1] + A), ee = [...se.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1] + A);
const pauses = ss.map((s, i) => [s, ee[i] != null ? ee[i] : B]).filter(([s, e]) => e - s >= 0.3);
const pausedTotal = pauses.reduce((t, [s, e]) => t + (e - s - 0.2), 0);
const f = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const hint = t => (/\d/.test(t) ? 'número → ui_card stat | ' : '') + (/(primeiro|depois|passo|etapa|então|por fim)/i.test(t) ? 'sequência → timeline | ' : '') + (/(minuto|hora|dia|rápid|tempo|prazo)/i.test(t) ? 'tempo → slider | ' : '') + (/(app|aplicativo|pix|conta|cartão|digital|celular)/i.test(t) ? 'app → phone_float | ' : '') + (/(ou|tipos|opções|produtos|categorias)/i.test(t) ? 'opções → tiles | ' : '');
let md = `# Decupagem (rascunho) — ${path.basename(video)}\nTrecho analisado: ${f(A)} – ${f(B)} (${(B - A).toFixed(1)}s) · pausas > 0,3s: ${pauses.length} (≈ ${pausedTotal.toFixed(1)}s a cortar)\n\n## Frases\n| Tempo | Fala | Sugestão de bloco |\n|---|---|---|\n`;
segs.filter(s => s.end > A && s.start < B).forEach(s => { md += `| ${f(s.start)}–${f(s.end)} | ${s.text.replace(/\|/g, '/')} | ${hint(s.text).replace(/ \| $/, '') || '—'} |\n`; });
md += `\n## Pausas (serão cortadas)\n${pauses.map(([s, e]) => `- ${f(s)} → ${f(e)} (${(e - s).toFixed(2)}s)`).join('\n') || '- nenhuma'}\n\n## A preencher (decupagem final → aprovação)\n| Tempo (final) | Fala | Bloco | Texto na tela | Transição | Escala | Som |\n|---|---|---|---|---|---|---|\n| … | … | … | … | … | … | … |\n| fim | — | LOGO SICREDI (automático) | — | wipe | takeover | whoosh + chime |\n`;
fs.mkdirSync('output', { recursive: true }); fs.writeFileSync('output/decupagem_rascunho.md', md); console.log(md);
