/* Хеллка — бесконечный платформер. Один файл, без зависимостей.
   Ассеты: если в папке assets/ лежит PNG с нужным именем — он используется,
   иначе рисуется процедурная пиксельная заглушка. См. assets/README.md */
(() => {
'use strict';
const W = 960, H = 540;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ───────────────────────── АССЕТЫ ─────────────────────────
// key: {frames, w, h} — w/h это логический размер кадра в игре (px)
const MANIFEST = {
  player_run:  { frames: 4, w: 48, h: 72 },
  player_jump: { frames: 1, w: 48, h: 72 },
  player_hurt: { frames: 1, w: 48, h: 72 },
  player_dead: { frames: 1, w: 48, h: 72 },
  imp:         { frames: 2, w: 48, h: 40 },
  crystal:     { frames: 1, w: 24, h: 34 },
  coin:        { frames: 4, w: 24, h: 24 },
  heart:       { frames: 2, w: 28, h: 26 },   // кадр 0 — полное, 1 — пустое
  tile:        { frames: 2, w: 48, h: 48 },   // 0 — верх платформы, 1 — тело
  spike:       { frames: 1, w: 32, h: 32 },
  lava:        { frames: 2, w: 64, h: 64 },
  bg_sky:      { frames: 1, w: 960, h: 540 }, // небо и луна, статично
  bg_far:      { frames: 1, w: 960, h: 540 }, // замок с прозрачным небом (parallax дальний)
  bg_mid:      { frames: 1, w: 960, h: 540 }, // скалы (parallax ближний, с прозрачностью)
  portrait:    { frames: 1, w: 56, h: 56 },
  title:       { frames: 1, w: 560, h: 150 }, // сгенерированный логотип (необязательно)
  twitch:      { frames: 1, w: 40, h: 40 },   // иконка бейджа канала (необязательно)
  pw_heart:    { frames: 1, w: 30, h: 30 },   // усиления (assets/pw_*.png, иначе заглушки)
  pw_shield:   { frames: 1, w: 30, h: 30 },
  pw_magnet:   { frames: 1, w: 30, h: 30 },
  pw_x2:       { frames: 1, w: 30, h: 30 },
  pw_fire:     { frames: 1, w: 30, h: 30 },
};
const IMG = {};

function pix(map, pal, scale) {
  const rows = map.trim().split('\n').map(r => r.trim());
  const c = document.createElement('canvas');
  c.width = rows[0].length * scale; c.height = rows.length * scale;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x * scale, y * scale, scale, scale);
  }));
  return c;
}
function sheet(canvases) {
  const c = document.createElement('canvas');
  c.width = canvases.reduce((s, k) => s + k.width, 0); c.height = canvases[0].height;
  const g = c.getContext('2d'); let x = 0;
  for (const k of canvases) { g.drawImage(k, x, 0); x += k.width; }
  return c;
}

const PAL = { R:'#d8322a', D:'#8f1d14', S:'#f7d6bd', E:'#3a7fe0', K:'#1b1b22', B:'#87b6ea', L:'#5a8bd0', W:'#ffffff', Y:'#ffd23a', O:'#d98a00', G:'#4a4a52', H:'#6c6c78', A:'#2c2c34', T:'#ff6a2a', F:'#ffd45a', P:'#ff2d2d', N:'#8b0000', M:'#ffb0a8' };

const HEAD = `....RR....RR....
...RRRR..RRRR...
..RRRRRRRRRRRR..
.RRRRRRRRRRRRRR.
.RRRSSSSSSSSRRR.
.RRSSSSSSSSSSRR.
.RRSSESSSSESSRR.
.RRSSESSSSESSRR.
.RRSSSSSSSSSSRR.
.RRRSSSSKSSSRRR.
.RRRRSSSSSSRRRR.
RRRRKKKKKKKKRRRR
RRRKKKKKKKKKKRRR
RR.KKKKKKKKKK.RR
R..SKKKKKKKKS..R
...SBBBBBBBBS...`;
const LEGS = [
`..R.BBBBBBBB.R..
.RR.BLBBBBLB....
RR..SS....SS....
....KK....KK....
....KK....KK....
....KK....KK....
...KKK....KKK...
...KKK....KKK...`,
`.R..BBBBBBBB.R..
RR..BLBBBBLB....
R...SSS..SS.....
...KK.....KK....
..KK.......KK...
.KKK.......KKK..
.KKK............
................`,
`..R.BBBBBBBB.R..
.RR.BLBBBBLB....
RR..SS....SS....
....KK....KK....
....KK....KK....
....KK....KK....
...KKK....KKK...
...KKK....KKK...`,
`.R..BBBBBBBB.R..
RR..BLBBBBLB....
R....SS..SSS....
.....KK....KK...
....KK......KK..
...KKK......KKK.
............KKK.
................`];
const HELLKA = LEGS.map(l => HEAD + '\n' + l);
const HELLKA_JUMP = HEAD.replace(/RRRRKKKKKKKKRRRR\nRRRKKKKKKKKKKRRR/, 'RRRSKKKKKKKKSRRR\nRRSKKKKKKKKKKSRR') + `
..R.BBBBBBBB.R..
.RR.BLBBBBLB.RR.
RR...SS..SS..RR.
....KKK..KKK....
...KKK....KKK...
...KKK....KKK...
................
................`;
const IMP = [
`...K......K...
..KRK....KRK..
..RRRRRRRRRR..
.RRRRRRRRRRRR.
RRRYYRRRRYYRRR
RRRYKRRRRKYRRR
RRRRRRRRRRRRRR
RRRRWRRRRWRRRR
.RRRDRRRRDRRR.
..RRRRRRRRRR..
...KK....KK...
..............`,
`...K......K...
..KRK....KRK..
..RRRRRRRRRR..
.RRRRRRRRRRRR.
RRRYYRRRRYYRRR
RRRYKRRRRKYRRR
RRRRRRRRRRRRRR
RRRRWRRRRWRRRR
.RRRDRRRRDRRR.
..RRRRRRRRRR..
..............
...KK....KK...`];
const CRYSTAL = `....PP....
...PMPP...
..PMPPPP..
.PMPPPPPP.
PMPPPPPPPP
PPPPPPPPPP
NPPPPPPPPN
.NPPPPPPN.
..NPPPPN..
...NPPN...
....NN....`;
const COINS = [
`..OOOOOO..
.OYYYYYYO.
OYYFFFFYYO
OYFYYYYFYO
OYFYYYYFYO
OYFYYYYFYO
OYFYYYYFYO
OYYFFFFYYO
.OYYYYYYO.
..OOOOOO..`,
`...OOOO...
..OYYYYO..
.OYFFFFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFFFFYO.
..OYYYYO..
...OOOO...`,
`....OO....
....OO....
...OYYO...
...OYYO...
...OYYO...
...OYYO...
...OYYO...
...OYYO...
....OO....
....OO....`,
`...OOOO...
..OYYYYO..
.OYFFFFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFYYFYO.
.OYFFFFYO.
..OYYYYO..
...OOOO...`];
const HEARTS = [
`..PPP...PPP..
.PMPPP.PPPPP.
PMPPPPPPPPPPP
PPPPPPPPPPPPP
PPPPPPPPPPPPP
NPPPPPPPPPPPN
.NPPPPPPPPPN.
..NPPPPPPPN..
...NPPPPPN...
....NPPPN....
.....NPN.....
......N......`,
`..AAA...AAA..
.AGAAA.AAAAA.
AGAAAAAAAAAAA
AAAAAAAAAAAAA
AAAAAAAAAAAAA
AAAAAAAAAAAAA
.AAAAAAAAAAA.
..AAAAAAAAA..
...AAAAAAA...
....AAAAA....
.....AAA.....
......A......`];

