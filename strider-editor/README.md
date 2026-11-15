# strider-editor

Pipeline de edição no estilo Strider (Node.js + node-canvas + FFmpeg).

```bash
npm install
node preview.js previa.png 3.6 7.6 17.3   # prévia em quadros parados (tempos originais), sem render
node index.js --takes                     # takes de cada animação + output/takes_reel.mp4 (para aprovação)
node index.js --takes=3,7 --skip-base     # refaz só os takes 3 e 7
node index.js --skip-base                 # vídeo final reaproveitando a base
node index.js                             # tudo do zero (base + overlays)
```

- `config.json`: vídeo de entrada, trecho usado, cortes manuais e os segmentos gráficos
  (tempos sempre no **tempo do vídeo original**; qualquer campo `xxx_at` vira `xxxAtOut` no renderer).
- `config_<nome>.json`: configs de vídeos anteriores (histórico, para não repetir motions).
- `input/transcript*_fixed.json`: transcrição com timestamps por palavra, já corrigida.
- Cortes rítmicos automáticos: pausas > 0,3s removidas, punch-in alternado 1.0/1.12. HDR do iPhone → SDR bt709.
- Renderers em `renderers/` (cada um pode exportar `.sfx(seg)` com seus sons); helpers em `utils/fx.js`.
- SFX sintetizados (whoosh, boom, tick, chime) em `utils/sfx.js`, sempre abaixo da voz (ducking).
