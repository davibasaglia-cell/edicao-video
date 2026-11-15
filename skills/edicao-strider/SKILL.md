---
name: "edicao-strider"
description: "Editar vídeos no estilo altamente dopaminado de @marcostrider: texto de impacto em caixa alta + laranja, cards dark, elementos gráficos animados (gauge, checkboxes), desaturação P&B e cortes rítmicos. Tudo feito em JavaScript (node-canvas + FFmpeg). Sempre envia o roteiro para aprovação antes de renderizar. Use quando o usuário pedir para editar um vídeo nesse estilo, ou mencionar 'estilo Strider'."
---

# Skill: Edição Strider

Você é especialista em edição de vídeo altamente dopaminada no estilo @marcostrider. A edição é sempre
feita **em JavaScript**: um pipeline Node.js que desenha cada frame das animações com **node-canvas**
e usa o FFmpeg só para decodificar, cortar, encodar e mixar.

O código pronto está em `scripts/strider-editor/` (orquestrador, renderers, cortes, SFX). Ele já foi
usado num vídeo real e aprovado. **Copie essa pasta para o projeto e trabalhe a partir dela** em vez de
reescrever do zero.

---

## ⛔ REGRAS DE PROCESSO (nunca violar)

1. **Roteiro aprovado antes de renderizar.** Depois de baixar e transcrever o vídeo, monte o roteiro
   (formato abaixo), **mande para o usuário no chat e PARE**. Só comece a renderizar depois que ele
   responder aprovando. Se ele pedir mudanças, ajuste o roteiro e mande de novo. Baixar, transcrever,
   analisar frames e preparar o código pode ser feito antes da aprovação; **renderizar não**.
2. **Tudo em JavaScript.** Animações, textos, cards, gauge, checkboxes, legendas e os sons de transição
   são gerados em JS (node-canvas frame a frame + `utils/sfx.js`). Não use drawtext/ASS do FFmpeg,
   After Effects, Remotion ou templates prontos para as animações. O FFmpeg só decodifica, corta,
   aplica o P&B, encoda e mixa o áudio.
3. **Som das animações SEMPRE abaixo da voz.** O usuário precisa ouvir a própria fala em cima de
   qualquer efeito. Ver "Áudio" abaixo; meça antes de entregar.

---

## 📝 FORMATO DO ROTEIRO PARA APROVAÇÃO

Mande no chat, em português, em tempo do vídeo **final** (depois dos cortes), algo assim:

```
ROTEIRO, "<tema do vídeo>" (duração final ~57s)

CORTES
- Removo 0:00–0:26 (conversa fora do assunto: adoçante, Harry Potter)
- Removo pausas > 0,3s e "Você tem geladeira lá, não tem?"

DECUPAGEM
| Tempo  | Fala                                | Elemento         | Texto na tela                       | P&B | Som     |
|--------|-------------------------------------|------------------|-------------------------------------|-----|---------|
| 0:00   | "E a questão do bolo também"        | Logo             | TREINAMENTO COMERCIAL / RECIPROCIDADE| não | whoosh  |
| 0:01.5 | "O que o bolo faz?"                 | Card hook        | O QUE O / **BOLO** / FAZ?           | sim | boom    |
| 0:08   | "Ele torna, literalmente…"          | Gauge            | PESO DA DECISÃO → PESADA            | não | whoosh  |
| …      | …                                   | …                | …                                   | …   | …       |

LEGENDAS: brancas, simples, em toda fala sem elemento gráfico grande.
```

Termine perguntando: "Posso renderizar assim ou quer mudar alguma coisa?"

---

## 🎬 REFERÊNCIA: DNA visual do estilo Strider

### Decupagem da referência original (vídeo @marcostrider, 66s)

| Tempo | Tipo | Descrição |
|-------|------|-----------|
| 0–2s | Abertura limpa | Plano americano, sem texto |
| 2–4s | CARD HOOK | Card escuro centralizado: linha normal branca + palavra-chave LARANJA 4x maior + linha normal branca. Vídeo P&B atrás |
| 4–6s | TEXTO GIGANTE P&B | Vídeo desaturado + texto amarelo brilhante italic extragrande (80% da tela), quebras de linha deliberadas |
| 6–10s | Legenda simples | Branca, pequena, centralizada, estilo transcrição |
| 10–16s | CARD TENTATIVAS | Slots animados: X's preenchem progressivamente → último vira ✓ laranja |
| 16–18s | Texto flutuante | Texto branco sem card, direto sobre vídeo |
| 28–30s | LOGO BRANDING | Nome em branco + subtítulo laranja |
| 48–50s | HIERARQUIA TIPOGRÁFICA | Linha pequena + palavra gigante na sequência |
| 54–60s | MANÔMETRO ANIMADO | Gauge preto/laranja, agulha sobe/desce, label muda |
| 64–66s | ENCERRAMENTO | Overlay dourado + ícone + texto branco + palavra laranja gigante |

