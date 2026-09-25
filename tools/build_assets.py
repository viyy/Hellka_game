"""Сборка игровых ассетов из сырых генераций (assets_raw/) в assets/.
Запуск: python tools/build_assets.py
Все спрайты выводятся в 1x логическом размере игры, кадры — горизонтальным листом.
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets_raw')
OUT = os.path.join(ROOT, 'assets')
os.makedirs(OUT, exist_ok=True)
manifest = {}

def raw(prefix):
    for f in sorted(os.listdir(RAW)):
        if f.startswith(prefix) and f.lower().endswith(('.png', '.gif')):
            return os.path.join(RAW, f)
    sys.exit(f'не найден файл с префиксом {prefix}')

ALPHA_THR = 40  # почти прозрачный шум вокруг генераций игнорируем
def alpha_bbox(im):
    return im.split()[3].point(lambda v: 255 if v > ALPHA_THR else 0).getbbox()

def split_by_alpha(im, min_gap=4):
    """Режет RGBA-картинку на объекты по пустым (прозрачным) столбцам."""
    a = im.split()[3]
    w, h = im.size
    px = a.load()
    cols = [any(px[x, y] > ALPHA_THR for y in range(h)) for x in range(w)]
    runs, start, gap = [], None, 0
    for x, c in enumerate(cols + [False]):
        if c:
            if start is None: start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap or x == w:
                runs.append((start, x - gap + 1)); start = None; gap = 0
    frames = []
    for x0, x1 in runs:
        part = im.crop((x0, 0, x1, h))
        frames.append(part.crop(alpha_bbox(part)))
    return frames

def black_bbox(im, thr=40):
    """bbox содержимого на однотонном фоне (цвет фона берём из угла)."""
    im = im.convert('RGB'); bg = im.getpixel((2, 2))
    diff = Image.eval(Image.merge('RGB', [ch.point(lambda v, b=b: abs(v - b)) for ch, b in zip(im.split(), bg)]).convert('L'), lambda v: 255 if v > thr // 3 else 0)
    return diff.getbbox()

def pad_frames(frames, anchor='bottom'):
    mw = max(f.width for f in frames); mh = max(f.height for f in frames)
    out = []
    for f in frames:
        c = Image.new('RGBA', (mw, mh), (0, 0, 0, 0))
        x = (mw - f.width) // 2
        y = mh - f.height if anchor == 'bottom' else (mh - f.height) // 2
        c.paste(f, (x, y), f); out.append(c)
    return out

def save_sheet(name, frames, target_h=None, target_w=None):
    frames = pad_frames(frames)
    fw, fh = frames[0].size
    if target_h: s = target_h / fh
    else: s = target_w / fw
    tw, th = max(1, round(fw * s)), max(1, round(fh * s))
    sheet = Image.new('RGBA', (tw * len(frames), th), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f.resize((tw, th), Image.LANCZOS), (i * tw, 0))
    sheet.save(os.path.join(OUT, name + '.png'))
    manifest[name] = {'frames': len(frames), 'w': tw, 'h': th}
    print(f'{name:14s} {len(frames)} x {tw}x{th}')

def gif_frames(path, pick=None):
    im = Image.open(path); frames = []
    for k in range(im.n_frames):
        im.seek(k); frames.append(im.convert('RGBA'))
    # общий bbox по всем кадрам, чтобы персонаж не "прыгал"
    bb = None
    for f in frames:
        b = alpha_bbox(f); bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    frames = [f.crop(bb) for f in frames]
    if pick is not None: frames = [frames[i] for i in pick]
    return frames

def seamless(im, size):
    """Бесшовный по горизонтали фон: картинка + её зеркало (без «призраков» кроссфейда)."""
    im = im.convert('RGBA').resize(size, Image.LANCZOS)
    out = Image.new('RGBA', (size[0] * 2, size[1]))
    out.paste(im, (0, 0)); out.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (size[0], 0))
    return out

# ── персонаж (PixelLab GIF) ──
S = 72 / 58  # масштаб: рост в беге 58px → 72 логических
run = gif_frames(raw('Idle_v3_running_east'))
save_sheet('player_run', run, target_h=round(run[0].height * S))
jump = gif_frames(raw('side_view_running_cy_running-jump_east'))
save_sheet('player_jump', jump, target_h=round(jump[0].height * S))
dead = gif_frames(raw('Idle_falling-back-death_east'))
save_sheet('player_dead', dead, target_h=round(dead[0].height * S))
hurt = gif_frames(raw('side_view_running_cy_taking-punch_north-east'), pick=[2])
save_sheet('player_hurt', hurt, target_h=round(hurt[0].height * S))

# ── спрайты на прозрачном фоне ──
def rgba(prefix):
    im = Image.open(raw(prefix)).convert('RGBA'); return im.crop(alpha_bbox(im))
save_sheet('imp', split_by_alpha(rgba('638ce106')), target_h=40)
save_sheet('heart', split_by_alpha(rgba('198a803b')), target_h=26)
save_sheet('coin', split_by_alpha(rgba('fda5a9cd')), target_h=24)
save_sheet('crystal', [rgba('63977877')], target_h=34)
save_sheet('spike', [rgba('0f88bda5')], target_w=32)

# ── тайлы на чёрном фоне: две плитки рядом ──
def black_pair(prefix, size):
    im = Image.open(raw(prefix)).convert('RGB'); im = im.crop(black_bbox(im))
    half = im.width // 2
    parts = []
    for x0 in (0, half):
        p = im.crop((x0, 0, x0 + half, im.height)); p = p.crop(black_bbox(p))
        parts.append(p.resize((size, size), Image.LANCZOS).convert('RGBA'))
    return parts
save_sheet('tile', black_pair('662ed930', 96), target_h=48)
save_sheet('lava', black_pair('4d9a5911', 128), target_h=64)

# ── фоны ──
# Фоны. Если в assets_raw лежат файлы с именами bg_sky.png / bg_far.png / bg_mid.png — берём их,
# иначе старые генерации по хэш-префиксу. Слои без альфы, но с ярко-зелёным фоном, кеим по цвету.
def raw_named(name, fallback_prefix=None):
    p = os.path.join(RAW, name)
    if os.path.exists(p): return p
    return raw(fallback_prefix) if fallback_prefix else None
def chroma_key(im, thr=90):
    im = im.convert('RGBA')
    if im.getextrema()[3][0] < 255: return im  # уже есть прозрачность
    px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 150 and r < thr and b < thr: px[x, y] = (r, g, b, 0)
    return im
sky_src = raw_named('bg_sky.png')
if sky_src:
    Image.open(sky_src).convert('RGB').resize((960, 540), Image.LANCZOS).save(os.path.join(OUT, 'bg_sky.png'))
    manifest['bg_sky'] = {'frames': 1, 'w': 960, 'h': 540}; print('bg_sky 960x540 (статичный)')
else:
    print('bg_sky: файла assets_raw/bg_sky.png нет — игра нарисует процедурное небо')
far = seamless(chroma_key(Image.open(raw_named('bg_far.png', '87b6d4c2'))), (960, 540))
far.save(os.path.join(OUT, 'bg_far.png')); manifest['bg_far'] = {'frames': 1, 'w': 1920, 'h': 540}
mid = seamless(chroma_key(Image.open(raw_named('bg_mid.png', 'fb06b7b0'))), (960, 540))
mid.save(os.path.join(OUT, 'bg_mid.png')); manifest['bg_mid'] = {'frames': 1, 'w': 1920, 'h': 540}
print('bg_far/bg_mid 1920x540 (зеркальная стыковка)')

# ── портрет ──
por = Image.open(raw('eefea498')).convert('RGBA').resize((56, 56), Image.LANCZOS)
por.save(os.path.join(OUT, 'portrait.png')); manifest['portrait'] = {'frames': 1, 'w': 56, 'h': 56}

# ── favicon из портрета ──
src = Image.open(raw('eefea498')).convert('RGBA')
w, h = src.size; m = int(min(w, h) * 0.86); src = src.crop(((w - m) // 2, (h - m) // 2 - m // 12, (w + m) // 2, (h + m) // 2 - m // 12))  # лицо крупнее
src.resize((180, 180), Image.LANCZOS).save(os.path.join(ROOT, 'apple-touch-icon.png'))
src.resize((32, 32), Image.LANCZOS).save(os.path.join(ROOT, 'favicon-32.png'))
src.resize((192, 192), Image.LANCZOS).save(os.path.join(ROOT, 'icon-192.png'))
src.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png')

json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
# manifest.js подключается тегом <script> и работает даже при открытии index.html через file://
with open(os.path.join(OUT, 'manifest.js'), 'w') as f:
    f.write('window.ASSET_MANIFEST = ' + json.dumps(manifest) + ';\n')
print('manifest.json / manifest.js записаны')
