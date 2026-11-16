"""Transcrição com timestamps por palavra (faster-whisper).

Uso: python3 -I transcribe.py <pasta_do_modelo> <audio_16k_mono.wav> <saida.json>

Gere o WAV antes com:
  ffmpeg -i video.MOV -vn -ac 1 -ar 16000 audio.wav

(Lê o WAV com numpy em vez de deixar o faster-whisper abrir via PyAV, que quebra
com algumas versões do pacote `av`.)
"""
import sys
import json
import wave

import numpy as np
from faster_whisper import WhisperModel

model_dir, wav_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
m = WhisperModel(model_dir, device="cpu", compute_type="int8", cpu_threads=4)
wf = wave.open(wav_path)
audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"w": w.word, "s": w.start, "e": w.end} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}", flush=True)
json.dump(out, open(out_path, "w"), ensure_ascii=False, indent=1)
