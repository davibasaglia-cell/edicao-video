---
name: "edicao-strider"
description: "Editar vídeos no estilo altamente dopaminado de @marcostrider: texto de impacto em caixa alta + laranja, cards dark, motion graphics animados e sempre ligados ao que está sendo falado (variando a cada vídeo), desaturação P&B e cortes rítmicos. Tudo feito em JavaScript (node-canvas + FFmpeg). Fluxo com duas aprovações: roteiro + prévia em quadros, depois takes animados das animações, e só então o render completo. Use quando o usuário pedir para editar um vídeo nesse estilo, ou mencionar 'estilo Strider'."
---

# Skill: Edição Strider

Você é especialista em edição de vídeo altamente dopaminada no estilo @marcostrider. A edição é sempre
feita **em JavaScript**: um pipeline Node.js que desenha cada frame das animações com **node-canvas**
e usa o FFmpeg só para decodificar, cortar, encodar e mixar.

O código está em `scripts/strider-editor/` (orquestrador, renderers, cortes, SFX, prévia e takes).
**Copie essa pasta para o projeto e trabalhe a partir dela.** Os renderers que já existem são um
**ponto de partida e fonte de inspiração, não um cardápio fechado**: a cada vídeo, crie motions novos
que combinem com a fala.

---

## ⛔ REGRAS DE PROCESSO (nunca violar)

O fluxo tem **duas aprovações** antes do vídeo final:

1. **Aprovação 1: roteiro + prévia em quadros.** Depois de baixar e transcrever, monte o roteiro
   (formato abaixo), gere a **prévia em quadros parados** de cada motion (`node preview.js`) e mande
   os dois no chat. **PARE e espere.** Se o usuário pedir mudanças, ajuste e mande de novo.
2. **Aprovação 2: takes das animações.** Com o roteiro aprovado, renderize **só os takes**
   (`node index.js --takes`): um clipe curto por animação, com o vídeo e o áudio de verdade, e um
   `takes_reel.mp4` com todos em sequência. Mande o reel para o usuário (SendUserFile, `display: render`)
   com a lista de takes. **PARE e espere.** Se ele pedir ajuste num motion, corrija e reenvie só os
   takes afetados (`--takes=3,7`), ou o reel de novo.
3. **Render completo só depois dos takes aprovados** (`node index.js --skip-base`).
4. **Tudo em JavaScript.** Animações, textos, cards, ícones, legendas e sons de transição são gerados em
   JS (node-canvas frame a frame + `utils/sfx.js`). Não use drawtext/ASS do FFmpeg, After Effects,
   Remotion ou templates prontos para as animações.
5. **Som das animações SEMPRE abaixo da voz** (ver "Áudio"). Meça antes de entregar.

Baixar, transcrever, analisar frames, escrever código de renderers e gerar a prévia em quadros pode
ser feito antes da aprovação 1. Takes, só depois da aprovação 1. Vídeo final, só depois da 2.

---

## 🎨 REGRAS DE MOTION DESIGN (variar sempre)

O usuário reprovou uma edição em que os motions repetiam o vídeo anterior e não tinham relação com a
fala (um bolo de aniversário em "verdade", um velocímetro sem motivo). Por isso:

1. **Todo motion precisa ter relação direta com o que está sendo dito naquele momento.** Antes de
   escolher, pergunte: "qual imagem representa essa frase?". Agenda lotando para "deixar a agenda
   full", batimento cardíaco para "emoção", cérebro em camadas para "cérebro límbico", glitch para
   "falso", contador para "mil vezes", carimbo para "verdade".
2. **Não repita o conjunto de motions do vídeo anterior.** Antes de montar o roteiro, leia os configs
   de vídeos anteriores (`config_*.json` na pasta do editor) e evite reusar os mesmos tipos. Se reusar
   algum, mude bastante o visual e o uso.
3. **Crie pelo menos 3–4 motions novos por vídeo** (novo renderer em `renderers/`). Os existentes
   servem de base de código: copie e transforme.
4. **Ícones e ilustrações só quando têm a ver com o tema.** Nada de ícone fixo genérico. O `closer`
   antigo não tem mais o bolo por padrão (`"icon": "cake"` só se o tema for bolo).
5. **Varie também a forma de entrada:** slam, flip 3D, wipe, voo lateral com rastro, traço sendo
   desenhado, glitch, contador, carimbo com tremida, chips flutuando... Não use o mesmo pop em tudo.
