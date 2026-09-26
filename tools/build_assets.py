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

def save_sheet(name, frames, target_h=None, target_w=None, out=None, man=None):
    out = out or OUT; man = manifest if man is None else man; os.makedirs(out, exist_ok=True)
    frames = pad_frames(frames)
    fw, fh = frames[0].size
    if target_h: s = target_h / fh
    else: s = target_w / fw
    tw, th = max(1, round(fw * s)), max(1, round(fh * s))
    sheet = Image.new('RGBA', (tw * len(frames), th), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f.resize((tw, th), Image.LANCZOS), (i * tw, 0))
    sheet.save(os.path.join(out, name + '.png'))
    man[name] = {'frames': len(frames), 'w': tw, 'h': th}
    print(f'{name:14s} {len(frames)} x {tw}x{th}' + ('' if out == OUT else f'  → {os.path.relpath(out, OUT)}'))

def gif_frames(path, pick=None, recolor=True):
    im = Image.open(path); frames = []
    for k in range(im.n_frames):
        im.seek(k); frames.append(im.convert('RGBA'))
    # общий bbox по всем кадрам, чтобы персонаж не "прыгал"
    bb = None
    for f in frames:
        b = alpha_bbox(f); bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    frames = [recolor_player(f.crop(bb)) if recolor else f.crop(bb) for f in frames]
    if pick is not None: frames = [frames[i] for i in pick]
    return frames

def seamless(im, size):
    """Бесшовный по горизонтали фон: картинка + её зеркало (без «призраков» кроссфейда)."""
    im = im.convert('RGBA').resize(size, Image.LANCZOS)
    out = Image.new('RGBA', (size[0] * 2, size[1]))
    out.paste(im, (0, 0)); out.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (size[0], 0))
    return out

# ── перекраска персонажа под референс: волосы рыжее и светлее, рожки красно-розовые ──
import colorsys
HORN_DARK = (110, 20, 55); HORN_LIGHT = (240, 105, 135)
def recolor_player(fr):
    """fr — RGBA-кадр. Исходники не меняются, перекраска только на выходе."""
    fr = fr.convert('RGBA'); px = fr.load(); w, h = fr.size
    top = next((y for y in range(h) if any(px[x, y][3] > 0 for x in range(w))), 0)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0: continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            mx = max(r, g, b)
            # рожки: тёмные малонасыщенные (серо-фиолетовые) пиксели у самой макушки; чистую чёрную обводку не трогаем
            if y < top + 10 and mx < 90 and mx > 8 and ss < 0.75:
                k = mx / 78
                px[x, y] = tuple(int(HORN_DARK[i] + (HORN_LIGHT[i] - HORN_DARK[i]) * min(1, k)) for i in range(3)) + (a,)
                continue
            # волосы и хвост: насыщенный красный → оттенок к оранжевому, светлее
            if ss >= 0.55 and (hh >= 330 / 360 or hh <= 20 / 360) and mx > 60:
                hh = (hh + 11 / 360) % 1.0; vv = min(1.0, vv * 1.13); ss = ss * 0.92
                r2, g2, b2 = colorsys.hsv_to_rgb(hh, ss, vv)
                px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return fr

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

# ── дополнительные скины: assets_raw/<папка>/ → assets/skins/<id>/ (без перекраски) ──
SKIN_DIRS = {'dark': 'dark_skin'}
def raw_in(d, sub):
    for f in sorted(os.listdir(d)):
        if sub in f.lower() and f.lower().endswith(('.gif', '.png')): return os.path.join(d, f)
    return None