function makeTile(top) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2126'; g.fillRect(0, 0, 32, 32);
  const rnd = mulberry(top ? 7 : 13);
  for (let y = 0; y < 32; y += 8) {
    const off = (y / 8) % 2 ? 8 : 0;
    for (let x = -8; x < 32; x += 16) {
      const v = 0.75 + rnd() * 0.3;
      g.fillStyle = `rgb(${62*v|0},${52*v|0},${58*v|0})`;
      g.fillRect(x + off + 1, y + 1, 14, 6);
      g.fillStyle = `rgba(255,255,255,0.07)`; g.fillRect(x + off + 1, y + 1, 14, 1);
    }
  }
  if (top) { g.fillStyle = '#6a5a62'; g.fillRect(0, 0, 32, 3); g.fillStyle = '#8b6a6e'; g.fillRect(0, 0, 32, 1); }
  return c;
}
function makeSpike() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    const x = i * 8;
    g.fillStyle = '#c9c9d4'; g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 4, 6); g.lineTo(x + 8, 32); g.fill();
    g.fillStyle = '#7a7a86'; g.beginPath(); g.moveTo(x + 4, 6); g.lineTo(x + 8, 32); g.lineTo(x + 5, 32); g.fill();
  }
  return c;
}
function makeLava(phase) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ff5a12'; g.fillRect(0, 0, 64, 64);
  const rnd = mulberry(21 + phase);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = ['#ffb03a', '#ff8a1e', '#d8300a', '#ffe680'][i % 4];
    g.fillRect((rnd() * 64) | 0, (rnd() * 64) | 0, 2 + (rnd() * 8) | 0, 2 + (rnd() * 3) | 0);
  }
  g.fillStyle = '#ffe680'; g.fillRect(0, 0, 64, 2);
  return c;
}
function makeBgSky() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 540);
  grd.addColorStop(0, '#2a0a16'); grd.addColorStop(0.55, '#6a1420'); grd.addColorStop(1, '#a52a1a');
  g.fillStyle = grd; g.fillRect(0, 0, 960, 540);
  // луна
  g.fillStyle = '#c8202a'; g.beginPath(); g.arc(640, 150, 95, 0, 7); g.fill();
  g.fillStyle = '#e0303a'; g.beginPath(); g.arc(640, 150, 80, 0, 7); g.fill();
  g.fillStyle = '#b81c26'; [[600,120,14],[670,180,20],[650,110,8],[610,190,10]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill();});
  return c;
}
function makeBgFar() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const g = c.getContext('2d');
  // замок: башни (небо прозрачное — его рисует bg_sky)
  const rnd = mulberry(3);
  g.fillStyle = '#3a0d18';
  for (let x = 0; x < 960; x += 60 + rnd() * 80) {
    const w = 30 + rnd() * 50, h = 120 + rnd() * 220;
    g.fillRect(x, 540 - h, w, h);
    g.beginPath(); g.moveTo(x - 4, 540 - h); g.lineTo(x + w / 2, 540 - h - 40 - rnd() * 60); g.lineTo(x + w + 4, 540 - h); g.fill();
    for (let wy = 540 - h + 30; wy < 500; wy += 40) if (rnd() > 0.5) { g.fillStyle = '#ffb02a'; g.fillRect(x + w / 2 - 3, wy, 5, 8); g.fillStyle = '#3a0d18'; }
  }
  return c;
}
function makeBgMid() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const g = c.getContext('2d');
  const rnd = mulberry(9);
  g.fillStyle = '#1e0a10';
  for (let x = -40; x < 1000; x += 40 + rnd() * 60) {
    const h = 60 + rnd() * 160, w = 50 + rnd() * 70;
    g.beginPath(); g.moveTo(x, 540); g.lineTo(x + w * 0.3, 540 - h); g.lineTo(x + w * 0.6, 540 - h * 0.8); g.lineTo(x + w, 540); g.fill();
  }
  // знамёна
  g.fillStyle = '#5a0e14';
  for (let i = 0; i < 4; i++) { const x = 120 + i * 260 + rnd() * 60; g.fillRect(x, 0, 30, 90 + rnd() * 60); g.fillStyle = '#7a1420'; g.fillRect(x + 12, 20, 6, 30); g.fillStyle = '#5a0e14'; }
  return c;
}
function makeTwitchIcon() {
  const c = document.createElement('canvas'); c.width = 40; c.height = 40; const g = c.getContext('2d');
  g.fillStyle = '#9146ff'; g.fillRect(6, 8, 28, 22); g.fillRect(10, 30, 6, 6); g.fillRect(6, 4, 28, 4);
  g.fillStyle = '#e8352a'; g.fillRect(8, 0, 4, 6); g.fillRect(28, 0, 4, 6); // рожки
  g.fillStyle = '#fff'; g.fillRect(16, 12, 4, 10); g.fillRect(24, 12, 4, 10); // «глаза» как у логотипа
  return c;
}
function makePwIcon(col, glyph) {
  const c = document.createElement('canvas'); c.width = 30; c.height = 30; const g = c.getContext('2d');
  g.fillStyle = '#1a0408'; g.beginPath(); g.arc(15, 15, 14, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(15, 15, 11, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(glyph, 15, 16);
  return c;
}
function makePortrait() {
  const c = document.createElement('canvas'); c.width = 56; c.height = 56;
  const g = c.getContext('2d');
  g.fillStyle = '#3a1520'; g.fillRect(0, 0, 56, 56);
  g.drawImage(pix(HELLKA[0], PAL, 4), -4, 4, 64, 96);
  g.strokeStyle = '#8b6a6e'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 53, 53);
  return c;
}

function fallback(key) {
  switch (key) {
    case 'player_run':  return sheet(HELLKA.map(m => pix(m, PAL, 3)));
    case 'player_jump': return pix(HELLKA_JUMP, PAL, 3);
    case 'player_hurt':
    case 'player_dead': return pix(HELLKA_JUMP, { ...PAL, S:'#ffe0e0', R:'#ff8080', K:'#5a3a44' }, 3);
    case 'imp':         return sheet(IMP.map(m => pix(m, PAL, 3)));
    case 'crystal':     return pix(CRYSTAL, PAL, 3);
    case 'coin':        return sheet(COINS.map(m => pix(m, PAL, 2)));
    case 'heart':       return sheet(HEARTS.map(m => pix(m, PAL, 2)));
    case 'tile':        return sheet([makeTile(true), makeTile(false)]);
    case 'spike':       return makeSpike();
    case 'lava':        return sheet([makeLava(0), makeLava(1)]);
    case 'bg_sky':      return makeBgSky();
    case 'bg_far':      return makeBgFar();
    case 'bg_mid':      return makeBgMid();
    case 'portrait':    return makePortrait();
    case 'title':       return null; // нет файла — заголовок рисуется процедурно (drawTitle)
    case 'twitch':      return makeTwitchIcon();
    case 'pw_heart':    return makePwIcon('#ff3b5c', '♥');
    case 'pw_shield':   return makePwIcon('#4fa3ff', '◈');
    case 'pw_magnet':   return makePwIcon('#ff8a2a', 'U');
    case 'pw_x2':       return makePwIcon('#ffd23a', '×2');
    case 'pw_fire':     return makePwIcon('#ff5a1e', '♦');
  }
}
async function loadAssets() {
  try { await document.fonts.load('80px Lobster'); } catch (e) {}
  // assets/manifest.json (пишет tools/build_assets.py) задаёт число кадров для реальных PNG
  // manifest.js подключён в index.html (работает и через file://); json — запасной вариант
  let ext = window.ASSET_MANIFEST || {};
  if (!window.ASSET_MANIFEST) { try { ext = await (await fetch('assets/manifest.json')).json(); } catch (e) {} }
  await Promise.all(Object.keys(MANIFEST).map(key => new Promise(res => {
    const im = new Image();
    im.onload = () => {
      IMG[key] = im; const m = MANIFEST[key];
      if (ext[key]) m.frames = ext[key].frames;
      m.w = im.width / m.frames; m.h = im.height; // рисуем 1:1
      res();
    };
    im.onerror = () => { IMG[key] = fallback(key); res(); };
    im.src = `assets/${key}.png`;
  })));
  await loadSkins(ext);
  await loadTiles(ext);
}
// рисует кадр frame спрайта key в логическом размере из манифеста
function spr(key, frame, x, y, flip, w, h) {
  const im = IMG[key], m = MANIFEST[key];
  const fw = im.width / m.frames, fh = im.height;
  w = w || m.w; h = h || m.h;
  frame = ((frame | 0) % m.frames + m.frames) % m.frames;
  if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, frame * fw, 0, fw, fh, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(im, frame * fw, 0, fw, fh, x, y, w, h);
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// мягкое свечение под кристаллом, нарисованное один раз (shadowBlur каждый кадр слишком дорог для мобильных)
const GLOW = (() => {
  const c = document.createElement('canvas'); c.width = 52; c.height = 58; const g = c.getContext('2d');
  const gr = g.createRadialGradient(26, 29, 4, 26, 29, 28); gr.addColorStop(0, 'rgba(255,60,60,0.55)'); gr.addColorStop(1, 'rgba(255,60,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 52, 58); return c;
})();

// ───────────────────────── ЗВУК ─────────────────────────
let AC = null;
const VOL = {
  music: Math.min(1, Math.max(0, +(localStorage.getItem('hellka_vol_music') ?? 0.5))),
  sfx:   Math.min(1, Math.max(0, +(localStorage.getItem('hellka_vol_sfx') ?? 0.7))),
};
function setVol(key, v) {
  VOL[key] = Math.min(1, Math.max(0, v)); localStorage.setItem('hellka_vol_' + key, VOL[key]);
  if (key === 'music') MUSIC.apply();
}
// любой жест пользователя снимает блокировку автозапуска аудио
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (AC && AC.state === 'suspended') AC.resume().catch(() => {}); });
function beep(f0, f1, dur, type = 'square', vol = 0.08) {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(f1, AC.currentTime + dur);
    vol = Math.max(0.0005, vol * VOL.sfx / 0.7);
    g.gain.setValueAtTime(vol, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
  } catch (e) {}
}
// ── эффекты: assets/sfx/*.wav (tools/make_sfx.py); если файла нет — синтезируем бип ──
const BEEPS = {
  jump: () => beep(300, 700, 0.12), djump: () => beep(500, 900, 0.12),
  coin: () => beep(900, 1400, 0.08, 'triangle', 0.1), crystal: () => beep(1200, 1900, 0.15, 'sine', 0.12),
  hurt: () => beep(200, 60, 0.3, 'sawtooth', 0.12), stomp: () => beep(400, 150, 0.12),
  dead: () => beep(300, 40, 0.8, 'sawtooth', 0.15), confirm: () => beep(600, 1000, 0.1),
};
const SFX_EL = {};
for (const name of Object.keys(BEEPS)) {
  const a = new Audio(`assets/sfx/${name}.wav`); a.preload = 'auto';
  a.addEventListener('canplaythrough', () => { SFX_EL[name] = a; }, { once: true });
}
let sfxMuted = false;
const SFX = {};
for (const name of Object.keys(BEEPS)) SFX[name] = () => {
  if (sfxMuted) return;
  const a = SFX_EL[name];
  if (VOL.sfx <= 0) return;
  if (a) { const c = a.cloneNode(); c.volume = VOL.sfx; c.play().catch(() => {}); } else BEEPS[name]();
};

// ── музыка: assets/music.* (база) и assets/music_fast.* (разгон), см. assets/SOUNDTRACK.md ──
// Через http: WebAudio с бесшовной петлёй. Через file:// fetch запрещён → <audio loop> (маленький зазор на стыке).
const MUSIC = {
  get vol() { return VOL.music; }, muted: false, mode: null, tr: {}, level: 0, playing: false, pending: false, status: 'музыка: загрузка…',
  async init() {
    const names = { base: 'music', fast: 'music_fast' };
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      for (const [k, n] of Object.entries(names)) {
        const r = await fetch(`assets/${n}.ogg`); if (!r.ok) throw new Error(n);
        this.tr[k] = { buf: await AC.decodeAudioData(await r.arrayBuffer()) };
      }
      this.mode = 'wa'; this.status = 'музыка: WebAudio (бесшовная петля)';
    } catch (e) {
      this.tr = {};
      for (const [k, n] of Object.entries(names)) { const a = new Audio(`assets/${n}.mp3`); a.loop = true; a.volume = 0; a.preload = 'auto'; this.tr[k] = { el: a }; }
      this.mode = 'html'; this.status = 'музыка: HTML audio (' + (location.protocol === 'file:' ? 'file://' : String(e && e.message || e).slice(0, 40)) + ')';
    }
    if (this.pending) { this.pending = false; this.start(); }
  },
  apply() { this.set('base', 1 - this.level); this.set('fast', this.level); },
  start() {
    if (this.playing) return;
    if (!this.mode) { this.pending = true; return; } // файлы ещё грузятся — запустим, как только будут готовы
    this.playing = true; this.level = 0;
    if (this.mode === 'wa') {
      AC.resume().catch(() => {});
      for (const t of Object.values(this.tr)) {
        t.gain = AC.createGain(); t.gain.gain.value = 0; t.gain.connect(AC.destination);
        t.src = AC.createBufferSource(); t.src.buffer = t.buf; t.src.loop = true; t.src.connect(t.gain); t.src.start();
      }
    } else for (const t of Object.values(this.tr)) { t.el.currentTime = 0; t.el.play().catch(() => {}); }
  },
  set(k, v) {
    const t = this.tr[k]; if (!t) return; v = this.muted ? 0 : v * this.vol;
    if (this.mode === 'wa') { if (t.gain) t.gain.gain.setTargetAtTime(v, AC.currentTime, 0.05); }
    else if (t.el) t.el.volume = v;
  },
  // level 0..1 — доля «быстрого» слоя; вызывается каждый кадр из update
  update(target, dt) {
    if (!this.playing) return;
    this.level += (target - this.level) * Math.min(1, dt * 1.2);
    this.set('base', 1 - this.level); this.set('fast', this.level);
  },
  pause() { if (!this.playing) return; if (this.mode === 'wa') AC.suspend(); else for (const t of Object.values(this.tr)) t.el.pause(); },
  resume() { if (!this.playing) return; if (this.mode === 'wa') AC.resume(); else for (const t of Object.values(this.tr)) t.el.play().catch(() => {}); },
  stop() {
    this.pending = false;
    if (!this.playing) return; this.playing = false;
    if (this.mode === 'wa') for (const t of Object.values(this.tr)) { t.gain.gain.setTargetAtTime(0, AC.currentTime, 0.3); t.src.stop(AC.currentTime + 1.5); }
    else for (const t of Object.values(this.tr)) { t.el.pause(); }
  },
  toggleMute() { this.muted = !this.muted; sfxMuted = this.muted; this.apply(); },
};
MUSIC.init();