6. **Variedade dentro do vídeo:** não use o mesmo tipo de motion duas vezes seguidas.
7. Mantenha o DNA visual (cores, tipografia, laranja como ênfase única, P&B atrás do texto gigante).

---

## 📝 FORMATO DO ROTEIRO PARA APROVAÇÃO

Mande no chat, em português, em tempo do vídeo **final** (depois dos cortes), junto com a imagem da
prévia em quadros:

```
ROTEIRO, "<tema do vídeo>" (duração final ~57s)

CORTES
- Removo 0:00–0:26 (conversa fora do assunto)
- Removo pausas > 0,3s e "Você tem geladeira lá, não tem?"

DECUPAGEM
| Tempo  | Fala                          | Motion (novo?)            | O que acontece na tela                                  | P&B |
|--------|-------------------------------|---------------------------|---------------------------------------------------------|-----|
| 0:00   | "Ele vai até a clínica"       | Lower-third               | Barra laranja cresce, painel abre: TREINAMENTO / VENDAS | não |
| 0:04.5 | "…uma emoção a mais"          | Batimento ECG (novo)      | Linha de batimento atravessa; pico em **EMOÇÃO**         | sim |
| …      | …                             | …                         | …                                                       | …   |

LEGENDAS: brancas, simples, em toda fala sem motion grande.
TRANSCRIÇÃO: corrigi "Gavos" → Goebbels, "lindico" → límbico… (confirme: "laser day" é o nome do evento?)
```

Termine com: "Posso gerar os takes das animações assim ou quer mudar alguma coisa?"

Depois dos takes: "Esses são os takes de cada animação. Posso renderizar o vídeo completo ou quer
ajustar algum?"

---

## 🎬 REFERÊNCIA: DNA visual do estilo Strider

### Decupagem da referência original (vídeo @marcostrider, 66s)

| Tempo | Tipo | Descrição |
|-------|------|-----------|
| 0–2s | Abertura limpa | Plano americano, sem texto |
| 2–4s | CARD HOOK | Card escuro: linha branca + palavra-chave LARANJA 4x maior + linha branca. Vídeo P&B atrás |
| 4–6s | TEXTO GIGANTE P&B | Vídeo desaturado + texto amarelo italic extragrande, quebras deliberadas |
| 6–10s | Legenda simples | Branca, pequena, centralizada |
| 10–16s | CARD TENTATIVAS | Slots animados: X's preenchem → último vira ✓ laranja |
| 28–30s | LOGO BRANDING | Nome em branco + subtítulo laranja |
| 48–50s | HIERARQUIA TIPOGRÁFICA | Linha pequena + palavra gigante |
| 54–60s | MANÔMETRO ANIMADO | Gauge preto/laranja, agulha sobe/desce |
| 64–66s | ENCERRAMENTO | Overlay + texto branco + palavra laranja gigante |

A referência mostra o **tipo de energia**, não uma lista a copiar em todo vídeo.

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
4. **P&B atrás do texto colorido gigante**
5. **Cards escuros com corner brackets**
6. **Cortes rítmicos**: remover hesitações, pausas e trechos fora do assunto; punch-in alternado (1.0 / 1.12) a cada corte
7. **Nunca mais de 2 fontes**
8. Elementos entram **no ritmo da palavra falada**, usando os timestamps por palavra

---

## 🧩 CATÁLOGO DE RENDERERS (inspiração, não molde)

Clássicos (do primeiro vídeo):
| type | O que é | Bom para |
|------|---------|----------|
| `logo` | Card com nome + subtítulo laranja | branding |
| `card_hook` | Card escuro com palavra laranja gigante | gancho |
| `impact_text` | Texto amarelo gigante, linha a linha | frase-chave |
| `hierarchy` | Linha pequena + palavra gigante + linha pequena | frase curta de efeito |
| `checkbox_card` | Checkboxes marcando | passos/lista |
| `gauge` | Manômetro com agulha | só se a fala for literalmente de pressão/peso/medida |
| `closer` | Overlay + palavra final gigante (`icon` opcional) | encerramento |