for sid, sub in SKIN_DIRS.items():
    d = os.path.join(RAW, sub)
    if not os.path.isdir(d): print(f'скин {sid}: папки {sub} нет, пропускаю'); continue
    out = os.path.join(OUT, 'skins', sid); man = manifest.setdefault('skins', {}).setdefault(sid, {})
    srcs = {'run': raw_in(d, 'running-8') or raw_in(d, 'running_east') or raw_in(d, 'run'), 'jump': raw_in(d, 'jump'), 'dead': raw_in(d, 'death'), 'hurt': raw_in(d, 'punch') or raw_in(d, 'hurt'), 'avatar': raw_in(d, 'avatar') or raw_in(d, 'portrait')}
    missing = [k for k, v in srcs.items() if not v]
    if missing: print(f'скин {sid}: нет файлов {missing}, пропускаю'); manifest['skins'].pop(sid, None); continue
    fr = gif_frames(srcs['run'], recolor=False);  save_sheet('player_run', fr, target_h=round(fr[0].height * S), out=out, man=man)
    fr = gif_frames(srcs['jump'], recolor=False); save_sheet('player_jump', fr, target_h=round(fr[0].height * S), out=out, man=man)
    fr = gif_frames(srcs['dead'], recolor=False); save_sheet('player_dead', fr, target_h=round(fr[0].height * S), out=out, man=man)
    fr = gif_frames(srcs['hurt'], pick=[2], recolor=False); save_sheet('player_hurt', fr, target_h=round(fr[0].height * S), out=out, man=man)
    Image.open(srcs['avatar']).convert('RGBA').resize((56, 56), Image.LANCZOS).save(os.path.join(out, 'portrait.png')); man['portrait'] = {'frames': 1, 'w': 56, 'h': 56}

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
    path = prefix if os.path.isabs(prefix) or os.path.exists(prefix) else raw(prefix)
    im = Image.open(path).convert('RGB'); im = im.crop(black_bbox(im))
    half = im.width // 2
    parts = []
    for x0 in (0, half):
        p = im.crop((x0, 0, x0 + half, im.height)); p = p.crop(black_bbox(p))
        parts.append(p.resize((size, size), Image.LANCZOS).convert('RGBA'))
    return parts
save_sheet('tile', black_pair('662ed930', 96), target_h=48)
# дополнительные наборы террейна: assets_raw/tiles/tile_<имя>.png (две плитки рядом на чёрном) → assets/tiles/<имя>.png
tiles_raw = os.path.join(RAW, 'tiles')
if os.path.isdir(tiles_raw):
    tman = manifest.setdefault('tiles', {})
    for f in sorted(os.listdir(tiles_raw)):
        if not f.lower().startswith('tile_') or not f.lower().endswith('.png'): continue
        name = f[5:-4].lower()
        save_sheet(name, black_pair(os.path.join(tiles_raw, f), 96), target_h=48, out=os.path.join(OUT, 'tiles'), man=tman)
# лава: каждый кадр = тайл + его зеркало, чтобы повтор по горизонтали был бесшовным
def mirror_pair(im):
    out = Image.new('RGBA', (im.width * 2, im.height)); out.paste(im, (0, 0)); out.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (im.width, 0)); return out
save_sheet('lava', [mirror_pair(t) for t in black_pair('4d9a5911', 128)], target_h=64)

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

# ── логотип-заголовок (необязательно): assets_raw/title.png → assets/title.png ──
tsrc = raw_named('title.png')
if tsrc:
    tim = chroma_key(Image.open(tsrc)); bb = alpha_bbox(tim)
    if bb: tim = tim.crop(bb)
    k = min(1.0, 700 / tim.width, 220 / tim.height); tim = tim.resize((round(tim.width * k), round(tim.height * k)), Image.LANCZOS)
    tim.save(os.path.join(OUT, 'title.png')); manifest['title'] = {'frames': 1, 'w': tim.width, 'h': tim.height}; print(f'title {tim.width}x{tim.height}')
elif os.path.exists(os.path.join(OUT, 'title.png')):
    os.remove(os.path.join(OUT, 'title.png'))