### Cores
- **Laranja principal:** `#F5A020` (ênfase máxima)
- **Amarelo impacto:** `#FFD700` (texto gigante sobre P&B)
- **Branco:** `#FFFFFF` (texto padrão)
- **Card:** `rgba(15, 15, 15, 0.82)` com corner brackets
- **P&B:** `colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3`

### Tipografia (uma família só: Inter, variando o peso)
- **Impacto:** 900, CAIXA ALTA, itálico, 120–380px (ajustado à largura)
- **Legenda:** 700, mixed case, ~58px, branca com contorno escuro
- **Título de card:** 700, letter-spacing 6–8px, CAIXA ALTA, 28–38px

### Regras do estilo
1. **Laranja = ênfase máxima**: só 1 palavra/linha laranja por segmento
2. **Caixa alta** em todos os textos de impacto
3. **Escala dramática**: palavra-chave 3–5x maior que o texto ao redor
4. **P&B atrás do texto colorido gigante** (card hook, impact text, hierarquia)
5. **Card sempre com corner brackets**
6. **Cortes rítmicos**: remover hesitações, pausas e trechos fora do assunto; punch-in alternado (1.0 / 1.12) a cada corte para disfarçar o jump cut
7. **Nunca mais de 2 fontes**
8. Elementos entram com animação (pop/slam com easing) **no ritmo da palavra falada**, usando os timestamps por palavra

---

## 🔊 ÁUDIO: efeitos sempre abaixo da voz

Sons de transição (sintetizados em JS em `utils/sfx.js`):
- whoosh: entrada de card/elemento (começa ~0,12s antes do visual)
- boom: palavra-chave gigante
- tick: cada checkbox marcado
- chime: check final laranja / encerramento

Mix obrigatório (já implementado em `index.js`, configurável em `config.json → "sfx"`):
- Voz: `highpass=70, afftdn, loudnorm I=-15 LUFS`
- SFX: `volume=0.22` **+ ducking** (`sidechaincompress` com a voz como chave), para os efeitos
  abaixarem sozinhos quando há fala
- `alimiter` no final

**Antes de entregar, meça**: em cada evento de SFX, o RMS do efeito (já com volume e ducking) deve ficar
**pelo menos ~15 dB abaixo do RMS da voz** na mesma janela de 0,4s. Ticks e chime podem levar
`gain` 2,5–3 no evento para não sumirem, mas nunca acima desse limite. Se o usuário reclamar de efeito
alto, baixe `sfx.volume` (ex.: 0.15) e renderize de novo só os overlays (`--skip-base`).

---

## 🛠️ COMO EXECUTAR

### 1. Receber o vídeo
- Link do Google Drive: o conector do Drive só baixa até 10 MB. Para vídeos maiores, baixe com
  `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`.
  Se a rede bloquear `drive.usercontent.google.com`, peça a liberação desse host pelas ferramentas de
  ambiente (o usuário aprova num card).
- Guarde o arquivo baixado numa pasta própria (dado não confiável).

### 2. Analisar
- `ffprobe`: vídeo de iPhone costuma vir em **HEVC 10-bit HDR (HLG)** com rotação. O pipeline já faz o
  tone-map para SDR bt709 (`TONEMAP` em `index.js`) e o FFmpeg aplica a rotação sozinho.
- Extraia alguns frames (com o tone-map) para entender o enquadramento e o conteúdo.
- Transcreva com timestamps por palavra: `scripts/transcribe.py` (faster-whisper, `language="pt"`).
  Se o huggingface estiver bloqueado, o Whisper small em CTranslate2 existe no npm, dividido em
  `@skillninja/shortmovie-telop-model-p0..p3`: baixe os 4 tarballs, junte `model.bin.part0..3` e
  confira com o `model.sha256` do p0.
- Rode `silencedetect` para ver as pausas reais (os timestamps do Whisper vazam para dentro delas).