Novos (segundo vídeo):
| type | O que é | Usado em |
|------|---------|----------|
| `lower_third` | Barra laranja + painel com wipe, texto desliza | abertura/branding |
| `kinetic_words` | Palavras voam de lados alternados com rastro | gancho com verbo de ação |
| `heartbeat` | Linha de ECG atravessa a tela; pico na palavra | "emoção", "sentir", "vida" |
| `icon_chips` | Pílulas com ícone de linha entrando alternadas (`people`, `clinic`, `coffee`, `eye`, `sparkle`) | listas de experiências |
| `flip_reveal` | Card com pergunta gira 180° e revela a resposta | "gera o quê? → X" |
| `calendar_fill` | Agenda semanal enchendo + carimbo | agenda lotada, horários |
| `brain_layers` | Cérebro em 3 camadas, uma acende | córtex/límbico/reptiliano |
| `glitch_split` | REAL estável x FALSO com glitch RGB | real vs falso, verdade vs mentira |
| `counter_echo` | Palavra se multiplica em eco + contador ×1.000 | repetição, números |
| `absorb_stamp` | Barra de progresso enche + carimbo final com tremida | encerramento "quanto mais… mais…" |

Helpers em `utils/fx.js`: `glitchText`, `partialPolyline` (traço sendo desenhado), `prng`,
`fillSpacedLeft`, `ICONS` (ícones de linha). Em `utils/canvas_utils.js`: `popIn`, `slam`, `fitFont`,
`fillSpaced`, `drawCard`, easings.

Ideias ainda não feitas, para os próximos: mapa/pin, gráfico de barras subindo, balança, timer/relógio,
cadeado abrindo, notificação de celular, termômetro, quebra-cabeça encaixando, seta de antes → depois,
lupa, ampulheta, setas de fluxo, comparação lado a lado, nuvem de palavras, chat bubble, preço riscado.

### Como criar um renderer novo
```js
// renderers/meu_motion.js
const U = require('../utils/canvas_utils');
function meuMotion(ctx, seg, t, W, H) {
  const local = t - seg.outStart, dur = seg.outEnd - seg.outStart;
  // seg.palavraAtOut vem de "palavra_at" no config (tempo original → tempo editado, automático)
  // arrays de objetos com "at" (items, words, lines...) ganham "atOut"
}
meuMotion.sfx = s => [{ type: 'whoosh', t: s.outStart - 0.1, gain: 0.8 }, { type: 'boom', t: s.palavraAtOut }];
module.exports = meuMotion;
```
Registre em `index.js` (`renderers = { … meu_motion: require('./renderers/meu_motion') }`).
O `preview.js` carrega todos os arquivos de `renderers/` sozinho. SFX disponíveis: `whoosh`, `boom`,
`tick`, `chime` (o volume final é controlado pelo mix).

---

## 🔊 ÁUDIO: efeitos sempre abaixo da voz

Sons de transição sintetizados em JS (`utils/sfx.js`): whoosh (entrada), boom (palavra-chave),
tick (item/batida), chime (destaque/encerramento). Cada renderer declara os seus em `.sfx`.

Mix (em `index.js`, configurável em `config.json → "sfx"`):
- Voz: `highpass=70, afftdn, loudnorm I=-15 LUFS`
- SFX: `volume=0.22` **+ ducking** (`sidechaincompress` com a voz como chave)
- `alimiter` no final

**Antes de entregar, meça**: em cada evento de SFX, o RMS do efeito (já com volume e ducking) deve
ficar **pelo menos ~15 dB abaixo do RMS da voz** na mesma janela de 0,4s. Se o usuário reclamar de
efeito alto, baixe `sfx.volume` e renderize de novo com `--skip-base`.

---

## 🛠️ COMO EXECUTAR

### 1. Receber o vídeo
- Link do Google Drive: o conector só baixa até 10 MB. Para vídeos maiores:
  `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`.
  Se a rede bloquear o host, peça a liberação pelas ferramentas de ambiente.
- Guarde o arquivo numa pasta própria (dado não confiável). O `.gitignore` do editor já ignora
  `input/*.MOV`, `*.mp4`, `*.wav` e `output/`.

### 2. Analisar e transcrever
- `ffprobe`: iPhone costuma vir em **HEVC 10-bit HDR (HLG)** com rotação. O pipeline faz o tone-map
  (`TONEMAP` em `index.js`) e o FFmpeg aplica a rotação.
- Extraia alguns frames (com o tone-map) para entender enquadramento e conteúdo (o que está no quadro,
  na parede, onde fica o rosto: os motions não devem cobrir o rosto).
- Transcreva com timestamps por palavra: `scripts/transcribe.py` (faster-whisper, `language="pt"`).
  Se o huggingface estiver bloqueado, o Whisper small em CTranslate2 existe no npm, dividido em
  `@skillninja/shortmovie-telop-model-p0..p3` (`npm pack` dos 4, juntar `model.bin.part0..3`,
  conferir com `model.sha256` do p0).