# ── иконка бейджа Twitch (необязательно): assets_raw/twitch.png → assets/twitch.png 40x40 ──
tw = raw_named('twitch.png')
if tw:
    im = chroma_key(Image.open(tw)); bb = alpha_bbox(im)
    if bb: im = im.crop(bb)
    m = max(im.size); sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.paste(im, ((m - im.width) // 2, (m - im.height) // 2), im)
    sq.resize((40, 40), Image.LANCZOS).save(os.path.join(OUT, 'twitch.png')); manifest['twitch'] = {'frames': 1, 'w': 40, 'h': 40}; print('twitch 40x40')

# ── иконки усилений (необязательно): assets_raw/powerups/<id>.png → assets/pw_<id>.png 30x30 ──
pw_raw = os.path.join(RAW, 'powerups'); n_pw = 0
if os.path.isdir(pw_raw):
    for pid in ['heart', 'shield', 'magnet', 'x2', 'fire']:
        sp = os.path.join(pw_raw, pid + '.png')
        if not os.path.exists(sp): continue
        im = chroma_key(Image.open(sp)); bb = alpha_bbox(im)
        if bb: im = im.crop(bb)
        m = max(im.size); sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.paste(im, ((m - im.width) // 2, (m - im.height) // 2), im)
        sq.resize((30, 30), Image.LANCZOS).save(os.path.join(OUT, 'pw_' + pid + '.png')); manifest['pw_' + pid] = {'frames': 1, 'w': 30, 'h': 30}; n_pw += 1
print(f'иконки усилений: {n_pw}/5 (остальные — заглушки в игре)')

# ── портрет ──
por = Image.open(raw_named('avatar.png', 'eefea498')).convert('RGBA').resize((56, 56), Image.LANCZOS)  # assets_raw/avatar.png, иначе старая генерация
por.save(os.path.join(OUT, 'portrait.png')); manifest['portrait'] = {'frames': 1, 'w': 56, 'h': 56}

# ── favicon из портрета ──
src = Image.open(raw_named('avatar.png', 'eefea498')).convert('RGBA')
w, h = src.size; m = int(min(w, h) * 0.86); src = src.crop(((w - m) // 2, (h - m) // 2 - m // 12, (w + m) // 2, (h + m) // 2 - m // 12))  # лицо крупнее
src.resize((180, 180), Image.LANCZOS).save(os.path.join(ROOT, 'apple-touch-icon.png'))
src.resize((32, 32), Image.LANCZOS).save(os.path.join(ROOT, 'favicon-32.png'))
src.resize((192, 192), Image.LANCZOS).save(os.path.join(ROOT, 'icon-192.png'))
src.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, 'icon-512.png'))
# maskable: безопасная зона — центральные 80%, поэтому лицо уменьшаем и кладём на фон
mk = Image.new('RGBA', (512, 512), (18, 6, 12, 255)); face = src.resize((410, 410), Image.LANCZOS); mk.paste(face, (51, 51), face)
mk.save(os.path.join(ROOT, 'icon-512-maskable.png'))
src.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png')

# ── Open Graph превью 1200x630: сцена из игровых слоёв + Хеллка + заголовок ──
from PIL import ImageDraw, ImageFont
OW, OH = 1200, 630
og = Image.new('RGBA', (OW, OH))
sky = Image.open(os.path.join(OUT, 'bg_sky.png')).convert('RGBA') if os.path.exists(os.path.join(OUT, 'bg_sky.png')) else None
farL = Image.open(os.path.join(OUT, 'bg_far.png')).convert('RGBA'); midL = Image.open(os.path.join(OUT, 'bg_mid.png')).convert('RGBA')
sc = OH / 540  # слои 960x540 → высота 630
def fit(im): return im.resize((round(im.width * sc), OH), Image.LANCZOS)
if sky: og.alpha_composite(fit(sky), (0, 0)); og.alpha_composite(fit(sky), (round(960 * sc), 0))
og.alpha_composite(fit(farL), (-260, 0)); og.alpha_composite(fit(midL), (-700, 0))
og.alpha_composite(Image.new('RGBA', (OW, OH), (15, 0, 8, 70)))
# лава и платформа
lava = Image.open(os.path.join(OUT, 'lava.png')).convert('RGBA'); lfw = lava.width // manifest['lava']['frames']; lf = lava.crop((0, 0, lfw, 64)).resize((lfw * 3 // 2, 96), Image.NEAREST)
for x in range(0, OW, lf.width): og.alpha_composite(lf, (x, OH - 90))
tile = Image.open(os.path.join(OUT, 'tile.png')).convert('RGBA'); tt = tile.crop((0, 0, 48, 48)).resize((72, 72), Image.NEAREST); tb = tile.crop((48, 0, 96, 48)).resize((72, 72), Image.NEAREST)
for x in range(0, 620, 72): og.alpha_composite(tt, (x, 450)); og.alpha_composite(tb, (x, 522))
# предметы — из исходников, чтобы не было мыла
def nearest_x(im, k): return im.resize((im.width * k, im.height * k), Image.NEAREST)
cr = rgba('63977877').resize((48, 68), Image.LANCZOS)
cn = split_by_alpha(rgba('fda5a9cd'))[0]; cn = cn.resize((round(cn.width * 48 / cn.height), 48), Image.LANCZOS)
for i in range(3): og.alpha_composite(cr, (700 + i * 90, 300 - [0, 40, 0][i]))
for i in range(4): og.alpha_composite(cn, (860 + i * 60, 420))
imp = split_by_alpha(rgba('638ce106'))[0]; imp = imp.resize((round(imp.width * 80 / imp.height), 80), Image.LANCZOS)
og.alpha_composite(imp, (470, 450 - imp.height))
# Хеллка — кадр прыжка из GIF, увеличен в 4 раза без сглаживания
hero = nearest_x(gif_frames(raw('side_view_running_cy_running-jump_east'))[3], 4)
og.alpha_composite(hero, (250, 200))
# заголовок
d = ImageDraw.Draw(og)
def text(s, xy, size, fill, font='impact.ttf', shadow=6, anchor='la'):
    f = ImageFont.truetype('C:/Windows/Fonts/' + font, size)
    d.text((xy[0] + shadow, xy[1] + shadow), s, font=f, fill=(0, 0, 0, 230), anchor=anchor)
    d.text(xy, s, font=f, fill=fill, anchor=anchor)
# заголовок тем же рукописным шрифтом, что в игре: обводка + вертикальный градиент
if os.path.exists(os.path.join(OUT, 'title.png')):
    tl = Image.open(os.path.join(OUT, 'title.png')).convert('RGBA'); k = min(560 / tl.width, 200 / tl.height); tl = tl.resize((round(tl.width * k), round(tl.height * k)), Image.LANCZOS)
    og.alpha_composite(tl, (60, 40)); title = None
else: title = 'Хеллка'
LOB = os.path.join(OUT, 'fonts', 'Lobster-Regular.ttf')
tf = ImageFont.truetype(LOB, 150); tx, ty = 70, 40
if title: d.text((tx + 8, ty + 10), title, font=tf, fill=(0, 0, 0, 160))
if title:
    d.text((tx, ty), title, font=tf, fill=(26, 4, 8, 255), stroke_width=12, stroke_fill=(26, 4, 8, 255))
    bb = d.textbbox((tx, ty), title, font=tf)
    mask = Image.new('L', og.size, 0); ImageDraw.Draw(mask).text((tx, ty), title, font=tf, fill=255)
    grad = Image.new('RGBA', og.size); gd = ImageDraw.Draw(grad)
    for y in range(bb[1], bb[3] + 1):
        k = (y - bb[1]) / max(1, bb[3] - bb[1])
        c = (255, 214, 110) if k < 0.42 else (255, 90, 64)
        c2 = (255, 90, 64) if k < 0.42 else (168, 15, 30)
        kk = k / 0.42 if k < 0.42 else (k - 0.42) / 0.58
        gd.line([(bb[0], y), (bb[2], y)], fill=tuple(int(c[i] + (c2[i] - c[i]) * kk) for i in range(3)) + (255,))
    og.paste(grad, (0, 0), mask)
text('viyy.github.io/Hellka_game', (OW - 40, OH - 24), 26, (255, 230, 128), 'consolab.ttf', 3, 'rd')
og.convert('RGB').save(os.path.join(ROOT, 'og.png'), optimize=True)
print('og.png 1200x630')

# ── иконки достижений: assets_raw/ach/<id>.png → assets/ach/<id>.png 64x64 ──
ACH_IDS = ['first_run', 'score_500', 'score_1000', 'score_2500', 'crystals_50', 'coins_50', 'stomp_10', 'speed_2', 'speed_max', 'survive_60', 'no_hit_500', 'deaths_10',
           'score_666', 'score_6666', 'crystals_666', 'last_heart_60', 'visit', 'lava_66', 'ghost', 'pacifist', 'perfectionist', 'phoenix', 'daredevil', 'marathon', 'midnight', 'hidden']
ach_raw = next((os.path.join(RAW, d) for d in ('ach', 'achiv', 'achievements') if os.path.isdir(os.path.join(RAW, d))), os.path.join(RAW, 'ach')); ach_out = os.path.join(OUT, 'ach'); os.makedirs(ach_out, exist_ok=True); n_ach = 0
for aid in ACH_IDS:
    src_p = os.path.join(ach_raw, aid + '.png')
    if not os.path.exists(src_p): continue
    im = Image.open(src_p).convert('RGBA'); bb = alpha_bbox(im)
    if bb: im = im.crop(bb)
    m = max(im.size); sq = Image.new('RGBA', (m, m), (0, 0, 0, 0)); sq.paste(im, ((m - im.width) // 2, (m - im.height) // 2), im)
    sq.resize((64, 64), Image.LANCZOS).save(os.path.join(ach_out, aid + '.png')); n_ach += 1
print(f'иконки достижений: {n_ach}/{len(ACH_IDS)} (остальные — заглушки в игре)')

json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
# manifest.js подключается тегом <script> и работает даже при открытии index.html через file://
with open(os.path.join(OUT, 'manifest.js'), 'w') as f:
    f.write('window.ASSET_MANIFEST = ' + json.dumps(manifest) + ';\n')
print('manifest.json / manifest.js записаны')

# ── PWA: service worker со списком всех файлов и версией-хэшем ──
import hashlib
files = ['./', 'index.html', 'game.js', 'manifest.webmanifest', 'favicon.ico', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png']
for dp, _, fns in os.walk(OUT):
    for fn in sorted(fns):
        if fn.lower().endswith(('.png', '.wav', '.ogg', '.mp3', '.js', '.json', '.ttf')):
            files.append(os.path.relpath(os.path.join(dp, fn), ROOT).replace(os.sep, '/'))
h = hashlib.sha1()
for f in files:
    fp = os.path.join(ROOT, 'index.html' if f == './' else f)
    if os.path.exists(fp): h.update(open(fp, 'rb').read())
ver = h.hexdigest()[:10]
sw = """// Сгенерировано tools/build_assets.py — не править руками
const CACHE = 'hellka-%s';
const FILES = %s;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Навигация (открытие страницы, в т.ч. из ярлыка PWA): сначала сеть, при неудаче — кэш index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
      return res;
    }).catch(() => caches.match('./').then(r => r || caches.match('index.html'))));
    return;
  }
  // Остальное: кэш, затем сеть с докэшированием
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })).catch(() => new Response('', { status: 504, statusText: 'offline' })));
});
""" % (ver, json.dumps(files, ensure_ascii=False, indent=0))
open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(sw)
print(f'sw.js: {len(files)} файлов, версия {ver}')
