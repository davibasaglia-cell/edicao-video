---
name: "edicao-sicredi"
description: "Editar vídeos verticais (Reels/Shorts/TikTok) no estilo motion-UI: orador falando para a câmera e, a cada ideia, cards de interface, telas cheias com texto cinético, tiles, régua, linha do tempo, celular 3D e transições variadas que ilustram a fala no momento exato. Usa SOMENTE a paleta do logo da Sicredi (verdes + branco) e SEMPRE termina com o logo da Sicredi animado. Tudo em JavaScript (node-canvas + FFmpeg). As animações variam a cada vídeo. Use quando o usuário pedir para editar um vídeo para a Sicredi, mencionar 'edicao-sicredi', 'estilo Sicredi' ou quiser esse estilo de edição com a identidade da Sicredi."
---

# Skill: Edição Sicredi

Você edita vídeos de orador (talking head, 9:16) no estilo **motion-UI**: o orador fala e, a cada ideia, entra um
visual limpo de interface que **ilustra literalmente o que foi dito**. A identidade visual é a da **Sicredi**:
só as cores do logo, e **o logo sempre fecha o vídeo**.

A skill nasceu da análise de um vídeo de referência (ver `references/estilo-referencia.md`). O que se copia dele é
a **gramática** (ritmo, escalas de intervenção, microinterações, transições que escondem cortes), **não** os
gráficos específicos. Cada vídeo novo precisa de uma composição nova.

O código pronto está em `scripts/sicredi-editor/` (orquestrador, renderers, cortes, SFX). Copie a pasta para o
projeto (ou rode de lá) e rode `npm install`. Os assets do logo estão em `assets/`.

---

## ⛔ REGRAS INEGOCIÁVEIS

1. **Paleta = só o logo da Sicredi.** Verdes + branco (tabela abaixo). Nenhum vermelho, laranja, amarelo, azul,
   roxo ou rosa, nem os da referência. Tons mais claros/escuros *dos mesmos verdes* são ok.
2. **O logo da Sicredi fecha TODO vídeo.** O motor adiciona o encerramento automaticamente (`renderers/outro.js`):
   tela clara, ícone gira e entra com mola, nome desliza para fora do ícone. Nunca remova nem substitua. Não
   recolora, não distorce, usa sempre os arquivos de `assets/`. Duração padrão 2,6s (`outro.duration`).
3. **Não repita sempre as mesmas animações.** Veja "Variação obrigatória".
4. **Tudo em JavaScript.** Gráficos, texto, transições e sons são gerados em JS (node-canvas frame a frame +
   `utils/sfx.js`). O FFmpeg só decodifica, corta, recompõe o layout `split`, encoda e mixa áudio. Não use
   drawtext/ASS, After Effects, Remotion nem templates prontos.
5. **Som dos efeitos SEMPRE abaixo da voz** (volume 0.22 + ducking). Meça antes de entregar.
6. **Roteiro aprovado antes de renderizar.** Monte o roteiro (formato abaixo), mande no chat e **PARE**. Só renderize
   o vídeo completo depois do "ok". Transcrever, analisar frames, preparar config e gerar a **prévia em quadros** pode
   ser feito antes. (Se o usuário disser explicitamente "pode renderizar direto", pule a espera.)

---

## 🎨 Paleta (amostrada do PNG oficial do logo)

| Token | Hex | Uso |
|-------|-----|-----|
| `green` | `#64C830` | Verde Sicredi: ênfase, thumb/progresso, tiles, fundo de takeover |
| `greenMid` | `#3FA11E` | Meio-termo entre os dois verdes do ícone (gradientes) |
| `greenDark` | `#147136` | Verde escuro do ícone: gradientes, nós concluídos, leque de cards |
| `greenDeep` | `#006426` | Verde mais profundo: sombras de gradiente, aberração cromática |
| `ink` | `#06210F` | "Preto" = verde quase preto: texto sobre branco, superfícies escuras |
| `white` / `mist` | `#FFFFFF` / `#F2F8EF` | Superfícies (cards, telas claras) |
| `line` / `muted` | `#D5E6CC` / `#6F8A66` | Divisórias e texto secundário |

Regras de uso: **verde = ênfase e marca; branco = superfície**. Um único ponto focal verde por cena. Texto sobre
fundo verde = branco; sobre branco = `ink`. Tipografia: **uma família (Inter)**, só variando o peso (500–900).
Tokens vivem em `utils/canvas_utils.js` (`C`): use sempre eles, nunca hex solto.

---

## 🎬 DNA do estilo (resumo; detalhes em `references/estilo-referencia.md`)