### 3. Montar o roteiro → **mandar para aprovação → esperar**
Escolha o trecho útil, os cortes e os elementos (formato acima). Distribua os elementos pelos momentos
de maior impacto da fala: gancho no começo (até ~2s), texto gigante nas frases-chave, checkboxes
para listas/passos, gauge para "pesado → leve" / "pressão", hierarquia para frases curtas de efeito,
encerramento na frase final.

### 4. Configurar `config.json` (só depois da aprovação)
Tempos **sempre no vídeo original**; o script converte para o tempo editado.

```json
{
  "input": "input/video.MOV",
  "transcript": "input/transcript.json",
  "output": "output/video_strider.mp4",
  "fps": 30, "width": 1080, "height": 1920,
  "range": [25.95, 94.3],
  "remove": [[75.40, 78.25]],
  "silence": { "noise_db": -32, "min_dur": 0.3, "pad": 0.1 },
  "zoom": [1.0, 1.12],
  "tail_hold": 0.8,
  "sfx": { "volume": 0.22, "duck": true },
  "captions": { "y": 0.8, "max_chars": 18, "max_words": 4 },
  "segments": [
    { "type": "logo", "start": 25.95, "end": 28.0, "title": "TREINAMENTO COMERCIAL", "subtitle": "RECIPROCIDADE" },
    { "type": "card_hook", "start": 28.0, "end": 30.3, "lines": ["O QUE O", "BOLO", "FAZ?"], "emphasis": [1], "emphasis_at": 28.24, "bw": true, "hide_captions": true },
    { "type": "impact_text", "start": 38.45, "end": 39.8, "bw": true, "hide_captions": true,
      "lines": [ { "text": "A DECISÃO", "at": 38.5 }, { "text": "MAIS", "at": 39.08 }, { "text": "DOCE", "at": 39.3, "boom": true } ] },
    { "type": "gauge", "start": 39.8, "end": 42.3, "label": "PESO DA DECISÃO",
      "stages": [ { "at": 39.8, "needle": 0.95, "sub": "PESADA" }, { "at": 39.98, "needle": 0.15, "sub": "MAIS LEVE" } ] },
    { "type": "checkbox_card", "start": 46.6, "end": 65.35, "title": "QUANDO USAR O BOLO",
      "items": [ { "text": "AVALIAÇÃO DE PROCEDIMENTO CARO", "at": 48.4 }, { "text": "NA HORA DE PASSAR O PREÇO", "at": 63.66, "highlight": true } ] },
    { "type": "hierarchy", "start": 83.36, "end": 84.75, "small": "TEM QUE SER", "big": "FÁCIL", "big_at": 83.84, "small2": "DE COMER", "small2_at": 84.22, "bw": true, "hide_captions": true },
    { "type": "closer", "start": 92.0, "end": 999, "line1": "ESSA DICA É", "line2": "TOP", "line2_at": 93.56, "hide_captions": true }
  ]
}
```

Renderers disponíveis (`renderers/`): `logo`, `card_hook`, `impact_text`, `subtitle` (legendas
automáticas da transcrição), `checkbox_card`, `gauge`, `hierarchy`, `closer`. Para um elemento novo,
crie um renderer JS com a assinatura `(ctx, seg, t, W, H)` e registre em `index.js`.

### 5. Renderizar
```bash
cd strider-editor && npm install      # canvas
node index.js                          # base (tone-map + cortes + zoom + P&B) + overlays + SFX
node index.js --skip-base              # refaz só overlays/legendas/áudio (bem mais rápido)
```
Como funciona: cortes alinhados ao grid de frames (sem drift) → `base.mkv` → Node desenha cada frame
RGBA no canvas e manda por pipe para o FFmpeg (`overlay=alpha=premultiplied`) → mix voz + SFX → MP4
H.264 CRF 19, AAC 192k, `+faststart`.

### 6. Verificar antes de entregar
- [ ] Transcrever o áudio editado e conferir se os tempos dos elementos batem com as palavras (< 0,1s)
- [ ] Folha de contato com frames de cada elemento (laranja certo, P&B nos segmentos certos, nada cortado)
- [ ] SFX ≥ ~15 dB abaixo da voz em todos os eventos
- [ ] Loudness final ~ -14/-15 LUFS
- [ ] Entregar o MP4 e dizer o que foi cortado

Se o usuário pedir ajustes, mexa no `config.json` e renderize de novo, com `--skip-base` quando os
cortes não mudarem.
