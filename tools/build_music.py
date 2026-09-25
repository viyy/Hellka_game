"""Нарезка бесшовных музыкальных петель из сгенерированных треков (assets_raw/*.mp3).
Запуск: python tools/build_music.py
Алгоритм: оцениваем темп → берём кусок в N тактов после интро → точную точку петли ищем
кросс-корреляцией (±1 доля) → короткий кроссфейд на стыке → mp3 + ogg.
Нужен ffmpeg в PATH.
"""
import os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets_raw'); OUT = os.path.join(ROOT, 'assets')
SR = 44100

# какой файл → какая петля. bars — длина петли в тактах 4/4, start — с какой секунды искать
PLAN = {
    'music':      dict(src='84853_1790363450_1.mp3', bars=32, start=8.0),   # база, 152 BPM
    'music_fast': dict(src='84819_1790363190_1.mp3', bars=32, start=8.0),   # разгон, 172 BPM
}

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def tempo(x):
    m = x.mean(1); hop = 512; n = len(m) // hop
    fr = m[:n * hop].reshape(n, hop) * np.hanning(hop)
    spec = np.abs(np.fft.rfft(fr, axis=1))
    flux = np.maximum(spec[1:] - spec[:-1], 0).sum(1); flux -= flux.mean()
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    fps = SR / hop; lo, hi = int(fps * 60 / 220), int(fps * 60 / 80)
    lag = lo + np.argmax(ac[lo:hi])
    # уточняем лаг параболой по соседям
    y0, y1, y2 = ac[lag - 1], ac[lag], ac[lag + 1]; lag = lag + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)
    return 60 * fps / lag

def best_loop(x, start, length, beat):
    """Ищем сдвиг конца в пределах ±1 доли, где end-кусок максимально похож на start-кусок."""
    m = x.mean(1); w = int(SR * 0.25)
    a = m[start:start + w]
    best, best_c = 0, -1e9
    for off in range(-beat, beat + 1, 8):
        b = m[start + length + off:start + length + off + w]
        if len(b) < w: continue
        c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9)
        if c > best_c: best_c, best = c, off
    return length + best, best_c

def make_loop(name, src, bars, start_s):
    x = load(os.path.join(RAW, src))
    bpm = tempo(x); beat = int(SR * 60 / bpm)
    length = beat * 4 * bars
    start = int(SR * start_s)
    # выравниваем старт по ближайшему сильному ударному (максимум энергии в окне ±1 доли)
    m = np.abs(x.mean(1)); win = beat
    seg = m[start - win:start + win]; k = 256
    en = np.convolve(seg ** 2, np.ones(k) / k, 'same'); start = start - win + int(np.argmax(np.diff(en, prepend=en[0])))
    L, corr = best_loop(x, start, length, beat)
    loop = x[start:start + L].copy()
    # кроссфейд стыка: последние fade мс плавно переходят в начало
    fade = int(SR * 0.03); ramp = np.linspace(0, 1, fade)[:, None]
    tail = x[start + L:start + L + fade]
    loop[:fade] = loop[:fade] * ramp + tail * (1 - ramp)
    # нормализация пика
    loop *= 0.95 / (np.abs(loop).max() + 1e-9)
    raw = loop.astype(np.float32).tobytes()
    for ext, args in (('mp3', ['-c:a', 'libmp3lame', '-b:a', '160k']), ('ogg', ['-c:a', 'libvorbis', '-q:a', '5'])):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', *args, os.path.join(OUT, f'{name}.{ext}')], input=raw, check=True)
    print(f'{name:11s} ← {src}  bpm {bpm:5.1f}  start {start / SR:5.2f}s  loop {L / SR:5.2f}s ({bars} тактов)  стык-корреляция {corr:.2f}')

for name, cfg in PLAN.items():
    make_loop(name, cfg['src'], cfg['bars'], cfg['start'])