// ───────────────────────── ВВОД ─────────────────────────
const keys = {};
let jumpPressed = false; // "нажатие" (edge)
addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code)) e.preventDefault();
  if (!keys[e.code] && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) jumpPressed = true;
  keys[e.code] = true;
  if (state === 'ach' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { achFlip(e.code === 'ArrowLeft' ? -1 : 1); return; }
  if (state === 'ach' && ['Escape', 'Enter', 'Space', 'KeyA', 'KeyP'].includes(e.code)) { closeAch(); return; }
  if ((state === 'menu' || state === 'pause') && e.code === 'KeyA') { openAch(state); return; }
  if ((state === 'menu' || state === 'pause') && e.code === 'KeyS') { nextSkin(); return; }
  if ((state === 'menu' || state === 'pause') && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { stepSkin(e.code === 'ArrowLeft' ? -1 : 1); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyM') MUSIC.toggleMute();
  if (e.code === 'Enter' && (state === 'menu' || state === 'over')) startGame();
});
addEventListener('keyup', e => { keys[e.code] = false; });
const touchEl = document.getElementById('touch');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) touchEl.classList.add('on');
const tb = { left: false, right: false };
function bindBtn(id, on, off) {
  const el = document.getElementById(id);
  const down = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) {} el.classList.add('down'); on(); };
  const up = e => { e.preventDefault(); el.classList.remove('down'); off(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', e => e.preventDefault()); // долгое нажатие не должно открывать меню
}
bindBtn('bl', () => tb.left = true, () => tb.left = false);
bindBtn('br', () => tb.right = true, () => tb.right = false);
bindBtn('bj', () => { jumpPressed = true; keys.__tj = true; }, () => keys.__tj = false);
// ползунки громкости: рисуются в меню и в паузе, тянутся мышью/пальцем
const SLIDERS = [{ key: 'music', label: 'Музыка' }, { key: 'sfx', label: 'Эффекты' }];
const SL = { x: W / 2 - 103, w: 260, h: 12, gap: 40 }; // трек смещён так, чтобы подпись+трек+проценты были по центру
let sliderY = 0, dragSlider = -1;
function sliderAt(p) {
  if (!(state === 'menu' || state === 'pause')) return -1;
  for (let i = 0; i < SLIDERS.length; i++) {
    const y = sliderY + i * SL.gap;
    if (p.x >= SL.x - 14 && p.x <= SL.x + SL.w + 14 && p.y >= y - 14 && p.y <= y + SL.h + 14) return i;
  }
  return -1;
}
function sliderSet(i, p) { setVol(SLIDERS[i].key, (p.x - SL.x) / SL.w); }
function drawSliders(y0) {
  sliderY = y0;
  ctx.font = 'bold 18px monospace'; ctx.textAlign = 'right';
  SLIDERS.forEach((sl, i) => {
    const y = y0 + i * SL.gap, v = VOL[sl.key];
    ctx.fillStyle = '#f0d0d0'; ctx.fillText(sl.label, SL.x - 22, y + SL.h - 1);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(SL.x, y, SL.w, SL.h);
    ctx.fillStyle = v > 0 ? '#d8322a' : '#555'; ctx.fillRect(SL.x, y, SL.w * v, SL.h);
    ctx.strokeStyle = '#8b6a6e'; ctx.lineWidth = 2; ctx.strokeRect(SL.x + 1, y + 1, SL.w - 2, SL.h - 2);
    ctx.fillStyle = '#ffe0d0'; ctx.fillRect(SL.x + SL.w * v - 5, y - 5, 10, SL.h + 10);
    ctx.fillStyle = '#c0a0a8'; ctx.textAlign = 'left'; ctx.font = '16px monospace';
    ctx.fillText(Math.round(v * 100) + '%', SL.x + SL.w + 14, y + SL.h - 1);
    ctx.font = 'bold 18px monospace'; ctx.textAlign = 'right';
  });
}
cv.addEventListener('pointerdown', e => {
  const p = toGame(e);
  const si = sliderAt(p);
  if (si >= 0) { dragSlider = si; sliderSet(si, p); cv.setPointerCapture(e.pointerId); if (SLIDERS[si].key === 'sfx') SFX.coin(); return; }
  if (state === 'ach') { if (inBtn(p, ACH_PREV)) { achFlip(-1); return; } if (inBtn(p, ACH_NEXT)) { achFlip(1); return; } closeAch(); return; }
  if (state === 'menu' && inBtn(p, ACH_BTN)) { openAch('menu'); return; }
  if ((state === 'menu' || state === 'pause') && inBtn(p, SKIN_L)) { stepSkin(-1); return; }
  if ((state === 'menu' || state === 'pause') && inBtn(p, SKIN_R)) { stepSkin(1); return; }
  if (state === 'menu' && inBtn(p, AUTHOR_BTN)) { window.open(AUTHOR.url, '_blank', 'noopener'); return; }
  if (state === 'menu' && inBtn(p, TWITCH_BTN)) { if (TWITCH.live) unlockAch(ACH.find(a => a.id === 'visit')); window.open(TWITCH.url, '_blank', 'noopener'); return; }
  if (state === 'pause' && inBtn(p, ACH_BTN_PAUSE)) { openAch('pause'); return; }
  if (state === 'menu' || state === 'over') { startGame(); return; }
  if (p.x > W - 70 && p.y < 70) { togglePause(); return; }
  if (state === 'pause') { togglePause(); return; }
  if (!isTouch) jumpPressed = true;
});
cv.addEventListener('pointermove', e => {
  if (dragSlider >= 0) sliderSet(dragSlider, toGame(e));
  const gp = toGame(e); authorHover = state === 'menu' && inBtn(gp, AUTHOR_BTN); twitchHover = state === 'menu' && inBtn(gp, TWITCH_BTN);
  cv.style.cursor = (authorHover || twitchHover) ? 'pointer' : '';
});
cv.addEventListener('pointerup', e => { if (dragSlider >= 0 && SLIDERS[dragSlider].key === 'sfx') SFX.coin(); dragSlider = -1; });
cv.addEventListener('pointercancel', () => { dragSlider = -1; });
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
const inLeft  = () => keys.ArrowLeft  || keys.KeyA || tb.left;
const inRight = () => keys.ArrowRight || keys.KeyD || tb.right;
const inJumpHeld = () => keys.Space || keys.ArrowUp || keys.KeyW || keys.__tj;

// Ориентация: не блокируем в манифесте (WebAPK с принудительным landscape не запускается на части прошивок),
// а просим у системы после жеста пользователя. В браузерной вкладке запрос обычно отклоняется — это нормально.
function lockLandscape() {
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
}
if (matchMedia('(display-mode: standalone)').matches) addEventListener('pointerdown', lockLandscape, { once: true });
function resize() {
  const vw = (visualViewport && visualViewport.width) || innerWidth || document.documentElement.clientWidth || W;
  const vh = (visualViewport && visualViewport.height) || innerHeight || document.documentElement.clientHeight || H;
  const s = Math.max(0.1, Math.min(vw / W, vh / H));
  cv.style.width = (W * s | 0) + 'px'; cv.style.height = (H * s | 0) + 'px';
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 150));
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
resize(); setTimeout(resize, 300); // в standalone-окне на Android размеры иногда приходят с задержкой

// ───────────────────────── ИГРА ─────────────────────────
const GRAVITY = 1900, JUMP_V = 730, MOVE = 190;
// отзывчивость прыжка: койот-тайм (сек после схода с края, когда прыжок ещё «с земли») и буфер нажатия
// (сек до приземления, в течение которых нажатие запоминается). Откат: поставить 0 и 0.
const COYOTE = 0.10, JUMP_BUFFER = 0.12;
const LAVA_Y = 500;               // верх лавы
const LEVELS = [432, 336, 240];   // высоты платформ (верх)
let state = 'menu';               // menu | play | pause | over | ach
let best = +localStorage.getItem('hellka_best') || 0;
let G;                            // текущая сессия

