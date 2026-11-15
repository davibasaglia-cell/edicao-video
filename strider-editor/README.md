# strider-editor

Pipeline de edição no estilo Strider (Node.js + node-canvas + FFmpeg).

```bash
npm install
node index.js            # renderiza tudo (base + overlays)
node index.js --skip-base   # reaproveita output/base.mkv e só refaz overlays/legendas/SFX
```

- `config.json` — vídeo de entrada, trecho usado, cortes manuais, e os segmentos gráficos
  (tempos sempre no **tempo do vídeo original**; o script mapeia para o tempo editado).
- `input/transcript.json` — transcrição com timestamps por palavra (faster-whisper small, pt).
- Cortes rítmicos automáticos: pausas > 0,3s removidas (silencedetect) com punch-in alternado 1.0/1.12.
- HDR do iPhone (HLG) convertido para SDR bt709.
- Elementos: logo, card hook, texto gigante P&B, manômetro, card de checkboxes, hierarquia tipográfica, encerramento.
- SFX sintetizados (whoosh, boom, tick, chime) em `utils/sfx.js`.