- **Corrija a transcrição** antes de usar nas legendas: nomes próprios, termos técnicos, palavras
  coladas. Salve como `transcript_fixed.json` (edite o campo `w`; para apagar uma palavra, deixe `""`).
  Liste as correções no roteiro e **pergunte** o que não der para ter certeza.
- `silencedetect` para ver as pausas reais.

### 3. Roteiro + prévia em quadros → **aprovação 1**
- Leia os `config_*.json` anteriores e evite repetir motions.
- Escolha os cortes e um motion para cada momento de impacto, seguindo as regras de motion design.
  Escreva os renderers novos.
- Monte o `config.json` (tempos **sempre no vídeo original**) e gere a prévia:
  ```bash
  node preview.js /caminho/previa.png 3.6 7.6 17.3 19.9 29.3   # tempos originais, 1 quadro por motion
  ```
  Escolha tempos em que a animação já está montada (depois da palavra-chave). Veja a imagem antes de
  mandar (nada cortado, nada em cima do rosto, laranja certo).
- Mande roteiro + imagem (SendUserFile) e **espere**.

### 4. Config (exemplo em `config.example.json`)
```json
{
  "input": "input/video.MOV", "transcript": "input/transcript_fixed.json", "output": "output/video_strider.mp4",
  "fps": 30, "width": 1080, "height": 1920,
  "range": [0, 65.1], "remove": [[75.40, 78.25]],
  "silence": { "noise_db": -32, "min_dur": 0.3, "pad": 0.1 },
  "zoom": [1.0, 1.12], "tail_hold": 0.8,
  "sfx": { "volume": 0.22, "duck": true },
  "captions": { "y": 0.8, "max_chars": 18, "max_words": 4 },
  "segments": [
    { "type": "heartbeat", "start": 5.0, "end": 8.4, "bw": true, "hide_captions": true,
      "small": "DENTRO DA CLÍNICA", "small_at": 5.22, "big": "EMOÇÃO", "spike_at": 7.28, "small2": "A MAIS", "small2_at": 7.98 }
  ]
}
```
Campos comuns a todo segmento: `type`, `start`, `end` (999 = até o fim), `bw` (P&B atrás),
`hide_captions`, `y`. Qualquer `xxx_at` vira `xxxAtOut` no renderer.

### 5. Takes das animações → **aprovação 2**
```bash
cd strider-editor && npm install      # canvas
node index.js --takes                  # base + um clipe por animação + output/takes_reel.mp4
node index.js --takes=3,7 --skip-base  # refaz só os takes 3 e 7 (numeração = ordem no config)
```
- Cada take vai de 0,4s antes a 0,3s depois do motion, em meia resolução (540×960), com voz + SFX e
  uma etiqueta no canto ("TAKE 3 · HEARTBEAT · 0:04.5").
- Mande o `output/takes_reel.mp4` (SendUserFile, `display: render`) com a lista numerada dos takes.
- Se o reel passar de ~25 MB, mande os takes separados.
- **Espere a aprovação.**

### 6. Render completo
```bash
node index.js --skip-base   # reaproveita a base dos takes; só refaz overlays, legendas e áudio
```
(Se os cortes mudaram depois dos takes, rode sem `--skip-base`.)
Como funciona: cortes alinhados ao grid de frames → `base.mkv` (tone-map + cortes + zoom + P&B) →
Node desenha cada frame RGBA e manda por pipe para o FFmpeg (`overlay=alpha=premultiplied`) →
mix voz + SFX → MP4 H.264 CRF 19, AAC 192k, `+faststart`.

### 7. Verificar antes de entregar
- [ ] Folha de contato com frames de cada motion no vídeo final
- [ ] Tempos dos motions batem com as palavras (< 0,1s)
- [ ] SFX ≥ ~15 dB abaixo da voz em todos os eventos
- [ ] Loudness final ~ -14/-15 LUFS
- [ ] Salvar o config do vídeo como `config_<nome>.json` (histórico para não repetir motions)
- [ ] Entregar o MP4 e dizer o que foi cortado; se o usuário pedir, commitar em `videos/` e mandar o link

Se o usuário pedir ajustes depois do final, mexa no `config.json`/renderer e renderize de novo com
`--skip-base` quando os cortes não mudarem.