// ───────────────────────── ДОСТИЖЕНИЯ ─────────────────────────
// run — статистика текущего забега (G), tot — суммарная по всем забегам, end — забег завершён
const ACH = [
  { id: 'first_run',    t: 'Первый забег',   d: 'Завершить первый забег',              f: (r, tot, end) => end },
  { id: 'score_500',    t: 'Пятьсот',        d: '500 очков за один забег',             f: r => r.score >= 500 },
  { id: 'score_1000',   t: 'Тысяча',         d: '1000 очков за один забег',            f: r => r.score >= 1000 },
  { id: 'score_2500',   t: 'Легенда ада',    d: '2500 очков за один забег',            f: r => r.score >= 2500 },
  { id: 'crystals_50',  t: 'Коллекционер',   d: '50 кристаллов за один забег',         f: r => r.crystals >= 50 },
  { id: 'coins_50',     t: 'Сорока',         d: '50 монет за один забег',              f: r => r.coins >= 50 },
  { id: 'stomp_10',     t: 'Бесогон',        d: 'Растоптать 10 бесов за забег',   f: r => r.stomps >= 10 },
  { id: 'speed_2',      t: 'Разгон',         d: 'Разогнаться до 2.0x',                 f: r => r.speed >= 400 },
  { id: 'speed_max',    t: 'Предел',         d: 'Максимальная скорость 2.8x',  f: r => r.speed >= 559 },
  { id: 'survive_60',   t: 'Минута в аду',   d: 'Продержаться 60 секунд',              f: r => r.t >= 60 },
  { id: 'no_hit_500',   t: 'Без царапины',   d: '500 очков, не получив урона',         f: r => r.score >= 500 && r.hits === 0 },
  { id: 'deaths_10',    t: 'Упорство',       d: 'Погибнуть 10 раз и вернуться',      f: (r, tot) => tot.deaths >= 10 },
  { id: 'score_666',    t: 'Княжулечка Тьмулички', d: 'Закончить забег ровно с 666 очками', f: (r, tot, end) => end && Math.floor(r.score) === 666 },
  { id: 'score_6666',   t: 'Княжка Тьмы',    d: '6666 очков за один забег',          f: r => r.score >= 6666 },
  { id: 'crystals_666', t: 'Три шестёрки',   d: '666 кристаллов за всё время',       f: (r, tot) => tot.crystals + r.crystals >= 666 },
  { id: 'last_heart_60',t: 'Не сегодня',     d: '60 секунд на последнем сердце',     f: r => r.p.hp === 1 && r.hp1T >= 0 && r.t - r.hp1T >= 60 },
  // скрытые: условия и иконки не показываются, пока не открыты
  { id: 'ghost',        t: 'Призрак',        d: '2000 очков без единого урона',      hidden: true, f: r => r.score >= 2000 && r.hits === 0 },
  { id: 'pacifist',     t: 'Пацифистка',     d: '90 секунд, не тронув ни беса',      hidden: true, f: r => r.t >= 90 && r.stomps === 0 },
  { id: 'perfectionist',t: 'Перфекционистка',d: 'Минута без пропущенных кристаллов', hidden: true, f: r => r.t >= 60 && r.missedCrystals === 0 },
  { id: 'phoenix',      t: 'Феникс',         d: '1000 очков на последнем сердце',    hidden: true, f: r => r.p.hp === 1 && r.hp1Score >= 0 && r.score - r.hp1Score >= 1000 },
  { id: 'daredevil',    t: 'Сорвиголова',    d: '25 кристаллов над пропастью',       hidden: true, f: r => r.gapCrystals >= 25 },
  { id: 'marathon',     t: 'Марафон',        d: '3 минуты в одном забеге',           hidden: true, f: r => r.t >= 180 },
  { id: 'midnight',     t: 'Полуночница',    d: 'Забег между полуночью и 4 утра',    hidden: true, f: (r, tot, end) => end && r.t >= 30 && new Date().getHours() < 4 },
  { id: 'visit',        t: 'Заглянуть в гости', d: 'Зайти на стрим, пока он идёт',   hidden: true, f: () => false }, // открывается кликом по бейджу в эфире
  { id: 'lava_66',      t: 'Купание',        d: '66 раз искупаться в лаве',          hidden: true, f: (r, tot) => tot.lavaDeaths >= 66 },
];
const HIDDEN = { id: 'hidden', t: '???', d: 'Скрытое достижение' }; // заглушка для закрытых скрытых
const ACH_IMG = {};
for (const a of [...ACH, HIDDEN]) { const im = new Image(); im.onload = () => { ACH_IMG[a.id] = im; }; im.src = `assets/ach/${a.id}.png`; }
function loadJSON(k, def) { try { return Object.assign(def, JSON.parse(localStorage.getItem(k) || '{}')); } catch (e) { return def; } }
const unlocked = loadJSON('hellka_ach', {});                       // id → дата
const STATS = loadJSON('hellka_stats', { runs: 0, deaths: 0, crystals: 0, coins: 0, stomps: 0, dist: 0, lavaDeaths: 0 });
const toasts = [];                                                  // всплывашки: {a, t}
let newAch = 0;                                                     // открыто за текущий забег
function unlockAch(a) {
  if (!a || unlocked[a.id]) return;
  unlocked[a.id] = Date.now(); newAch++;
  localStorage.setItem('hellka_ach', JSON.stringify(unlocked));
  toasts.push({ a, t: 0 }); SFX.crystal();
}
function checkAch(end) {
  if (!G) return;
  for (const a of ACH) {
    if (unlocked[a.id]) continue;
    let ok = false; try { ok = a.f(G, STATS, end); } catch (e) {}
    if (ok) unlockAch(a);
  }
}
function saveStats() { localStorage.setItem('hellka_stats', JSON.stringify(STATS)); }
function drawAchIcon(a, x, y, size, dim) {
  const im = ACH_IMG[a.id];
  ctx.save(); if (dim) ctx.globalAlpha = 0.35;
  if (im) ctx.drawImage(im, x, y, size, size);
  else { // заглушка: тёмная плашка с первой буквой
    ctx.fillStyle = '#3a1520'; ctx.fillRect(x, y, size, size); ctx.strokeStyle = '#8b6a6e'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = '#ff6a6a'; ctx.font = `bold ${size * 0.55 | 0}px monospace`; ctx.textAlign = 'center'; ctx.fillText(a.id === 'hidden' ? '?' : a.t[0], x + size / 2, y + size * 0.7);
  }
  ctx.restore();
}
function drawToasts(dt) {
  for (const tt of toasts) tt.t += dt;
  while (toasts.length && toasts[0].t > 3.2) toasts.shift();
  const tt = toasts[0]; if (!tt) return;
  const k = Math.min(1, tt.t * 4, (3.2 - tt.t) * 3); // въезд/выезд
  const base = isTouch ? H - 150 : H - 72; // на тач-экранах выше кнопки прыжка
  const y = base + (1 - k) * 90, x = W - 400;
  panel(x, y, 380, 58); drawAchIcon(tt.a, x + 8, y + 8, 42);
  ctx.textAlign = 'left'; ctx.font = '13px monospace'; ctx.fillStyle = '#ffb0a8'; ctx.fillText('ДОСТИЖЕНИЕ', x + 62, y + 22);
  ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#ffe680'; ctx.fillText(tt.a.t, x + 62, y + 46);
}
function drawAchScreen() {
  ctx.fillStyle = 'rgba(8,0,4,0.82)'; ctx.fillRect(0, 0, W, H);
  const n = Object.keys(unlocked).filter(id => ACH.some(a => a.id === id)).length;
  panel(30, 22, W - 60, H - 44);
  centerText(`ДОСТИЖЕНИЯ  ${n} / ${ACH.length}`, 62, 28, '#ff4a4a');
  const cols = 3, colW = (W - 100) / cols, rowH = 62, per = ACH_PER_PAGE;
  const pages = Math.ceil(ACH.length / per); achPage = Math.max(0, Math.min(pages - 1, achPage));
  const list = ACH.slice(achPage * per, achPage * per + per);
  list.forEach((a, i) => {
    // неполный последний ряд центрируем (одна ячейка — в среднюю колонку)
    const row = Math.floor(i / cols), inRow = Math.min(cols, list.length - row * cols), shift = (cols - inRow) * colW / 2;
    const x = 50 + shift + (i % cols) * colW, y = 84 + row * rowH, got = !!unlocked[a.id];
    const show = got || !a.hidden ? a : HIDDEN; // скрытое и не открытое — маскируем
    drawAchIcon(show, x, y, 42, !got);
    ctx.textAlign = 'left'; ctx.font = 'bold 15px monospace'; ctx.fillStyle = got ? '#ffe680' : (a.hidden ? '#6a5a60' : '#8a7a80'); ctx.fillText(show.t, x + 52, y + 16);
    ctx.font = '12px monospace'; ctx.fillStyle = got ? '#f0d0d0' : '#6a5a60'; ctx.fillText(show.d, x + 52, y + 33);
    if (got) { ctx.fillStyle = '#c0a0a8'; ctx.font = '11px monospace'; ctx.fillText(new Date(unlocked[a.id]).toLocaleDateString('ru-RU'), x + 52, y + 48); }
  });
  // переключение страниц
  ctx.textAlign = 'center'; ctx.font = 'bold 22px monospace';
  ctx.fillStyle = achPage > 0 ? '#ffe680' : '#5a4a52'; ctx.fillText('◀', ACH_PREV.x + ACH_PREV.w / 2, ACH_PREV.y + 24);
  ctx.fillStyle = achPage < pages - 1 ? '#ffe680' : '#5a4a52'; ctx.fillText('▶', ACH_NEXT.x + ACH_NEXT.w / 2, ACH_NEXT.y + 24);
  centerText(`${achPage + 1} / ${pages}`, H - 30, 16, '#f0d0d0');
  ctx.textAlign = 'right'; ctx.font = '13px monospace'; ctx.fillStyle = '#bbb'; ctx.fillText('ESC / тап — назад', W - 44, H - 30);
}
const ACH_PER_PAGE = 18; let achPage = 0;
const ACH_PREV = { x: W / 2 - 110, y: H - 52, w: 50, h: 32 }, ACH_NEXT = { x: W / 2 + 60, y: H - 52, w: 50, h: 32 };
function achFlip(d) { const pages = Math.ceil(ACH.length / ACH_PER_PAGE); const n = achPage + d; if (n >= 0 && n < pages) { achPage = n; SFX.coin(); } }
const ACH_BTN = { x: 20, y: H - 58, w: 250, h: 40 };            // в меню
const ACH_BTN_PAUSE = { x: W / 2 - 125, y: 296, w: 250, h: 38 };  // в паузе
let achFrom = 'menu';                                             // куда возвращаться с экрана достижений
function openAch(from) { achFrom = from; state = 'ach'; SFX.confirm(); }
function closeAch() { state = achFrom; jumpPressed = false; }
function drawAchButton(b) {
  const n = Object.keys(unlocked).filter(id => ACH.some(a => a.id === id)).length;
  panel(b.x, b.y, b.w, b.h);
  ctx.textAlign = 'center'; ctx.font = 'bold 18px monospace'; ctx.fillStyle = '#ffe680';
  ctx.fillText(`★ Достижения  ${n}/${ACH.length}`, b.x + b.w / 2, b.y + 27);
}
function inBtn(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

// ───────────────────────── УСИЛЕНИЯ ─────────────────────────
const POWERUPS = {
  heart:  { name: 'СЕРДЦЕ',  col: '#ff3b5c', weight: 20, dur: 0 },
  shield: { name: 'ЩИТ',     col: '#4fa3ff', weight: 25, dur: 0 },   // держится до удара
  magnet: { name: 'МАГНИТ',  col: '#ff8a2a', weight: 25, dur: 8 },
  x2:     { name: 'ОЧКИ ×2', col: '#ffd23a', weight: 20, dur: 10 },
  fire:   { name: 'ПЛАМЯ',   col: '#ff5a1e', weight: 10, dur: 6 },
};
const PW_CHANCE = 0.10, PW_FROM_T = 8; // шанс на платформу и с какой секунды появляются
function pickPowerup(r) {
  const tot = Object.values(POWERUPS).reduce((a, p) => a + p.weight, 0); let v = r() * tot;
  for (const [k, p] of Object.entries(POWERUPS)) { v -= p.weight; if (v <= 0) return k; }
  return 'heart';
}
function addScore(n) { G.score += n * (G.pw.x2 > 0 ? 2 : 1); return n * (G.pw.x2 > 0 ? 2 : 1); }
function applyPowerup(k, it) {
  const p = G.p, pw = POWERUPS[k];
  if (k === 'heart') { if (p.hp < 5) p.hp++; }
  else if (k === 'shield') G.pw.shield = true;
  else G.pw[k] = pw.dur;
  SFX.crystal(); burst(it.x + 15, it.y + 15, pw.col, 14, 180); addText(it.x - 10, it.y - 12, pw.name, pw.col); G.hudFlash = 0;
}

// ───────────────────────── НАБОРЫ ТЕРРЕЙНА ─────────────────────────
// 'tile' — базовая кладка; остальные из assets/tiles/*.png. Порядок = порядок появления по ходу забега.
const TILESETS = ['tile'];
const TILE_UNLOCK_T = 25; // каждые N секунд забега становится доступен следующий набор
async function loadTiles(ext) {
  const ms = (ext && ext.tiles) || {};
  const order = ['ember', 'gothic', 'bone', 'obsidian'].filter(n => ms[n]).concat(Object.keys(ms).filter(n => !['ember', 'gothic', 'bone', 'obsidian'].includes(n)));
  await Promise.all(order.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { const key = 'tile_' + n; IMG[key] = im; MANIFEST[key] = { frames: ms[n].frames, w: im.width / ms[n].frames, h: im.height }; TILESETS.push(key); res(); };
    im.onerror = () => res(); im.src = `assets/tiles/${n}.png`;
  })));
}
// выбор набора для новой платформы: зоны по 2–5 платформ, доступные наборы растут со временем
function pickTileset(r) {
  const avail = TILESETS.slice(0, 1 + Math.min(TILESETS.length - 1, Math.floor(G.t / TILE_UNLOCK_T)));
  if (G.zoneLeft > 0 && avail.includes(G.zoneTile)) { G.zoneLeft--; return G.zoneTile; }
  G.zoneTile = avail[Math.floor(r() * avail.length)]; G.zoneLeft = 1 + Math.floor(r() * 4);
  return G.zoneTile;
}

