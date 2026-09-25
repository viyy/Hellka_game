# Ассеты

Игра работает без ассетов — рисует процедурные пиксельные заглушки.
Чтобы заменить заглушку, положи PNG с прозрачным фоном в эту папку под нужным именем.
Размер файла может быть любым: игра масштабирует кадр до логического размера (без сглаживания, пиксель-арт остаётся чётким).
Спрайт-листы — **горизонтальные**, все кадры одинаковой ширины, ширина файла = ширина кадра × кол-во кадров.

| Файл | Кадров | Пропорции кадра (ш×в) | Что это |
|---|---|---|---|
| `player_run.png` | 4 | 2:3 (напр. 64×96) | Хеллка бежит вправо, цикл из 4 кадров |
| `player_jump.png` | 1 | 2:3 | Хеллка в прыжке (ноги поджаты) |
| `player_hurt.png` | 1 | 2:3 | Хеллка получила урон (побледнела, откинулась) |
| `player_dead.png` | 1–8 | 2:3 | Анимация смерти, проигрывается один раз (10 к/с), последний кадр держится |
| `imp.png` | 2 | 6:5 (напр. 60×50) | Бес-шарик с рожками и крылышками, смотрит **влево**, 2 кадра (крылья вверх/вниз) |
| `crystal.png` | 1 | 12:17 (напр. 48×68) | Красный кристалл-ромб |
| `coin.png` | 4 | 1:1 | Золотая монета, вращение: анфас → узкая → ребро → узкая |
| `heart.png` | 2 | 14:13 | Кадр 0 — полное красное сердце, кадр 1 — пустое серое |
| `tile.png` | 2 | 1:1 (напр. 64×64) | Кадр 0 — верх платформы (с каменной кромкой), кадр 1 — тело кладки. Должен **бесшовно** стыковаться по горизонтали |
| `spike.png` | 1 | 1:1 | 4 стальных шипа в ряд на прозрачном фоне, острия вверх |
| `lava.png` | 2 | 1:1 | 2 кадра лавы, бесшовный тайл по горизонтали |
| `bg_far.png` | 1 | 16:9 (1920×1080) | Дальний фон: багровое небо, красная луна, силуэт готического замка. **Бесшовный по горизонтали** |
| `bg_mid.png` | 1 | 16:9, прозрачный верх | Ближний слой параллакса: тёмные скалы, знамёна с трезубцем, цепи. Бесшовный по горизонтали |
| `portrait.png` | 1 | 1:1 | Портрет Хеллки для HUD, в рамке |

## Сборка из сырых генераций

Сырые файлы лежат в `assets_raw/` (PixelLab GIF для персонажа + PNG для остального). Скрипт нарезает их в формат игры:

```bash
python tools/build_assets.py
```

Он пишет PNG в `assets/` и `assets/manifest.json` с числом кадров: игра читает его при загрузке, размер кадра берёт из картинки и рисует 1:1. Если поменяешь сырые файлы, просто перезапусти скрипт (префиксы имён файлов заданы внутри).

Музыка: см. `SOUNDTRACK.md`, файл `assets/music.mp3` подхватывается автоматически.

## Промпты для генерации

Каждый промпт самодостаточный — копируй блок целиком. Стиль и палитра уже включены.

### player_run.png

```
Pixel art sprite sheet, 4 frames in a single horizontal row, each frame exactly the same size, side view running cycle facing right. Character: chibi anime devil girl "Hellka" — long bright red hair, small red horns, pointed ears, big blue eyes, black off-shoulder top, light blue pleated skirt, black thigh-high boots, thin red devil tail with arrow tip. Keep the character identical across all frames. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### player_jump.png

```
Pixel art single sprite, side view facing right, mid-air jump pose with knees tucked and hair flowing upward. Character: chibi anime devil girl "Hellka" — long bright red hair, small red horns, pointed ears, big blue eyes, black off-shoulder top, light blue pleated skirt, black thigh-high boots, thin red devil tail with arrow tip. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### player_hurt.png

```
Pixel art single sprite, side view facing right, hit reaction pose: leaning back, eyes squeezed shut, mouth open, small pain sparks around the head. Character: chibi anime devil girl "Hellka" — long bright red hair, small red horns, pointed ears, big blue eyes, black off-shoulder top, light blue pleated skirt, black thigh-high boots, thin red devil tail with arrow tip. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### imp.png

```
Pixel art sprite sheet, 2 frames in a single horizontal row, same size. Small round red imp enemy facing left: angry yellow eyes, tiny black horns, small fangs, little bat wings — frame 1 wings up, frame 2 wings down. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### crystal.png

```
Pixel art single sprite, glowing red ruby crystal gem in a diamond shape, bright highlight in the top-left facet, darker facets at the bottom, subtle outer glow. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### coin.png

```
Pixel art sprite sheet, 4 frames in a single horizontal row, same size, gold coin spinning animation: frame 1 full face, frame 2 three-quarter narrow, frame 3 thin edge, frame 4 three-quarter narrow. Dark orange rim, bright yellow highlight. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### heart.png

```
Pixel art sprite sheet, 2 frames in a single horizontal row, same size, retro game health heart: frame 1 bright red heart with a white highlight, frame 2 the same heart empty — dark gray outline only. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, transparent background, game asset sprite.
```

### tile.png

```
Pixel art sprite sheet, 2 tiles in a single horizontal row, 64x64 each, seamless tileable dark volcanic stone brick: tile 1 is the top edge of a platform with a lighter worn stone rim and tiny glowing lava cracks, tile 2 is a plain brick wall body. Both must tile seamlessly left-to-right. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark purple-gray stone with crimson / orange accents, game asset tileset.
```

### spike.png

```
Pixel art single tile 64x64, four sharp steel spikes in a row pointing up, gray metal with white highlights and dark shading. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme, transparent background, game asset sprite.
```

### lava.png

```
Pixel art sprite sheet, 2 tiles in a single horizontal row, same size, seamless tileable molten lava surface: bright orange-yellow with dark red crust patches and bubbles, glowing yellow top edge, tile 2 has slightly shifted bubbles for a two-frame animation. Both must tile seamlessly left-to-right. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, game asset tileset.
```

### bg_far.png

```
Pixel art seamless horizontally tileable game background, 1920x1080, dark fantasy hell landscape: crimson gradient sky, huge blood-red full moon in the upper right, silhouette of a gothic castle with many spires and small lit orange windows, faint lava glow along the bottom. No characters, no text. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, crimson / black / orange color scheme.
```

### bg_mid.png

```
Pixel art seamless horizontally tileable parallax foreground layer, 1920x1080, transparent background wherever there is no rock: dark volcanic rock spires and cliffs in the bottom third, hanging iron chains and red banners with a trident emblem from the top edge, a stone gargoyle head. No characters, no text. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, game asset layer.
```

### portrait.png

```
Pixel art square avatar icon, close-up of chibi anime devil girl "Hellka": long bright red hair, small red horns, big blue eyes, slight smirk, dark stone frame border around the icon. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, game HUD icon.
```

## Советы
- Генерируй кадры спрайт-листа за один запрос (иначе персонаж «поплывёт»), либо генерируй один кадр и дорисовывай остальные вручную в Aseprite/Piskel.
- Если генератор не умеет прозрачный фон — генерируй на ярко-зелёном и вырезай.
- После генерации уменьшай до целевого размера с фильтром **nearest neighbor**, иначе пиксели размоются.
- Для Midjourney убери слова «sprite sheet» и «frames» и генерируй по одному кадру: сетки кадров он делает неровно.
