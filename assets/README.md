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
| `bg_sky.png` | 1 | 16:9 (1920×1080) | Статичное небо с луной, без построек. Не двигается |
| `bg_far.png` | 1 | 16:9, прозрачное небо | Дальний слой: замок, горы, мосты, лава на прозрачном фоне. **Бесшовный по горизонтали**, без луны |
| `bg_mid.png` | 1 | 16:9, прозрачный верх | Ближний слой параллакса: тёмные скалы, знамёна с трезубцем, цепи. Бесшовный по горизонтали |
| `portrait.png` | 1 | 1:1 | Портрет Хеллки для HUD, в рамке |
| `twitch.png` | 1 | 1:1 | Иконка бейджа канала в меню (40×40 в игре). Пока нет — рисуется фиолетовый значок кодом |

## Сборка из сырых генераций

Сырые файлы лежат в `assets_raw/` (PixelLab GIF для персонажа + PNG для остального). Фоны скрипт ищет сначала по именам `bg_sky.png`, `bg_far.png`, `bg_mid.png` в `assets_raw/`, иначе берёт старые генерации. Слой на ярко-зелёном фоне (#00FF00) автоматически кеится в прозрачность. Скрипт нарезает всё в формат игры:

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

### bg_sky.png

```
Pixel art game background of only the sky, 1920x1080, dark fantasy hell atmosphere: crimson-to-dark-red vertical gradient, a few long thin dark cloud streaks, one huge blood-red full moon with visible craters placed in the upper right third. No ground, no buildings, no mountains, no horizon line, no characters, no text — sky and moon only. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, crimson / black color scheme.
```

### bg_far.png

```
Pixel art seamless horizontally tileable parallax layer, 1920x1080, on a transparent background: silhouette of a gothic hell castle with many spires and small lit orange windows, stone bridges with arches, distant dark red mountains, lava river and rocky ground filling the bottom third. The sky area above the skyline must be fully transparent (or, if transparency is not supported, solid pure green #00FF00). No moon, no sky gradient, no clouds, no characters, no text. Left and right edges must match for seamless tiling. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, crimson / black / orange color scheme.
```

### bg_mid.png

```
Pixel art seamless horizontally tileable parallax foreground layer, 1920x1080, transparent background wherever there is no rock: dark volcanic rock spires and cliffs in the bottom third, hanging iron chains and red banners with a trident emblem from the top edge, a stone gargoyle head. No characters, no text. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, game asset layer.
```

### twitch.png

```
Pixel art icon for a streamer badge, square, single centered object: a purple speech-bubble shaped like the Twitch glitch logo with two small red devil horns on top and two white rectangular eyes, slight glow. Purple / white / red palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```

### portrait.png

```
Pixel art square avatar icon, close-up of chibi anime devil girl "Hellka": long bright red hair, small red horns, big blue eyes, slight smirk, dark stone frame border around the icon. 16-bit SNES style, crisp pixels, no anti-aliasing, limited palette, dark fantasy hell theme with crimson / black / orange accents, game HUD icon.
```

## Скины

Второй скин («Княжна Тьмы», тёмный образ) собирается из `assets_raw/dark_skin/`: GIF-ы бега (8 кадров), прыжка, удара и смерти из PixelLab плюс `avatar.png` для портрета. Скрипт ищет файлы по подстрокам `running`, `jump`, `punch`, `death`, `avatar` и кладёт результат в `assets/skins/dark/`. Перекраска волос и рожек к этому скину не применяется. Открывается за достижение «Легенда ада» (2500 очков), переключается кнопкой в меню и паузе или клавишей S.

## Усиления (power-ups)

Пять усилений появляются на платформах с 8-й секунды забега (шанс ~10% на платформу): сердце (+1 жизнь), щит (поглощает один удар), магнит (8 с, предметы летят к Хеллке), ×2 (10 с, все очки удваиваются), пламя (6 с, бесы сгорают от касания). Иконки: `assets_raw/powerups/<id>.png` с именами `heart`, `shield`, `magnet`, `x2`, `fire`; сборка обрежет и уменьшит до 30×30. Пока файлов нет, рисуются цветные кружки кодом.

Общий стиль иконок (в каждом промпте): круглый значок, один объект по центру, тонкая тёмная обводка, прозрачный фон, без рамки, чтобы отличаться от иконок достижений.

### heart.png
```
Pixel art power-up icon, round, single centered object: a bright red heart with a white highlight and a small golden sparkle, thin near-black outline, soft glow. Transparent background, no frame, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### shield.png
```
Pixel art power-up icon, round, single centered object: a glowing blue crystal shield with a small red devil horn emblem, thin near-black outline, soft blue glow. Transparent background, no frame, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### magnet.png
```
Pixel art power-up icon, round, single centered object: a classic horseshoe magnet in orange and dark gray with small red crystals and gold coins being pulled toward it, thin near-black outline. Transparent background, no frame, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### x2.png
```
Pixel art power-up icon, round, single centered object: bold golden glyph "x2" with a red devil tail curling from the 2, thin near-black outline, golden glow. Transparent background, no frame, 16-bit SNES style, crisp pixels, no anti-aliasing.
```
### fire.png
```
Pixel art power-up icon, round, single centered object: a fierce orange and yellow flame with a tiny grinning devil face inside it, thin near-black outline, warm glow. Transparent background, no frame, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```

## Наборы террейна

Дополнительные плитки платформ лежат в `assets_raw/tiles/tile_<имя>.png` в том же формате, что базовая кладка (две плитки рядом на чёрном: верх с кромкой и тело). Сборка нарезает их в `assets/tiles/<имя>.png`. В игре каждая платформа получает набор случайно, зонами по 2–5 платформ подряд; базовая кладка доступна сразу, остальные подключаются по одному каждые 25 секунд забега в порядке: ember, gothic, bone, obsidian.

## Иконки достижений

Клади PNG в `assets_raw/ach/` с именами из таблицы, потом `python tools/build_assets.py`: скрипт обрежет по прозрачности, выровняет в квадрат и уменьшит до 64×64 в `assets/ach/`. Пока файла нет, игра рисует заглушку с первой буквой названия.

Общий стиль для всех иконок (уже включён в каждый промпт): квадратный значок, один крупный объект по центру, тёмно-каменная рамка, багровая с золотом палитра, прозрачный фон.

| Файл | Достижение | Условие |
|---|---|---|
| `first_run.png` | Первый забег | завершить первый забег |
| `score_500.png` | Пятьсот | 500 очков за забег |
| `score_1000.png` | Тысяча | 1000 очков за забег |
| `score_2500.png` | Легенда ада | 2500 очков за забег |
| `crystals_50.png` | Коллекционер | 50 кристаллов за забег |
| `coins_50.png` | Сорока | 50 монет за забег |
| `stomp_10.png` | Бесогон | 10 бесов за забег |
| `speed_2.png` | Разгон | скорость 2.0x |
| `speed_max.png` | Предел | скорость 2.8x |
| `survive_60.png` | Минута в аду | 60 секунд |
| `no_hit_500.png` | Без царапины | 500 очков без урона |
| `deaths_10.png` | Упорство | 10 смертей суммарно |
| `score_666.png` | Княжулечка Тьмулички | закончить забег ровно с 666 очками |
| `score_6666.png` | Княжка Тьмы | 6666 очков за забег |
| `crystals_666.png` | Три шестёрки | 666 кристаллов за всё время |
| `last_heart_60.png` | Не сегодня | 60 секунд на последнем сердце |
| `visit.png` | Заглянуть в гости (скрытое) | клик по бейджу канала во время эфира |
| `lava_66.png` | Купание (скрытое) | 66 смертей в лаве суммарно |
| `hidden.png` | ??? | заглушка для ещё не открытых скрытых достижений |
| `ghost.png` | Призрак (скрытое) | 2000 очков без урона |
| `pacifist.png` | Пацифистка (скрытое) | 90 секунд, не тронув ни беса |
| `perfectionist.png` | Перфекционистка (скрытое) | минута без единого пропущенного кристалла |
| `phoenix.png` | Феникс (скрытое) | 1000 очков на последнем сердце |
| `daredevil.png` | Сорвиголова (скрытое) | 25 кристаллов над пропастью за забег |
| `marathon.png` | Марафон (скрытое) | 3 минуты в одном забеге |
| `midnight.png` | Полуночница (скрытое) | забег от 30 с между полуночью и 4 утра |

### first_run.png
```
Pixel art achievement badge icon, square, single centered object: a small red devil-girl boot taking a first step, motion dust puff behind it. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### score_500.png
```
Pixel art achievement badge icon, square, single centered object: a bronze medal with a five-pointed star. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### score_1000.png
```
Pixel art achievement badge icon, square, single centered object: a silver medal with a small red devil horns emblem. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### score_2500.png
```
Pixel art achievement badge icon, square, single centered object: a golden crown with red gems and small devil horns, glowing. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### crystals_50.png
```
Pixel art achievement badge icon, square, single centered object: a pile of three glowing red ruby crystals. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### coins_50.png
```
Pixel art achievement badge icon, square, single centered object: a small black magpie bird holding a shiny gold coin in its beak. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### stomp_10.png
```
Pixel art achievement badge icon, square, single centered object: a black boot stomping a squashed round red imp with bat wings, tiny stars around it. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### speed_2.png
```
Pixel art achievement badge icon, square, single centered object: a red arrow-tipped devil tail shaped like a speed streak with motion lines. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### speed_max.png
```
Pixel art achievement badge icon, square, single centered object: a fiery comet with a long orange flame trail, blazing. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### survive_60.png
```
Pixel art achievement badge icon, square, single centered object: a gothic hourglass filled with glowing red sand. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### no_hit_500.png
```
Pixel art achievement badge icon, square, single centered object: a red heart inside a shining golden shield, intact and unbroken. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### deaths_10.png
```
Pixel art achievement badge icon, square, single centered object: a small cute skull with tiny red devil horns and a cheeky grin. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```

### score_666.png
```
Pixel art achievement badge icon, square, single centered object: a tiny cute devil girl chibi face with a small golden tiara, winking, the number 666 in small glowing red digits below. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing.
```
### score_6666.png
```
Pixel art achievement badge icon, square, single centered object: a tall dark gothic crown with red gems and devil horns, a purple-black aura behind it, the number 6666 in small glowing red digits below. Dark stone frame border, crimson, purple and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing.
```
### crystals_666.png
```
Pixel art achievement badge icon, square, single centered object: three glowing red crystals arranged in a triangle with the number 666 formed by tiny sparks between them. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing.
```
### last_heart_60.png
```
Pixel art achievement badge icon, square, single centered object: a single cracked red heart held together by golden bandages, still beating with a small glow. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### visit.png
```
Pixel art achievement badge icon, square, single centered object: a small purple Twitch-style speech bubble with devil horns knocking on a wooden door with a glowing red keyhole. Dark stone frame border, purple, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### lava_66.png
```
Pixel art achievement badge icon, square, single centered object: a cute devil girl chibi relaxing in a bubbling lava pool like a hot spring, only her head with horns and a tiny towel visible, steam rising. Dark stone frame border, crimson, orange and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### hidden.png
```
Pixel art achievement badge icon, square, single centered object: a large glowing question mark carved into dark stone, faint red smoke around it. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### ghost.png
```
Pixel art achievement badge icon, square, single centered object: a translucent pale ghost of a cute devil girl with tiny horns, semi-transparent, floating. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### pacifist.png
```
Pixel art achievement badge icon, square, single centered object: a small round red imp with bat wings holding a white dove feather, peaceful, surrounded by a soft golden halo. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### perfectionist.png
```
Pixel art achievement badge icon, square, single centered object: a perfect row of five identical glowing red crystals with a golden checkmark above them. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### phoenix.png
```
Pixel art achievement badge icon, square, single centered object: a burning phoenix bird rising from a single red heart, flames in orange and gold. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### daredevil.png
```
Pixel art achievement badge icon, square, single centered object: a glowing red crystal floating above a lava chasm between two rock ledges, tiny sparks. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### marathon.png
```
Pixel art achievement badge icon, square, single centered object: a winged black boot with a golden laurel wreath around it, motion lines behind. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```
### midnight.png
```
Pixel art achievement badge icon, square, single centered object: a crescent blood-red moon with a tiny devil-horned silhouette sitting on it, a few stars. Dark stone frame border, crimson and gold palette, transparent background, 16-bit SNES style, crisp pixels, no anti-aliasing, no text.
```

## Советы
- Генерируй кадры спрайт-листа за один запрос (иначе персонаж «поплывёт»), либо генерируй один кадр и дорисовывай остальные вручную в Aseprite/Piskel.
- Если генератор не умеет прозрачный фон — генерируй на ярко-зелёном и вырезай.
- После генерации уменьшай до целевого размера с фильтром **nearest neighbor**, иначе пиксели размоются.
- Для Midjourney убери слова «sprite sheet» и «frames» и генерируй по одному кадру: сетки кадров он делает неровно.
