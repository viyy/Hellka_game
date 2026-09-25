"""Генерация 8-битных звуковых эффектов чистым numpy → assets/sfx/*.wav
Запуск: python tools/make_sfx.py
Игра подхватывает файлы автоматически (см. game.js, SFX_FILES), иначе синтезирует бипы в WebAudio.
"""
import os, wave, struct
import numpy as np

SR = 22050
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'sfx')
os.makedirs(OUT, exist_ok=True)

def t(dur): return np.arange(int(SR * dur)) / SR

def square(f, dur, duty=0.5):
    """Меандр с произвольной огибающей частоты f (число или массив)."""
    tt = t(dur); f = np.broadcast_to(f, tt.shape)
    phase = np.cumsum(f) / SR
    return np.where((phase % 1.0) < duty, 1.0, -1.0)

def triangle(f, dur):
    tt = t(dur); f = np.broadcast_to(f, tt.shape)
    phase = (np.cumsum(f) / SR) % 1.0
    return 4 * np.abs(phase - 0.5) - 1

def saw(f, dur):
    tt = t(dur); f = np.broadcast_to(f, tt.shape)
    return 2 * ((np.cumsum(f) / SR) % 1.0) - 1

def noise(dur, seed=1):
    return np.random.default_rng(seed).uniform(-1, 1, int(SR * dur))

def env(dur, a=0.005, d=None, sustain=0.0, r=None):
    """ADSR-упрощённо: атака a, спад до sustain за d, хвост r."""
    n = int(SR * dur); e = np.ones(n)
    na = max(1, int(SR * a)); e[:na] = np.linspace(0, 1, na)
    if d:
        nd = int(SR * d); e[na:na + nd] = np.linspace(1, sustain, min(nd, n - na)); e[na + nd:] = sustain
    if r:
        nr = min(n, int(SR * r)); e[-nr:] *= np.linspace(1, 0, nr)
    return e

def slide(f0, f1, dur, curve='exp'):
    tt = t(dur)
    if curve == 'exp': return f0 * (f1 / f0) ** (tt / dur)
    return f0 + (f1 - f0) * tt / dur

def arp(notes, step, wave=square, duty=0.5):
    """Быстрая последовательность нот (арпеджио), каждая по step секунд."""
    parts = [wave(f, step, duty) * env(step, 0.002, r=step * 0.5) if wave is square else wave(f, step) * env(step, 0.002, r=step * 0.5) for f in notes]
    return np.concatenate(parts)

def bitcrush(x, bits=5, down=3):
    """Понижаем разрядность и частоту дискретизации ради «8-битности»."""
    q = 2 ** (bits - 1)
    x = np.round(x * q) / q
    return np.repeat(x[::down], down)[:len(x)]

def save(name, x, vol=0.5):
    x = np.clip(x * vol, -1, 1)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    print(f'{name:10s} {len(x) / SR:.2f}s')

# ── прыжок: быстрый подъём высоты ──
d = 0.16
save('jump', bitcrush(square(slide(220, 880, d), d, 0.5) * env(d, 0.003, r=0.08)), 0.45)
# ── двойной прыжок: две ноты выше ──
d = 0.18
x = np.concatenate([square(slide(440, 880, 0.08), 0.08, 0.25) * env(0.08, r=0.03), square(slide(660, 1320, 0.10), 0.10, 0.25) * env(0.10, r=0.06)])
save('djump', bitcrush(x), 0.4)
# ── монета: короткий треугольный «динь» из двух нот ──
x = np.concatenate([triangle(988, 0.05) * env(0.05, 0.002), triangle(1319, 0.11) * env(0.11, 0.002, r=0.08)])
save('coin', bitcrush(x, 6, 2), 0.55)
# ── кристалл: сверкающее восходящее арпеджио ──
x = arp([1047, 1319, 1568, 2093], 0.06, square, 0.25)
x = np.concatenate([x, square(2093, 0.14, 0.25) * env(0.14, 0.002, r=0.14)])
save('crystal', bitcrush(x, 6, 2), 0.4)
# ── стомп на беса: «сквиш» вниз + шумный хлопок ──
d = 0.2
x = square(slide(400, 90, d), d, 0.5) * env(d, 0.002, r=0.12) + noise(d, 3) * env(d, 0.001, d=0.04, sustain=0) * 0.6
save('stomp', bitcrush(x), 0.5)
# ── урон: жёсткий нисходящий пилообразный зуд ──
d = 0.3
x = saw(slide(200, 55, d), d) * env(d, 0.002, r=0.15)
x = np.sign(x) * np.abs(x) ** 0.5  # чуть перегружаем
save('hurt', bitcrush(x, 4, 3), 0.5)
# ── смерть: долгое падение + низкий удар ──
d = 0.8
fall = saw(slide(330, 40, d), d) * env(d, 0.002, r=0.5)
tremolo = 1 + 0.4 * np.sign(np.sin(2 * np.pi * 14 * t(d)))  # «дрожание» как в старых консолях
thud = np.concatenate([np.zeros(int(SR * 0.55)), (square(slide(80, 30, 0.25), 0.25) + noise(0.25, 5) * 0.4) * env(0.25, 0.002, r=0.22)])
thud = np.pad(thud, (0, max(0, len(fall) - len(thud))))[:len(fall)]
save('dead', bitcrush(fall * tremolo * 0.7 + thud), 0.55)
# ── подтверждение в меню ──
x = np.concatenate([square(659, 0.06, 0.5) * env(0.06, r=0.02), square(988, 0.12, 0.5) * env(0.12, r=0.08)])
save('confirm', bitcrush(x), 0.4)
# ── шаг (тихий тик для бега, опционально) ──
d = 0.05
save('step', bitcrush(noise(d, 7) * env(d, 0.001, r=0.045) * 0.5 + triangle(120, d) * env(d, r=0.04) * 0.5), 0.2)
print('готово →', OUT)
