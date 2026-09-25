# Саундтрек

## Что уже собрано

| Файл | Источник | Темп | Роль |
|---|---|---|---|
| `music.mp3` / `.ogg` | `assets_raw/84853_1790363450_1.mp3` | 150 BPM | базовый слой, 32 такта (51 с), бесшовная петля |
| `music_fast.mp3` / `.ogg` | `assets_raw/84819_1790363190_1.mp3` | 172 BPM | слой разгона, 32 такта (45 с), бесшовная петля |
| `sfx/*.wav` | синтез numpy | — | jump, djump, coin, crystal, stomp, hurt, dead, confirm, step |

Игра включает базовый слой при старте забега, а с 1.5x скорости плавно подмешивает быстрый; к 2.1x играет только он. При смерти музыка затухает. **M** — выключить звук. Через `http://` музыка идёт по WebAudio без зазора на стыке, при открытии `index.html` через `file://` используется `<audio loop>` с mp3, там на стыке возможен щелчок-пауза в несколько миллисекунд.

Пересборка:

```bash
python tools/build_music.py
```

```bash
python tools/make_sfx.py
```

`build_music.py` сам оценивает темп, выравнивает начало по удару, подбирает точку петли кросс-корреляцией и делает 30 мс кроссфейд. Чтобы взять другой трек или длину, поправь словарь `PLAN` в начале скрипта. Не понравились две неиспользованные вариации (`84819_…_2`, `84853_…_2`, 172 и ~117 BPM) — их можно подставить туда же.

`make_sfx.py` генерирует эффекты из меандра, треугольника, пилы и шума с огибающими и bitcrush до 4–6 бит; параметры каждого звука — отдельный блок в скрипте, правятся числами (частоты, длительность, скважность). Короткие эффекты нейросетям действительно даются плохо, синтез для 8-битного стиля надёжнее и мгновенно перегенерируется.

## Промпт для Suno / Udio (основной трек, зацикленный)

Стиль и текстовое описание — в поле Style/Prompt, режим **Instrumental**:

```
16-bit chiptune metal, SNES / Mega Drive FM-synth style, fast-paced endless runner theme, 170 BPM, driving square-wave lead melody, gritty distorted saw bass, punchy 8-bit drums, dark gothic hell atmosphere with a playful anime edge, minor key (E minor), catchy hook that loops seamlessly, energetic and relentless, no vocals, no intro fade-in, no outro fade-out
```

Если генератор принимает отрицательный промпт или «Exclude styles»:

```
vocals, lyrics, orchestral, slow, ambient, lo-fi, reverb-heavy, fade in, fade out
```

Рекомендуемая длина: 1:30–2:00, затем обрезать в редакторе так, чтобы точка петли попадала на сильную долю. Экспорт в MP3 192 kbps → `assets/music.mp3`.

## Вариант 2: усиливающийся трек под рост скорости

Если хочется, чтобы музыка «разгонялась» вместе с игрой, генерируй три версии одного мотива и переключай по скорости (потребует небольшой доработки кода):

```
[Loop A — 1.0x] 16-bit chiptune, SNES style, endless runner theme, 150 BPM, E minor, square-wave lead, moderate drive, dark gothic hell atmosphere, seamless loop, instrumental
```

```
[Loop B — 1.8x] same melody and key as before, 175 BPM, added distorted saw bass and double-time hi-hats, more intense, seamless loop, instrumental
```

```
[Loop C — 2.5x+] same melody and key, 200 BPM, chiptune metal, blast-beat 8-bit drums, arpeggiated lead, frantic and relentless, seamless loop, instrumental
```

## Промпты для эффектов (если захочешь заменить бипы)

Для ElevenLabs Sound Effects / Stable Audio, по одному файлу на строку:

```
retro 8-bit jump sound, short upward square-wave blip, 0.15 s
retro 8-bit double jump, higher-pitched two-note blip, 0.15 s
retro 8-bit coin pickup, bright short triangle-wave ding, 0.1 s
retro 8-bit crystal pickup, sparkling ascending three-note chime, 0.25 s
retro 8-bit enemy stomp, short squash thud with a low pop, 0.2 s
retro 8-bit hurt sound, harsh descending sawtooth buzz, 0.3 s
retro 8-bit death sound, long descending sawtooth fall with a final low thud, 0.8 s
retro 8-bit menu confirm, two quick ascending square notes, 0.15 s
```