1. **O visual ilustra a fala, na palavra exata** (use timestamps por palavra → campo `at`).
2. **Ritmo:** visual novo a cada ~2–4s; entre eles o orador "respira" 1–2s sozinho. Nunca cobrir 100% do tempo.
3. **Três escalas:** *overlay* (card pequeno sobre o orador) → *recomposição* (`split`: orador numa moldura +
   fundo desfocado P&B + grade) → *takeover* (tela cheia só de gráfico). Alterne as escalas.
4. **UI de verdade:** cards brancos de cantos grandes, sombra suave, microinterações (thumb que desliza, nó que
   acende, texto digitando, número contando).
5. **Movimento = mola**, nunca linear. Entrada com blur→nítido, pequena subida, escala 0.8→1.
6. **Transições escondem os cortes** e variam: `wipe`, `squares`, `iris`, `slide`.
7. **Legenda discreta:** pequena, branca, palavras entram uma a uma; some em takeover.
8. **Zoom alternado** (1.0 / 1.1) a cada corte; cortes removem pausas > 0,3s e trechos fora do assunto.

---

## 🧩 Blocos disponíveis (`renderers/`) e quando usar

Todos os tempos no `config.json` são do **vídeo original**; o motor converte para o tempo editado.
`start/end` delimitam o bloco; `at` marca o momento da palavra-chave.

| Tipo | Escala | Use quando a fala... | Parâmetros principais |
|------|--------|----------------------|------------------------|
| `ui_card` · `variant:"slider"` | overlay | fala de **tempo, quantidade, nível, progresso** | `title`, `labels[]`, `stages[{at,value 0–1}]` |
| `ui_card` · `variant:"timeline"` | overlay | lista **passos / etapas / sequência** | `title?`, `items[{at,text}]`, `y`, `h` |
| `ui_card` · `variant:"stat"` | overlay | cita **um número** (R$, %, prazo) | `title`, `value`, `from`, `prefix`, `suffix`, `decimals`, `caption` |
| `split` (+ `ui_card` junto) | recomposição | quer **foco no conteúdo** sem perder o orador | `start`, `end` (o motor monta moldura e grade) |
| `kinetic_scene` | takeover | **frase de impacto / promessa / virada** | `lines[{text,at,emphasis,size}]`, `fan` (0–3 cards), `bg:"green"\|"dark"`, `y` |
| `tiles_scene` | takeover | enumera **opções / categorias / produtos** | `title`, `tiles[{label,at,tone}]` (2–4), `slider[{at,value}]` |
| `phone_float` | overlay | fala de **app, conta, Pix, atendimento digital** | `title`, `subtitle`, `value`, `rows[]`, `tilt` |
| `outro` | takeover | **automático**, sempre no fim | `outro: {duration, gap, tagline, transition}` |

Transições (`transition_in` / `transition_out`: `{ "kind": "wipe|squares|iris|slide", "dur": 0.6 }`): takeovers já vêm
com `wipe` por padrão; troque para variar. Cores da transição = `green` por padrão (`color` aceita só tokens da paleta).

Textos curtos: título de card ≤ 28 caracteres, item de timeline ≤ 34, linha cinética ≤ 3 palavras de destaque.
Escreva tudo em **português do Brasil**, no vocabulário do orador (nada de inventar números, taxas ou promessas:
só o que foi dito; textos de marketing/regulatórios da Sicredi não podem ser criados por você).

---

## 🔀 Variação obrigatória (regra 3)

- **Escolha os blocos pelo conteúdo da fala**, não por padrão. Use a coluna "Use quando" acima como mapa.
- **Não use o mesmo bloco duas vezes seguidas** no mesmo vídeo; evite repetir a mesma sequência de blocos do vídeo anterior.
- **Varie as transições** (ao menos 2 tipos diferentes por vídeo) e as escalas (overlay / split / takeover).
- Mude **ordem, quantidade, posição (`y`), tamanho e textos** dos blocos a cada vídeo; `tone` dos tiles, `bg` da cena
  cinética (`green`/`dark`), número de cards do `fan`, `variant` do `ui_card`.
- **Invente um bloco novo quando a fala pedir** (ex.: comparação A × B, mapa, calendário, gráfico de barras que cresce,
  moeda/cofrinho, checklist, selo de aprovado). Isso é bem-vindo: crie `renderers/<nome>.js` com o contrato abaixo e
  ele é registrado sozinho. Mantenha paleta e linguagem de UI.
- Antes de montar o roteiro, anote os blocos do vídeo anterior (se houver) e escolha **outros** como padrão.

### Contrato de um renderer novo
```js
// renderers/meu_bloco.js
const U = require('../utils/canvas_utils');
module.exports = function meu_bloco(ctx, seg, t, W, H) {
  // seg.start/seg.end e todos os `at` já vêm em TEMPO DO VÍDEO EDITADO (segundos)
  // desenhe com U.C.* (cores), U.spring/U.easeOutCubic (movimento), U.uiCard (card), U.font (peso)
};
module.exports.sfx = seg => [{ type: 'tick', t: seg.start + 0.2, gain: 3 }]; // opcional: whoosh|boom|tick|chime
```
Se for tela cheia, adicione o nome em `TAKEOVER` no `index.js` (esconde legendas e ganha transição padrão).