// ───────────────────────── СКИНЫ ─────────────────────────
const SKINS = {
  default: { name: 'Хеллка',      dir: 'assets',            unlock: null },
  dark:    { name: 'Княжна Тьмы', dir: 'assets/skins/dark', unlock: 'score_2500' }, // открывается за «Легенду ада»
};
const SKIN_KEYS = ['player_run', 'player_jump', 'player_dead', 'player_hurt', 'portrait'];
const SKIN_IMG = {};
let skin = localStorage.getItem('hellka_skin') || 'default';
function skinUnlocked(id) { const s = SKINS[id]; return !!s && (!s.unlock || !!unlocked[s.unlock]); }
function skinList() { return Object.keys(SKINS).filter(id => SKIN_IMG[id]); }
async function loadSkins(ext) {
  SKIN_IMG.default = {};
  for (const k of SKIN_KEYS) SKIN_IMG.default[k] = { im: IMG[k], frames: MANIFEST[k].frames, w: MANIFEST[k].w, h: MANIFEST[k].h };
  const ms = (ext && ext.skins) || {};
  await Promise.all(Object.keys(SKINS).filter(id => id !== 'default' && ms[id]).map(async id => {
    const m = ms[id], store = {};
    await Promise.all(SKIN_KEYS.map(k => new Promise(res => {
      if (!m[k]) return res();
      const im = new Image();
      im.onload = () => { store[k] = { im, frames: m[k].frames, w: im.width / m[k].frames, h: im.height }; res(); };
      im.onerror = () => res(); im.src = `${SKINS[id].dir}/${k}.png`;
    })));
    if (SKIN_KEYS.every(k => store[k])) SKIN_IMG[id] = store;
  }));
  applySkin(skin);
}
function applySkin(id) {
  if (!SKIN_IMG[id] || !skinUnlocked(id)) id = 'default';
  skin = id; localStorage.setItem('hellka_skin', id);
  for (const k of SKIN_KEYS) { const s = SKIN_IMG[id][k]; IMG[k] = s.im; MANIFEST[k].frames = s.frames; MANIFEST[k].w = s.w; MANIFEST[k].h = s.h; }
}
function stepSkin(d) {
  const ids = skinList(); if (ids.length < 2) return;
  const n = ids[(ids.indexOf(skin) + d + ids.length) % ids.length];
  if (skinUnlocked(n)) { applySkin(n); SFX.confirm(); } else SFX.hurt();
}
function nextSkin() { stepSkin(1); }
// стрелки по бокам от бегущего спрайта (меню и пауза); хит-зоны обновляются при каждой отрисовке
const SKIN_L = { x: 0, y: 0, w: 44, h: 60 }, SKIN_R = { x: 0, y: 0, w: 44, h: 60 };
function drawSkinPicker(cx, feetY, t) {
  const m = MANIFEST.player_run;
  spr('player_run', t * 10, cx - m.w / 2, feetY - m.h);
  const ids = skinList(); if (ids.length < 2) return;
  const prev = ids[(ids.indexOf(skin) - 1 + ids.length) % ids.length], next = ids[(ids.indexOf(skin) + 1) % ids.length];
  SKIN_L.x = cx - 96; SKIN_L.y = feetY - 66; SKIN_R.x = cx + 52; SKIN_R.y = feetY - 66;
  ctx.textAlign = 'center'; ctx.font = 'bold 30px monospace';
  const bob = Math.sin(t * 4) * 2;
  ctx.fillStyle = skinUnlocked(prev) ? '#ffe680' : '#5a4a52'; ctx.fillText('◀', SKIN_L.x + 22 - bob, SKIN_L.y + 42);
  ctx.fillStyle = skinUnlocked(next) ? '#ffe680' : '#5a4a52'; ctx.fillText('▶', SKIN_R.x + 22 + bob, SKIN_R.y + 42);
  ctx.font = 'bold 15px monospace'; ctx.fillStyle = '#ffe680'; ctx.fillText(SKINS[skin].name, cx, feetY + 18);
  if (!skinUnlocked(next)) { const req = ACH.find(a => a.id === SKINS[next].unlock); ctx.font = '11px monospace'; ctx.fillStyle = '#8a7a80'; ctx.fillText(SKINS[next].name + ': ' + (req ? req.t : '?'), cx, feetY + 33); }
}
// ── автор: неброская подпись, ссылка спрятана в ник (без подсветки) ──
// ── бейдж стримера: статус эфира через decapi.me (публичный прокси к Twitch, без ключей) ──
const TWITCH = { login: 'dear_hellgirl', url: 'https://www.twitch.tv/dear_hellgirl', live: null, uptime: '', title: '', t: 0, next: 0 };
const TWITCH_BTN = { x: 14, y: 14, w: 198, h: 62 };
let twitchHover = false;
async function pollTwitch() {
  if (!navigator.onLine) return;
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 6000);
    const up = (await (await fetch(`https://decapi.me/twitch/uptime/${TWITCH.login}`, { signal: ctrl.signal, cache: 'no-store' })).text()).trim();
    clearTimeout(tm);
    if (/offline/i.test(up)) { TWITCH.live = false; TWITCH.uptime = ''; TWITCH.title = ''; }
    else if (/\d/.test(up)) {
      TWITCH.live = true;
      const h = /(\d+)\s*hour/.exec(up), m = /(\d+)\s*minute/.exec(up);
      TWITCH.uptime = (h ? h[1] + ' ч ' : '') + (m ? m[1] + ' мин' : '');
      try { TWITCH.title = (await (await fetch(`https://decapi.me/twitch/title/${TWITCH.login}`, { cache: 'no-store' })).text()).trim().slice(0, 40); } catch (e) {}
    }
  } catch (e) { /* сеть недоступна — статус остаётся неизвестным */ }
}
function drawTwitch(t, dt) {
  TWITCH.t += dt;
  if (TWITCH.t >= TWITCH.next) { TWITCH.next = TWITCH.t + 60; pollTwitch(); } // раз в минуту, пока открыто меню
  const b = TWITCH_BTN;
  ctx.save();
  ctx.fillStyle = twitchHover ? 'rgba(60,20,90,0.85)' : 'rgba(30,10,45,0.75)'; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = TWITCH.live ? '#ff3b3b' : '#7a4fb8'; ctx.lineWidth = 3; ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
  spr('twitch', 0, b.x + 10, b.y + 11, false, 40, 40);
  ctx.textAlign = 'left'; ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#f4ecff'; ctx.fillText(TWITCH.login, b.x + 58, b.y + 26);
  ctx.font = '12px monospace';
  if (TWITCH.live) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(255,60,60,${pulse})`; ctx.beginPath(); ctx.arc(b.x + 66, b.y + 44, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff8a8a'; ctx.fillText('В ЭФИРЕ' + (TWITCH.uptime ? '  ' + TWITCH.uptime : ''), b.x + 76, b.y + 48);
  } else if (TWITCH.live === false) {
    ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.arc(b.x + 66, b.y + 44, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#b0a0c0'; ctx.fillText('не в эфире', b.x + 76, b.y + 48);
  } else { ctx.fillStyle = '#8a7a9a'; ctx.fillText('twitch.tv', b.x + 62, b.y + 48); }
  if (TWITCH.live && TWITCH.title) { // название стрима под бейджем
    ctx.fillStyle = 'rgba(30,10,45,0.75)'; ctx.fillRect(b.x, b.y + b.h + 4, b.w, 22);
    ctx.fillStyle = '#e0d0f0'; ctx.font = '11px monospace'; ctx.fillText(TWITCH.title.slice(0, 26) + (TWITCH.title.length > 26 ? '…' : ''), b.x + 8, b.y + b.h + 19);
  }
  ctx.restore();
}
const AUTHOR = { name: 'Nelfias', url: 'https://t.me/nelfias_cosph' };
const AUTHOR_BTN = { x: W - 190, y: H - 76, w: 178, h: 22 }; // над кромкой лавы
let authorHover = false;
function drawAuthor() {
  ctx.textAlign = 'right'; ctx.font = '14px monospace'; ctx.fillStyle = 'rgba(208,176,184,0.75)';
  ctx.fillText('автор: ' + AUTHOR.name, AUTHOR_BTN.x + AUTHOR_BTN.w, AUTHOR_BTN.y + 16);
}

function startGame() {
  G = {
    t: 0, camX: 0, speed: 200, score: 0, crystals: 0, coins: 0, dist: 0, stomps: 0, hits: 0, achT: 0, missedCrystals: 0, gapCrystals: 0, hp1Score: -1, hp1T: -1, lavaDeath: false, zoneTile: 'tile', zoneLeft: 0, pw: { magnet: 0, x2: 0, fire: 0, shield: false },
    plats: [], items: [], enemies: [], parts: [], texts: [],
    genX: 0, lastY: LEVELS[0], rnd: mulberry(Date.now() & 0xffff),
    p: { x: 120, y: 300, w: 30, h: 66, vx: 0, vy: 0, ground: false, jumps: 0, hp: 5, inv: 0, anim: 0, face: 1, dead: false, deadT: 0 },
    shake: 0, hudFlash: 0,
  };
  // стартовая площадка
  addPlat(-200, LEVELS[0], 900); G.genX = 700; G.lastY = LEVELS[0];
  state = 'play'; MUSIC.start(); SFX.confirm(); newAch = 0;
  lockLandscape();
}
function togglePause() {
  if (state === 'play') { state = 'pause'; MUSIC.pause(); }
  else if (state === 'pause') { state = 'play'; MUSIC.resume(); }
}

function addPlat(x, y, w, tile) { const p = { x, y, w, h: 96, spikes: [], tile: tile || 'tile' }; G.plats.push(p); return p; }

// Генерация мира вперёд от камеры
function generate() {
  const r = G.rnd;
  while (G.genX < G.camX + W + 600) {
    const sp = G.speed;
    // зазор: доступен для одиночного прыжка с запасом; дабл-джамп даёт ещё запас
    const air = 2 * JUMP_V / GRAVITY;                 // время полёта при прыжке на той же высоте
    const maxGap = Math.min(sp * air * 0.8, 380);
    const gap = 70 + r() * Math.max(30, maxGap - 70);
    // новая высота: не выше чем на один уровень
    const ci = LEVELS.indexOf(G.lastY);
    let ni = ci + (r() < 0.4 ? 0 : (r() < 0.5 ? -1 : 1));
    ni = Math.max(0, Math.min(LEVELS.length - 1, ni));
    const y = LEVELS[ni];
    const len = 32 * (5 + (r() * (10 + Math.min(8, G.t / 20))) | 0);
    const x = G.genX + gap;
    const p = addPlat(x, y, len, pickTileset(r));
    // шипы: только на длинных, кусок 2 клетки, не у краёв
    if (len >= 32 * 9 && r() < 0.35 + G.t / 300) {
      const sx = x + 32 * (3 + (r() * (len / 32 - 6)) | 0);
      p.spikes.push({ x: sx, w: 64 });
    }
    // предметы
    const kind = r();
    if (kind < 0.45) { // дуга кристаллов над платформой
      const n = 3 + (r() * 3 | 0), cx = x + 40 + r() * Math.max(10, len - 80 - n * 34);
      for (let i = 0; i < n; i++) G.items.push({ t: 'crystal', x: cx + i * 34, y: y - 60 - Math.sin(i / (n - 1) * Math.PI) * 50, w: 24, h: 34, ph: r() * 6 });
    } else if (kind < 0.85) { // ряд монет
      const n = 4 + (r() * 5 | 0), cx = x + 30 + r() * Math.max(10, len - 60 - n * 30);
      for (let i = 0; i < n; i++) G.items.push({ t: 'coin', x: cx + i * 30, y: y - 50 - (r() < 0.3 ? 70 : 0), w: 24, h: 24, ph: i * 0.6 });
    } else { // кристаллы над пропастью (риск/награда)
      for (let i = 0; i < 3; i++) G.items.push({ t: 'crystal', gap: true, x: G.genX + gap * 0.5 - 40 + i * 34, y: y - 130 - i * 4, w: 24, h: 34, ph: i });
    }
    // усиление: редко, парит над платформой
    if (G.t >= PW_FROM_T && r() < PW_CHANCE) G.items.push({ t: 'pw', kind: pickPowerup(r), x: x + 30 + r() * Math.max(10, len - 90), y: y - 100 - r() * 40, w: 30, h: 30, ph: r() * 6 });
    // бесы
    if (len >= 32 * 7 && r() < 0.3 + Math.min(0.5, G.t / 120)) {
      const spk = p.spikes[0];
      let ex = x + 80 + r() * (len - 160);
      if (spk && Math.abs(ex - spk.x - 32) < 90) ex = spk.x > x + len / 2 ? x + 60 : x + len - 100;
      G.enemies.push({ x: ex, y: y - 40, w: 44, h: 40, vx: (r() < 0.5 ? -1 : 1) * (60 + r() * 60), px: x + 10, pw: len - 60, anim: r() * 4, dead: false, deadT: 0 });
    }
    G.genX = x + len;
    G.lastY = y;
  }
  // чистка позади камеры
  const lim = G.camX - 300;
  G.plats = G.plats.filter(p => p.x + p.w > lim);
  for (const i of G.items) if (i.t === 'crystal' && !i.got && i.x + i.w <= lim) G.missedCrystals++;
  G.items = G.items.filter(i => i.x + i.w > lim && !i.got);
  G.enemies = G.enemies.filter(e => e.x + e.w > lim && !(e.dead && e.deadT > 0.6));
}

function addText(x, y, s, col) { G.texts.push({ x, y, s, col, t: 0 }); }
function burst(x, y, col, n = 10, spd = 200) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = spd * (0.3 + Math.random()); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, col, t: 0, life: 0.4 + Math.random() * 0.4 }); }
}
function hurt(p, kx) {
  if (p.inv > 0 || p.dead) return;
  if (G.pw.shield) { // щит: удар поглощён, без потери сердца
    G.pw.shield = false; p.inv = 0.8; p.vy = -300; SFX.stomp(); G.shake = 0.2;
    burst(p.x + p.w / 2, p.y + p.h / 2, '#4fa3ff', 16, 200); addText(p.x - 10, p.y - 14, 'ЩИТ!', '#8fc8ff'); return;
  }
  p.hp--; p.inv = 1.6; p.vy = -420; p.vx = kx; G.shake = 0.35; G.hudFlash = 0.4; G.hits++;
  if (p.hp === 1) { G.hp1Score = G.score; G.hp1T = G.t; } // «Феникс» и «Не сегодня»: с момента последнего сердца
  SFX.hurt(); burst(p.x + p.w / 2, p.y + p.h / 2, '#ff4040', 12);
  if (p.hp <= 0) die();
}
function die() {
  const p = G.p; if (p.dead) return;
  p.dead = true; p.deadT = 0; p.vy = -500; SFX.dead(); G.shake = 0.6; MUSIC.stop();
  if (G.score > best) { best = Math.floor(G.score); localStorage.setItem('hellka_best', best); }
  STATS.runs++; STATS.deaths++; if (G.lavaDeath) STATS.lavaDeaths++; STATS.crystals += G.crystals; STATS.coins += G.coins; STATS.stomps += G.stomps; STATS.dist += Math.floor(G.dist / 10);
  saveStats(); checkAch(true);
}

function update(dt) {
  const g = G, p = g.p;
  g.t += dt;
  // скорость растёт плавно, потолок 560 px/s (стартовая 200)
  g.speed = Math.min(560, 200 + g.t * 2.2 + Math.pow(g.t, 1.35) * 0.5);
  g.camX += g.speed * dt;
  g.dist += g.speed * dt;
  addScore(g.speed * dt * 0.02); // очки за дистанцию
  for (const k of ['magnet', 'x2', 'fire']) if (g.pw[k] > 0) g.pw[k] = Math.max(0, g.pw[k] - dt);
  if (g.shake > 0) g.shake -= dt;
  if (!p.dead) { g.achT += dt; if (g.achT >= 0.25) { g.achT = 0; checkAch(false); } }
  MUSIC.update(Math.max(0, Math.min(1, (g.speed / 200 - 1.5) / 0.6)), dt);
  if (g.hudFlash > 0) g.hudFlash -= dt;

  generate();

  // ── игрок ──
  if (p.dead) {
    p.deadT += dt; p.vy += GRAVITY * dt; p.y += p.vy * dt;
    if (p.deadT > 1.6) state = 'over';
  } else {
    const dir = (inRight() ? 1 : 0) - (inLeft() ? 1 : 0);
    // без ввода Хеллка плавно возвращается к «домашней» позиции на экране (после откидывания ударом)
    const home = 150, drift = dir ? 0 : Math.max(-80, Math.min(120, (home - (p.x - g.camX)) * 1.5));
    if (p.inv < 1.3) p.vx = g.speed + dir * MOVE + drift; // при ударе краткий откат
    if (dir) p.face = dir;
    // койот-тайм: сколько ещё можно считать, что стоим на земле
    p.coyote = p.ground ? COYOTE : Math.max(0, (p.coyote || 0) - dt);
    // буфер: нажатие запоминается и срабатывает при первой возможности
    if (jumpPressed) p.jbuf = JUMP_BUFFER; else p.jbuf = Math.max(0, (p.jbuf || 0) - dt);
    const onGround = p.ground || (p.coyote > 0 && p.jumps === 0);
    if (p.jbuf > 0 && (onGround || p.jumps < 2)) {
      const first = onGround;
      p.vy = first ? -JUMP_V : -JUMP_V * 0.9; p.jumps = first ? 1 : 2; p.ground = false; p.coyote = 0; p.jbuf = 0;
      first ? SFX.jump() : SFX.djump();
      burst(p.x + p.w / 2, p.y + p.h, '#ffb03a', 5, 120);
    }
    if (p.vy < -480 && !inJumpHeld()) p.vy = -480; // отпустили клавишу — прыжок короче (мин. ~60px, макс. ~140px)
    p.vy += GRAVITY * dt; if (p.vy > 1100) p.vy = 1100;
    p.inv = Math.max(0, p.inv - dt);

    // горизонталь + границы экрана
    p.x += p.vx * dt;
    const minX = g.camX + 10, maxX = g.camX + W - 260;
    if (p.x < minX) p.x = minX;
    if (p.x > maxX) p.x = maxX;
    // столкновение с платформами по X (стенка) — только когда ниже верха
    for (const pl of g.plats) {
      if (p.y + p.h > pl.y + 6 && p.y < pl.y + pl.h && p.x + p.w > pl.x && p.x < pl.x + pl.w) {
        // прощение уступа: если ноги чуть ниже верха и летим вверх/зависли — подтягиваем на платформу
        if (p.y + p.h < pl.y + 26 && p.vy <= 60 && p.x + p.w / 2 < pl.x + pl.w / 2) { p.y = pl.y - p.h; p.vy = 0; p.ground = true; p.jumps = 0; continue; }
        if (p.x + p.w / 2 < pl.x + pl.w / 2) p.x = pl.x - p.w; else p.x = pl.x + pl.w;
      }
    }
    // вертикаль
    const py0 = p.y; p.y += p.vy * dt; p.ground = false;
    for (const pl of g.plats) {
      if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2) {
        if (p.vy >= 0 && py0 + p.h <= pl.y + 1 && p.y + p.h >= pl.y) { p.y = pl.y - p.h; p.vy = 0; p.ground = true; p.jumps = 0; }
        else if (p.vy < 0 && py0 >= pl.y + pl.h && p.y < pl.y + pl.h) { p.y = pl.y + pl.h; p.vy = 0; }
      }
    }
    // "раздавлен": упёрлись в стенку и одновременно в левый край экрана
    if (p.x <= minX + 0.5) for (const pl of g.plats) if (p.x + p.w > pl.x + 1 && p.x < pl.x + pl.w && p.y + p.h > pl.y + 8 && p.y < pl.y + pl.h) die();
    // шипы
    for (const pl of g.plats) for (const s of pl.spikes)
      if (p.x + p.w - 6 > s.x && p.x + 6 < s.x + s.w && p.y + p.h > pl.y - 20 && p.y + p.h <= pl.y + 4) hurt(p, g.speed - 250);
    // лава
    if (p.y + p.h > LAVA_Y + 20) { burst(p.x + p.w / 2, LAVA_Y, '#ffb03a', 20, 260); p.hp = 0; G.lavaDeath = true; die(); }
    p.anim += dt * (8 + g.speed / 60);
  }

  // ── враги ──
  for (const e of g.enemies) {
    if (e.dead) { e.deadT += dt; continue; }
    e.x += e.vx * dt; e.anim += dt * 6;
    if (e.x < e.px) { e.x = e.px; e.vx = Math.abs(e.vx); }
    if (e.x + e.w > e.px + e.pw) { e.x = e.px + e.pw - e.w; e.vx = -Math.abs(e.vx); }
    if (!p.dead && p.x + p.w - 6 > e.x && p.x + 6 < e.x + e.w && p.y + p.h > e.y && p.y < e.y + e.h) {
      if (g.pw.fire > 0) { // пламя: бес сгорает от касания
        e.dead = true; g.stomps++; const n = addScore(25); SFX.stomp();
        burst(e.x + e.w / 2, e.y + e.h / 2, '#ff8a1e', 18, 220); addText(e.x, e.y - 10, '+' + n, '#ffb03a');
      } else if (p.vy > 0 && p.y + p.h - p.vy * dt <= e.y + 12) {
        e.dead = true; p.vy = -JUMP_V * 0.7; p.jumps = 1; const n = addScore(25); g.stomps++; SFX.stomp();
        burst(e.x + e.w / 2, e.y + e.h / 2, '#d8322a', 14); addText(e.x, e.y - 10, '+' + n, '#ffb0a8');
      } else hurt(p, g.speed - 280);
    }
  }
  // ── предметы ──
  for (const it of g.items) {
    if (it.got) continue;
    it.ph += dt * 3;
    // магнит: предметы (кроме усилений) летят к Хеллке
    if (g.pw.magnet > 0 && it.t !== 'pw' && !p.dead) {
      const dx = (p.x + p.w / 2) - (it.x + it.w / 2), dy = (p.y + p.h / 2) - (it.y + it.h / 2), d = Math.hypot(dx, dy);
      if (d < 220 && d > 1) { const v = 520 * dt / d; it.x += dx * v; it.y += dy * v; }
    }
    if (!p.dead && p.x + p.w > it.x && p.x < it.x + it.w && p.y + p.h > it.y && p.y < it.y + it.h) {
      it.got = true;
      if (it.t === 'crystal') { g.crystals++; const n = addScore(10); if (it.gap) g.gapCrystals++; SFX.crystal(); burst(it.x + 12, it.y + 17, '#ff5a5a', 8, 140); addText(it.x, it.y - 10, '+' + n, '#ff8a8a'); }
      else if (it.t === 'coin') { g.coins++; const n = addScore(5); SFX.coin(); burst(it.x + 12, it.y + 12, '#ffd23a', 6, 120); addText(it.x, it.y - 10, '+' + n, '#ffe680'); }
      else applyPowerup(it.kind, it);
    }
  }
  // ── частицы / текст ──
  for (const q of g.parts) { q.t += dt; q.vy += 600 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  g.parts = g.parts.filter(q => q.t < q.life);
  for (const t of g.texts) { t.t += dt; t.y -= 40 * dt; }
  g.texts = g.texts.filter(t => t.t < 0.8);
  jumpPressed = false;
}

// ───────────────────────── РЕНДЕР ─────────────────────────
function drawBg(camX, t) {
  ctx.drawImage(IMG.bg_sky, 0, 0, W, H); // статичное небо с луной
  for (const [key, k] of [['bg_far', 0.15], ['bg_mid', 0.4]]) {
    const im = IMG[key], bw = Math.max(W, Math.round(H * im.width / im.height));
    const ox = -(camX * k) % bw;
    ctx.drawImage(im, ox, 0, bw, H); ctx.drawImage(im, ox + bw, 0, bw, H);
  }
  // притемняем фон, чтобы предметы и враги читались на насыщенной картинке
  ctx.fillStyle = 'rgba(15,0,8,0.28)'; ctx.fillRect(0, 0, W, H);
  // свечение лавы снизу
  const gr = ctx.createLinearGradient(0, LAVA_Y - 160, 0, LAVA_Y + 8);
  gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(0.88, 'rgba(255,90,20,0.35)'); gr.addColorStop(1, 'rgba(255,140,40,0.95)');
  ctx.fillStyle = gr; ctx.fillRect(0, LAVA_Y - 160, W, 168);
}
function drawLava(camX, t) {
  const lw = MANIFEST.lava.w, lh = MANIFEST.lava.h; // кадр может быть зеркальной парой (бесшовный повтор)
  const f = (t * 3 | 0) % 2, off = -(camX * 0.9) % lw;
  const bob = Math.sin(t * 4) * 3;
  for (let x = off - lw; x < W + lw; x += lw) spr('lava', f, x, LAVA_Y + bob, false, lw, lh);
  ctx.fillStyle = '#c8300a'; ctx.fillRect(0, LAVA_Y + lh + bob - 1, W, H);
  drawSparks(camX, bob);
}
// ── фоновые искры над лавой: редкая постоянная крошка + всплески раз в пару секунд ──
const SPARKS = []; let sparkPrevCam = null, sparkBurstIn = 1.5, sparkAcc = 0;
function drawSparks(camX, bob) {
  const now = performance.now() / 1000; const dt = Math.min(0.05, now - (drawSparks.last || now)); drawSparks.last = now;
  const scroll = sparkPrevCam === null ? 0 : (camX - sparkPrevCam) * 0.9; sparkPrevCam = camX; // искры едут вместе с лавой
  const spawn = (x, n, power) => { for (let i = 0; i < n; i++) SPARKS.push({ x: x + (Math.random() - 0.5) * 30, y: LAVA_Y + bob + 4, vx: (Math.random() - 0.5) * 60, vy: -(60 + Math.random() * 90) * power, t: 0, life: 0.9 + Math.random() * 1.1, s: Math.random() < 0.35 ? 4 : 3 }); };
  sparkAcc += dt * 7; while (sparkAcc >= 1) { sparkAcc--; spawn(Math.random() * W, 1, 0.8); }        // крошка ~7/с
  sparkBurstIn -= dt; if (sparkBurstIn <= 0) { sparkBurstIn = 1.5 + Math.random() * 3; spawn(Math.random() * W, 6 + Math.random() * 8 | 0, 1.4); }
  for (const q of SPARKS) { q.t += dt; q.x += q.vx * dt - scroll; q.y += q.vy * dt; q.vy += 40 * dt; q.vx *= 0.99; }
  for (let i = SPARKS.length - 1; i >= 0; i--) if (SPARKS[i].t >= SPARKS[i].life || SPARKS[i].x < -10 || SPARKS[i].x > W + 10) SPARKS.splice(i, 1);
  for (const q of SPARKS) {
    const k = q.t / q.life; // жёлтый → оранжевый → тёмно-красный, гаснет
    ctx.fillStyle = k < 0.35 ? '#ffe680' : k < 0.7 ? '#ff8a1e' : '#b8300a'; ctx.globalAlpha = 1 - k * k;
    ctx.fillRect(q.x | 0, q.y | 0, q.s, q.s);
  }
  ctx.globalAlpha = 1;
}
function drawWorld() {
  const g = G, cx = g.camX;
  for (const pl of g.plats) {
    const sx = pl.x - cx; if (sx > W || sx + pl.w < 0) continue;
    const tk = IMG[pl.tile] ? pl.tile : 'tile', T = MANIFEST[tk].w;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, pl.y, pl.w, pl.h); ctx.clip();
    for (let x = 0; x < pl.w; x += T) {
      spr(tk, 0, sx + x, pl.y);
      for (let y = T; y < pl.h; y += T) spr(tk, 1, sx + x, pl.y + y);
    }
    ctx.restore();
    for (const s of pl.spikes) for (let x = s.x; x < s.x + s.w; x += 32) spr('spike', 0, x - cx, pl.y - MANIFEST.spike.h + 2, false, 32, MANIFEST.spike.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx, pl.y + 96, pl.w, 10);
  }
  for (const it of g.items) {
    if (it.got) continue; const sx = it.x - cx; if (sx > W || sx < -40) continue;
    const bob = Math.sin(it.ph) * 4;
    if (it.t === 'crystal') { ctx.drawImage(GLOW, sx - 14, it.y + bob - 12); spr('crystal', 0, sx, it.y + bob); }
    else if (it.t === 'coin') spr('coin', it.ph * 2, sx, it.y + bob);
    else { // усиление: пульсирующее кольцо цвета эффекта
      const pw = POWERUPS[it.kind], k = 1 + 0.12 * Math.sin(it.ph * 2);
      ctx.strokeStyle = pw.col; ctx.lineWidth = 2; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(it.ph * 2); ctx.beginPath(); ctx.arc(sx + 15, it.y + bob + 15, 19 * k, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      spr('pw_' + it.kind, 0, sx, it.y + bob, false, 30, 30);
    }
  }
  for (const e of g.enemies) {
    const sx = e.x - cx; if (sx > W || sx < -60) continue;
    const im = MANIFEST.imp, ix = sx + e.w / 2 - im.w / 2, iy = e.y + e.h - im.h;
    if (e.dead) { ctx.save(); ctx.globalAlpha = 1 - e.deadT / 0.6; spr('imp', 0, ix, iy + e.deadT * 60, e.vx > 0, im.w, im.h * (1 - e.deadT)); ctx.restore(); }
    else spr('imp', e.anim, ix, iy + Math.sin(e.anim * 2) * 2, e.vx > 0);
  }
  // игрок
  const p = g.p;
  if (!p.dead && (g.pw.shield || g.pw.fire > 0)) { // ауры щита и пламени
    const cx0 = p.x - cx + p.w / 2, cy0 = p.y + p.h / 2, tt = g.t * 6;
    ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(tt);
    ctx.strokeStyle = g.pw.fire > 0 ? '#ff6a1e' : '#4fa3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx0, cy0, 44 + 3 * Math.sin(tt), 0, 7); ctx.stroke();
    if (g.pw.fire > 0 && Math.random() < 0.5) g.parts.push({ x: p.x + p.w * Math.random(), y: p.y + p.h * Math.random(), vx: -g.speed * 0.3, vy: -120 - Math.random() * 80, col: '#ff8a1e', t: 0, life: 0.3 + Math.random() * 0.3 });
    ctx.restore();
  }
  if (!(p.inv > 0 && !p.dead && ((p.inv * 12) | 0) % 2)) {
    let key = 'player_run', frame = p.anim;
    if (p.dead) { key = 'player_dead'; frame = Math.min(MANIFEST.player_dead.frames - 1, p.deadT * 10); }
    else if (p.inv > 1.2) { key = 'player_hurt'; frame = 0; }
    else if (!p.ground) {
      key = 'player_jump'; const n = MANIFEST.player_jump.frames;
      const t = Math.max(0, Math.min(1, (p.vy + JUMP_V) / (2 * JUMP_V))); // 0 — взлёт, 1 — падение
      frame = n > 2 ? 1 + Math.round(t * (n - 3)) : 0;
    }
    const m = MANIFEST[key];
    spr(key, frame, p.x - cx + p.w / 2 - m.w / 2, p.y + p.h - m.h + 2, false);
  }
  for (const q of g.parts) { ctx.globalAlpha = 1 - q.t / q.life; ctx.fillStyle = q.col; ctx.fillRect(q.x - cx - 2, q.y - 2, 5, 5); }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 18px monospace'; ctx.textAlign = 'left';
  for (const t of g.texts) { ctx.globalAlpha = 1 - t.t / 0.8; ctx.fillStyle = t.col; ctx.fillText(t.s, t.x - cx, t.y); }
  ctx.globalAlpha = 1;
}
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(20,10,14,0.7)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5a4a52'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}
const SHOW_FPS = /[?&]fps/.test(location.search);
let fpsAcc = 0, fpsN = 0, fpsShown = 0;
function drawFps(dt) {
  fpsAcc += dt; fpsN++; if (fpsAcc >= 0.5) { fpsShown = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  ctx.textAlign = 'left'; ctx.font = 'bold 14px monospace'; ctx.fillStyle = fpsShown < 45 ? '#ff6a6a' : '#8f8'; ctx.fillText(fpsShown + ' fps', 12, H - 12);
}
function drawHud() {
  const g = G;
  spr('portrait', 0, 16, 14);
  for (let i = 0; i < 5; i++) spr('heart', i < g.p.hp ? 0 : 1, 84 + i * 32, 16);
  ctx.fillStyle = '#f0e0e0'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'left';
  ctx.fillText(SKINS[skin].name, 84, 64);
  { // активные усиления: иконка + полоска оставшегося времени
    let hx = 84;
    for (const [k, pw] of Object.entries(POWERUPS)) {
      const active = k === 'shield' ? g.pw.shield : (g.pw[k] > 0);
      if (!active) continue;
      spr('pw_' + k, 0, hx, 72, false, 22, 22);
      if (pw.dur) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(hx, 96, 22, 4); ctx.fillStyle = pw.col; ctx.fillRect(hx, 96, 22 * g.pw[k] / pw.dur, 4); }
      hx += 28;
    }
  }
  spr('crystal', 0, W - 300, 14, false, 18, 26); ctx.fillText('x ' + g.crystals, W - 276, 36);
  spr('coin', 0, W - 300, 44, false, 20, 20);   ctx.fillText('x ' + g.coins, W - 276, 62);
  ctx.textAlign = 'right'; ctx.font = 'bold 26px monospace'; ctx.fillStyle = '#ffe680';
  ctx.fillText(Math.floor(g.score).toString().padStart(6, '0'), W - 90, 40);
  ctx.font = '14px monospace'; ctx.fillStyle = '#c0a0a8';
  ctx.fillText('скорость ' + (g.speed / 200).toFixed(2) + 'x', W - 90, 62);
  // пауза
  panel(W - 70, 14, 54, 54); ctx.fillStyle = '#ddd';
  if (state === 'pause') { ctx.beginPath(); ctx.moveTo(W - 52, 28); ctx.lineTo(W - 28, 41); ctx.lineTo(W - 52, 54); ctx.fill(); }
  else { ctx.fillRect(W - 54, 28, 8, 26); ctx.fillRect(W - 38, 28, 8, 26); }
  if (g.hudFlash > 0) { ctx.fillStyle = `rgba(255,0,0,${g.hudFlash * 0.5})`; ctx.fillRect(0, 0, W, H); }
}
// Стилизованный заголовок: рукописный шрифт, градиент, обводка, рожки и хвостик, лёгкое покачивание
function drawTitle(cx, cy, size, t) {
  const text = 'Хеллка';
  ctx.save();
  if (IMG.title) { // готовый логотип: вписываем по высоте, тот же лёгкий «дыхательный» наклон
    const im = IMG.title, h = size * 1.45, w = h * im.width / im.height;
    ctx.translate(cx, cy - size * 0.4 + Math.sin(t * 2.2) * size * 0.03); ctx.rotate(Math.sin(t * 1.4) * 0.03);
    ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); return;
  }
  ctx.font = `${size}px Lobster, cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(text).width;
  ctx.translate(cx, cy + Math.sin(t * 2.2) * size * 0.03); ctx.rotate(Math.sin(t * 1.4) * 0.035 - 0.03);
  ctx.lineJoin = 'round';
  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(text, size * 0.06, size * 0.07);
  // обводка
  ctx.lineWidth = size * 0.17; ctx.strokeStyle = '#1a0408'; ctx.strokeText(text, 0, 0);
  // заливка градиентом
  const grd = ctx.createLinearGradient(0, -size * 0.75, 0, size * 0.12);
  grd.addColorStop(0, '#ffd66e'); grd.addColorStop(0.42, '#ff5a40'); grd.addColorStop(1, '#a80f1e');
  ctx.fillStyle = grd; ctx.fillText(text, 0, 0);
  // блик
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.save(); ctx.beginPath(); ctx.rect(-w, -size, 2 * w, size * 0.45); ctx.clip(); ctx.fillText(text, 0, 0); ctx.restore();
  // рожки над «Х»
  const hx = -w / 2 + size * 0.34, hy = -size * 0.62;
  for (const [dx, dir] of [[-size * 0.12, -1], [size * 0.12, 1]]) {
    ctx.beginPath(); ctx.moveTo(hx + dx - size * 0.07, hy); ctx.quadraticCurveTo(hx + dx + dir * size * 0.08, hy - size * 0.12, hx + dx + dir * size * 0.02, hy - size * 0.24);
    ctx.quadraticCurveTo(hx + dx + dir * size * 0.02, hy - size * 0.1, hx + dx + size * 0.07, hy); ctx.closePath();
    ctx.lineWidth = size * 0.07; ctx.strokeStyle = '#1a0408'; ctx.stroke(); ctx.fillStyle = '#e8352a'; ctx.fill();
  }
  // хвостик со стрелкой после «а»
  const tx = w / 2 + size * 0.02, ty = -size * 0.12, s2 = size;
  ctx.beginPath(); ctx.moveTo(tx, ty);
  ctx.bezierCurveTo(tx + s2 * 0.22, ty + s2 * 0.05, tx + s2 * 0.3, ty + s2 * 0.35, tx + s2 * 0.12, ty + s2 * 0.34);
  ctx.bezierCurveTo(tx + s2 * 0.0, ty + s2 * 0.33, tx + s2 * 0.02, ty + s2 * 0.2, tx + s2 * 0.14, ty + s2 * 0.2);
  ctx.lineCap = 'round'; ctx.lineWidth = s2 * 0.11; ctx.strokeStyle = '#1a0408'; ctx.stroke();
  ctx.lineWidth = s2 * 0.05; ctx.strokeStyle = '#e8352a'; ctx.stroke();
  const ax = tx + s2 * 0.14, ay = ty + s2 * 0.2; // наконечник
  ctx.beginPath(); ctx.moveTo(ax + s2 * 0.11, ay - s2 * 0.02); ctx.lineTo(ax - s2 * 0.03, ay - s2 * 0.1); ctx.lineTo(ax - s2 * 0.01, ay + s2 * 0.09); ctx.closePath();
  ctx.lineWidth = s2 * 0.05; ctx.strokeStyle = '#1a0408'; ctx.stroke(); ctx.fillStyle = '#e8352a'; ctx.fill();
  ctx.restore();
}
function centerText(s, y, size, col, bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px monospace`; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(s, W / 2 + 3, y + 3);
  ctx.fillStyle = col; ctx.fillText(s, W / 2, y);
}
function drawMenu(t) {
  drawBg(t * 60, t); drawLava(t * 60, t);
  drawSkinPicker(W / 2, 316, t);
  panel(W / 2 - 236, 52, 472, 176); // зазор до бейджа Twitch слева
  drawTitle(W / 2, 148, 96, t);
  centerText('Пробежка по Чертовску', 192, 20, '#f0c0c0', false);
  centerText('ПРОБЕЛ / ТАП — начать', 372, 24, '#ffe680');
  centerText('← → двигаться   •   пробел / ↑ прыжок (двойной)   •   P пауза   •   M звук', 400, 15, '#d0b0b8', false);
  centerText('кристалл +10   монета +5   бес (прыжок сверху) +25   лава = смерть', 420, 15, '#d0b0b8', false);
  drawSliders(444);
  if (best) centerText('рекорд: ' + best, 216, 17, '#ffb0a8');
  drawAchButton(ACH_BTN);
  drawAuthor();
  drawTwitch(t, 1 / 60);
}
function drawOver() {
  drawBg(G.camX, G.t); drawLava(G.camX, G.t); drawWorld();
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 260, 110, 520, 320);
  centerText('ИГРА ОКОНЧЕНА', 170, 44, '#ff4a4a');
  centerText('очки: ' + Math.floor(G.score), 235, 32, '#ffe680');
  centerText(`кристаллы ${G.crystals}   монеты ${G.coins}   дистанция ${Math.floor(G.dist / 10)} м`, 275, 18, '#f0c0c0', false);
  centerText('рекорд: ' + best + (Math.floor(G.score) >= best && best > 0 ? '  ★ новый!' : ''), 320, 22, '#ffb0a8');
  if (newAch) centerText(`★ новых достижений: ${newAch}`, 355, 18, '#ffe680');
  centerText('ПРОБЕЛ / ТАП — ещё раз', 395, 24, '#ffffff');
}

let last = 0, acc = 0, menuT = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  if (state === 'menu' || (state === 'ach' && achFrom === 'menu')) {
    menuT += dt; drawMenu(menuT);
    if (state === 'ach') { drawAchScreen(); jumpPressed = false; return; }
    drawToasts(dt);
    if (jumpPressed) { jumpPressed = false; startGame(); }
    return;
  }
  if (state === 'over') { drawOver(); drawToasts(dt); if (jumpPressed) { jumpPressed = false; startGame(); } return; }
  if (state === 'play') { acc += dt; const step = 1 / 120; while (acc >= step) { update(step); acc -= step; } }
  jumpPressed = false;
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  drawBg(G.camX, G.t); drawLava(G.camX, G.t); drawWorld();
  ctx.restore();
  drawHud(); drawToasts(state === 'play' ? dt : 0); if (SHOW_FPS) drawFps(dt);
  if (state === 'ach') { drawAchScreen(); return; } // открыт из паузы
  if (state === 'pause') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    panel(W / 2 - 230, 120, 460, 322);
    centerText('ПАУЗА', 168, 40, '#fff'); centerText('P / тап вне панели — продолжить', 196, 15, '#ddd', false);
    drawSliders(230);
    drawAchButton(ACH_BTN_PAUSE);
    drawSkinPicker(W / 2, 410, G.t + menuT);
  }
}
loadAssets().then(() => requestAnimationFrame(loop));
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
}
// отладочный хук (для автотестов из консоли)
window.HELLKA = { get G() { return G; }, get state() { return state; }, start: startGame, jump: () => { jumpPressed = true; }, step: dt => { if (state === 'play') update(dt); }, keys, tb, MUSIC, SFX_EL, ACH, unlocked, STATS, toasts, setState: v => { state = v; }, TWITCH, TILESETS, SPARKS, SKINS, SKIN_IMG, applySkin, nextSkin, get skin() { return skin; } };
})();