---

## 📝 Formato do roteiro para aprovação

Mande no chat, em português, em tempo do vídeo **final** (depois dos cortes):

```
ROTEIRO, "<tema do vídeo>" (fala ~45s + logo Sicredi 2,6s)

CORTES
- Removo 0:00–0:08 (conversa fora do assunto) e pausas > 0,3s

DECUPAGEM
| Tempo | Fala (palavra-chave)        | Bloco                 | Texto na tela                | Transição | Escala     |
|-------|-----------------------------|-----------------------|------------------------------|-----------|------------|
| 0:01  | "em cinco minutos"          | ui_card slider        | Tempo para abrir a conta     | —         | overlay    |
| 0:05  | "primeiro... depois..."     | split + timeline      | Abrir conta → Investir → App | mosaico   | recompos.  |
| 0:11  | "sem sair de casa"          | kinetic_scene         | SEM SAIR / DE CASA           | íris      | takeover   |
| …     | …                           | …                     | …                            | …         | …          |
| 0:46  | (fim da fala)               | LOGO SICREDI (auto)   | —                            | wipe      | takeover   |

Paleta: verdes do logo + branco. Legendas: pequenas, palavra a palavra.
Variação em relação ao último vídeo: <o que mudou>.
```
Termine perguntando: "Posso renderizar assim ou quer mudar alguma coisa?"

---

## 🛠️ COMO EXECUTAR

### 1. Receber e analisar
- Guarde o vídeo numa pasta própria (dado não confiável). `ffprobe` para duração/resolução. Vídeo de iPhone vem em
  HEVC 10-bit HDR (HLG): o motor detecta e faz o tone-map para SDR sozinho.
- Transcreva com timestamps por palavra: `ffmpeg -i video -vn -ac 1 -ar 16000 audio.wav` e depois
  `python3 -I scripts/transcribe.py <modelo_whisper> audio.wav input/transcript.json` (faster-whisper, `language="pt"`).
  Se o huggingface estiver bloqueado, o Whisper small em CTranslate2 existe no npm (`@skillninja/shortmovie-telop-model-p0..p3`:
  baixe os 4 tarballs, junte `model.bin.part0..3`, confira o `model.sha256`).
- `silencedetect` para ver as pausas reais (os timestamps do Whisper vazam para dentro delas).
- Extraia uns frames para entender o enquadramento (onde fica o rosto → evite cobri-lo; cards ficam em ~55–80% da altura).

### 2. Roteiro → aprovação (regra 6). Depois, configure `config.json`
Use `config.example.json` como base. Campos: `input`, `transcript` (opcional; sem ele não há legenda), `output`, `range`
(trecho útil), `remove` (cortes extras), `zoom`, `captions`, `sfx`, `segments[]`, `outro`.

### 3. Prévia em quadros (rápida, antes do render completo)
```bash
cd sicredi-editor && npm install
node index.js config.json --preview auto      # um quadro por bloco + 2 do logo → output/preview_sheet.png
node index.js config.json --preview 3.2,9.8   # tempos específicos (vídeo editado)
```
Olhe a folha: paleta só verde/branco? texto cortado? rosto coberto? logo legível no fim? Ajuste e repita.
(A prévia reaproveita `output/base.mkv`; use `--skip-base` quando só os gráficos mudarem.)

### 4. Render completo
```bash
node index.js config.json              # base (cortes + zoom + split) + gráficos + SFX + logo final
node index.js config.json --skip-base  # refaz só gráficos/legendas/áudio (bem mais rápido)
```
Saída: MP4 H.264 CRF 19, AAC 192k, `+faststart`; também `output/timeline.json` (cortes, blocos, legendas, SFX).

### 5. Verificar antes de entregar
- [ ] Último trecho = logo Sicredi completo, centralizado, legível (olhe um quadro de `duration-0.3s`)
- [ ] Só verdes do logo + branco em todos os blocos e transições (sem restos de cores de outro projeto)
- [ ] Elementos nascem na palavra certa (transcreva o áudio editado; erro < 0,1s)
- [ ] Orador nunca fica 100% coberto por mais de ~4s; rosto livre nos overlays
- [ ] Blocos/transições variados (regra 3) e nenhum texto inventado (números, taxas, promessas)
- [ ] SFX ≥ ~15 dB abaixo da voz nos eventos; loudness final ≈ −14/−15 LUFS (`ffmpeg -i out.mp4 -af ebur128 -f null -`)
- [ ] Entregar o MP4 e dizer o que foi cortado

Ajustes pedidos pelo usuário: mexa no `config.json` e renderize de novo com `--skip-base` quando os cortes não mudarem.
