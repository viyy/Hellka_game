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
  bg_far:      { frames: 1, w: 960, h: 540 }, // замок, луна (parallax дальний)
  bg_mid:      { frames: 1, w: 960, h: 540 }, // скалы (parallax ближний, с прозрачностью)
  portrait:    { frames: 1, w: 56, h: 56 },
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
function makeBgFar() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 540);
  grd.addColorStop(0, '#2a0a16'); grd.addColorStop(0.55, '#6a1420'); grd.addColorStop(1, '#a52a1a');
  g.fillStyle = grd; g.fillRect(0, 0, 960, 540);
  // луна
  g.fillStyle = '#c8202a'; g.beginPath(); g.arc(640, 150, 95, 0, 7); g.fill();
  g.fillStyle = '#e0303a'; g.beginPath(); g.arc(640, 150, 80, 0, 7); g.fill();
  g.fillStyle = '#b81c26'; [[600,120,14],[670,180,20],[650,110,8],[610,190,10]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill();});
  // замок: башни
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
    case 'bg_far':      return makeBgFar();
    case 'bg_mid':      return makeBgMid();
    case 'portrait':    return makePortrait();
  }
}
async function loadAssets() {
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
  get vol() { return VOL.music; }, muted: false, mode: null, tr: {}, level: 0, playing: false, pending: false,
  async init() {
    const names = { base: 'music', fast: 'music_fast' };
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      for (const [k, n] of Object.entries(names)) {
        const r = await fetch(`assets/${n}.ogg`); if (!r.ok) throw new Error(n);
        this.tr[k] = { buf: await AC.decodeAudioData(await r.arrayBuffer()) };
      }
      this.mode = 'wa';
    } catch (e) {
      this.tr = {};
      for (const [k, n] of Object.entries(names)) { const a = new Audio(`assets/${n}.mp3`); a.loop = true; a.volume = 0; a.preload = 'auto'; this.tr[k] = { el: a }; }
      this.mode = 'html';
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
    if (this.mode === 'wa') t.gain.gain.setTargetAtTime(v, AC.currentTime, 0.05); else t.el.volume = v;
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
  const down = e => { e.preventDefault(); el.classList.add('down'); on(); };
  const up = e => { e.preventDefault(); el.classList.remove('down'); off(); };
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
}
bindBtn('bl', () => tb.left = true, () => tb.left = false);
bindBtn('br', () => tb.right = true, () => tb.right = false);
bindBtn('bj', () => { jumpPressed = true; keys.__tj = true; }, () => keys.__tj = false);
// ползунки громкости: рисуются в меню и в паузе, тянутся мышью/пальцем
const SLIDERS = [{ key: 'music', label: 'Музыка' }, { key: 'sfx', label: 'Эффекты' }];
const SL = { x: W / 2 - 60, w: 260, h: 12, gap: 40 };
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
  if (state === 'menu' || state === 'over') { startGame(); return; }
  if (p.x > W - 70 && p.y < 70) { togglePause(); return; }
  if (state === 'pause') { togglePause(); return; }
  if (!isTouch) jumpPressed = true;
});
cv.addEventListener('pointermove', e => { if (dragSlider >= 0) sliderSet(dragSlider, toGame(e)); });
cv.addEventListener('pointerup', e => { if (dragSlider >= 0 && SLIDERS[dragSlider].key === 'sfx') SFX.coin(); dragSlider = -1; });
cv.addEventListener('pointercancel', () => { dragSlider = -1; });
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
const inLeft  = () => keys.ArrowLeft  || keys.KeyA || tb.left;
const inRight = () => keys.ArrowRight || keys.KeyD || tb.right;
const inJumpHeld = () => keys.Space || keys.ArrowUp || keys.KeyW || keys.__tj;

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = (W * s | 0) + 'px'; cv.style.height = (H * s | 0) + 'px';
}
addEventListener('resize', resize); resize();

// ───────────────────────── ИГРА ─────────────────────────
const GRAVITY = 1900, JUMP_V = 730, MOVE = 190;
const LAVA_Y = 500;               // верх лавы
const LEVELS = [432, 336, 240];   // высоты платформ (верх)
let state = 'menu';               // menu | play | pause | over
let best = +localStorage.getItem('hellka_best') || 0;
let G;                            // текущая сессия

function startGame() {
  G = {
    t: 0, camX: 0, speed: 200, score: 0, crystals: 0, coins: 0, dist: 0,
    plats: [], items: [], enemies: [], parts: [], texts: [],
    genX: 0, lastY: LEVELS[0], rnd: mulberry(Date.now() & 0xffff),
    p: { x: 120, y: 300, w: 30, h: 66, vx: 0, vy: 0, ground: false, jumps: 0, hp: 5, inv: 0, anim: 0, face: 1, dead: false, deadT: 0 },
    shake: 0, hudFlash: 0,
  };
  // стартовая площадка
  addPlat(-200, LEVELS[0], 900); G.genX = 700; G.lastY = LEVELS[0];
  state = 'play'; MUSIC.start(); SFX.confirm();
}
function togglePause() {
  if (state === 'play') { state = 'pause'; MUSIC.pause(); }
  else if (state === 'pause') { state = 'play'; MUSIC.resume(); }
}

function addPlat(x, y, w) { const p = { x, y, w, h: 96, spikes: [] }; G.plats.push(p); return p; }

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
    const p = addPlat(x, y, len);
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
      for (let i = 0; i < 3; i++) G.items.push({ t: 'crystal', x: G.genX + gap * 0.5 - 40 + i * 34, y: y - 130 - i * 4, w: 24, h: 34, ph: i });
    }
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
  G.items = G.items.filter(i => i.x + i.w > lim && !i.got);
  G.enemies = G.enemies.filter(e => e.x + e.w > lim && !(e.dead && e.deadT > 0.6));
}

function addText(x, y, s, col) { G.texts.push({ x, y, s, col, t: 0 }); }
function burst(x, y, col, n = 10, spd = 200) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = spd * (0.3 + Math.random()); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, col, t: 0, life: 0.4 + Math.random() * 0.4 }); }
}
function hurt(p, kx) {
  if (p.inv > 0 || p.dead) return;
  p.hp--; p.inv = 1.6; p.vy = -420; p.vx = kx; G.shake = 0.35; G.hudFlash = 0.4;
  SFX.hurt(); burst(p.x + p.w / 2, p.y + p.h / 2, '#ff4040', 12);
  if (p.hp <= 0) die();
}
function die() {
  const p = G.p; if (p.dead) return;
  p.dead = true; p.deadT = 0; p.vy = -500; SFX.dead(); G.shake = 0.6; MUSIC.stop();
  if (G.score > best) { best = Math.floor(G.score); localStorage.setItem('hellka_best', best); }
}

function update(dt) {
  const g = G, p = g.p;
  g.t += dt;
  // скорость растёт плавно, потолок 560 px/s (стартовая 200)
  g.speed = Math.min(560, 200 + g.t * 2.2 + Math.pow(g.t, 1.35) * 0.5);
  g.camX += g.speed * dt;
  g.dist += g.speed * dt;
  g.score += g.speed * dt * 0.02; // очки за дистанцию
  if (g.shake > 0) g.shake -= dt;
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
    if (jumpPressed && (p.ground || p.jumps < 2)) {
      const first = p.ground;
      p.vy = first ? -JUMP_V : -JUMP_V * 0.9; p.jumps = first ? 1 : 2; p.ground = false;
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
    if (p.y + p.h > LAVA_Y + 20) { burst(p.x + p.w / 2, LAVA_Y, '#ffb03a', 20, 260); p.hp = 0; die(); }
    p.anim += dt * (8 + g.speed / 60);
  }

  // ── враги ──
  for (const e of g.enemies) {
    if (e.dead) { e.deadT += dt; continue; }
    e.x += e.vx * dt; e.anim += dt * 6;
    if (e.x < e.px) { e.x = e.px; e.vx = Math.abs(e.vx); }
    if (e.x + e.w > e.px + e.pw) { e.x = e.px + e.pw - e.w; e.vx = -Math.abs(e.vx); }
    if (!p.dead && p.x + p.w - 6 > e.x && p.x + 6 < e.x + e.w && p.y + p.h > e.y && p.y < e.y + e.h) {
      if (p.vy > 0 && p.y + p.h - p.vy * dt <= e.y + 12) {
        e.dead = true; p.vy = -JUMP_V * 0.7; p.jumps = 1; g.score += 25; SFX.stomp();
        burst(e.x + e.w / 2, e.y + e.h / 2, '#d8322a', 14); addText(e.x, e.y - 10, '+25', '#ffb0a8');
      } else hurt(p, g.speed - 280);
    }
  }
  // ── предметы ──
  for (const it of g.items) {
    if (it.got) continue;
    it.ph += dt * 3;
    if (!p.dead && p.x + p.w > it.x && p.x < it.x + it.w && p.y + p.h > it.y && p.y < it.y + it.h) {
      it.got = true;
      if (it.t === 'crystal') { g.crystals++; g.score += 10; SFX.crystal(); burst(it.x + 12, it.y + 17, '#ff5a5a', 8, 140); addText(it.x, it.y - 10, '+10', '#ff8a8a'); }
      else { g.coins++; g.score += 5; SFX.coin(); burst(it.x + 12, it.y + 12, '#ffd23a', 6, 120); addText(it.x, it.y - 10, '+5', '#ffe680'); }
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
  for (const [key, k] of [['bg_far', 0.15], ['bg_mid', 0.4]]) {
    const im = IMG[key], bw = Math.max(W, Math.round(H * im.width / im.height));
    const ox = -(camX * k) % bw;
    ctx.drawImage(im, ox, 0, bw, H); ctx.drawImage(im, ox + bw, 0, bw, H);
  }
  // притемняем фон, чтобы предметы и враги читались на насыщенной картинке
  ctx.fillStyle = 'rgba(15,0,8,0.28)'; ctx.fillRect(0, 0, W, H);
  // свечение лавы снизу
  const gr = ctx.createLinearGradient(0, LAVA_Y - 160, 0, LAVA_Y);
  gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(1, 'rgba(255,90,20,0.35)');
  ctx.fillStyle = gr; ctx.fillRect(0, LAVA_Y - 160, W, 160);
}
function drawLava(camX, t) {
  const f = (t * 3 | 0) % 2, off = -(camX * 0.9) % 64;
  const bob = Math.sin(t * 4) * 3;
  for (let x = off - 64; x < W + 64; x += 64) spr('lava', f, x, LAVA_Y + bob, false, 64, 64);
  ctx.fillStyle = '#c8300a'; ctx.fillRect(0, LAVA_Y + 64 + bob, W, H);
}
function drawWorld() {
  const g = G, cx = g.camX;
  for (const pl of g.plats) {
    const sx = pl.x - cx; if (sx > W || sx + pl.w < 0) continue;
    const T = MANIFEST.tile.w;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, pl.y, pl.w, pl.h); ctx.clip();
    for (let x = 0; x < pl.w; x += T) {
      spr('tile', 0, sx + x, pl.y);
      for (let y = T; y < pl.h; y += T) spr('tile', 1, sx + x, pl.y + y);
    }
    ctx.restore();
    for (const s of pl.spikes) for (let x = s.x; x < s.x + s.w; x += 32) spr('spike', 0, x - cx, pl.y - MANIFEST.spike.h + 2, false, 32, MANIFEST.spike.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx, pl.y + 96, pl.w, 10);
  }
  for (const it of g.items) {
    if (it.got) continue; const sx = it.x - cx; if (sx > W || sx < -40) continue;
    const bob = Math.sin(it.ph) * 4;
    if (it.t === 'crystal') { ctx.save(); ctx.shadowColor = '#ff3030'; ctx.shadowBlur = 12; spr('crystal', 0, sx, it.y + bob); ctx.restore(); }
    else spr('coin', it.ph * 2, sx, it.y + bob);
  }
  for (const e of g.enemies) {
    const sx = e.x - cx; if (sx > W || sx < -60) continue;
    const im = MANIFEST.imp, ix = sx + e.w / 2 - im.w / 2, iy = e.y + e.h - im.h;
    if (e.dead) { ctx.save(); ctx.globalAlpha = 1 - e.deadT / 0.6; spr('imp', 0, ix, iy + e.deadT * 60, e.vx > 0, im.w, im.h * (1 - e.deadT)); ctx.restore(); }
    else spr('imp', e.anim, ix, iy + Math.sin(e.anim * 2) * 2, e.vx > 0);
  }
  // игрок
  const p = g.p;
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
function drawHud() {
  const g = G;
  spr('portrait', 0, 16, 14);
  for (let i = 0; i < 5; i++) spr('heart', i < g.p.hp ? 0 : 1, 84 + i * 32, 16);
  ctx.fillStyle = '#f0e0e0'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'left';
  ctx.fillText('Хеллка', 84, 64);
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
function centerText(s, y, size, col, bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px monospace`; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(s, W / 2 + 3, y + 3);
  ctx.fillStyle = col; ctx.fillText(s, W / 2, y);
}
function drawMenu(t) {
  drawBg(t * 60, t); drawLava(t * 60, t);
  spr('player_run', t * 10, W / 2 - MANIFEST.player_run.w / 2, 322 - MANIFEST.player_run.h);
  panel(W / 2 - 300, 60, 600, 158);
  centerText('ХЕЛЛКА', 126, 64, '#ff4a4a');
  centerText('бесконечный платформер', 168, 22, '#f0c0c0', false);
  centerText('ПРОБЕЛ / ТАП — начать', 362, 24, '#ffe680');
  centerText('← → двигаться   •   пробел / ↑ прыжок (двойной)   •   P пауза   •   M звук', 396, 15, '#d0b0b8', false);
  centerText('кристалл +10   монета +5   бес (прыжок сверху) +25   лава = смерть', 418, 15, '#d0b0b8', false);
  drawSliders(444);
  if (best) centerText('рекорд: ' + best, 200, 18, '#ffb0a8');
}
function drawOver() {
  drawBg(G.camX, G.t); drawLava(G.camX, G.t); drawWorld();
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  panel(W / 2 - 260, 110, 520, 320);
  centerText('ИГРА ОКОНЧЕНА', 170, 44, '#ff4a4a');
  centerText('очки: ' + Math.floor(G.score), 235, 32, '#ffe680');
  centerText(`кристаллы ${G.crystals}   монеты ${G.coins}   дистанция ${Math.floor(G.dist / 10)} м`, 275, 18, '#f0c0c0', false);
  centerText('рекорд: ' + best + (Math.floor(G.score) >= best && best > 0 ? '  ★ новый!' : ''), 320, 22, '#ffb0a8');
  centerText('ПРОБЕЛ / ТАП — ещё раз', 395, 24, '#ffffff');
}

let last = 0, acc = 0, menuT = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  if (state === 'menu') {
    menuT += dt; drawMenu(menuT);
    if (jumpPressed) { jumpPressed = false; startGame(); }
    return;
  }
  if (state === 'over') { drawOver(); if (jumpPressed) { jumpPressed = false; startGame(); } return; }
  if (state === 'play') { acc += dt; const step = 1 / 120; while (acc >= step) { update(step); acc -= step; } }
  jumpPressed = false;
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  drawBg(G.camX, G.t); drawLava(G.camX, G.t); drawWorld();
  ctx.restore();
  drawHud();
  if (state === 'pause') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    panel(W / 2 - 240, 150, 480, 240);
    centerText('ПАУЗА', 205, 44, '#fff'); centerText('P / тап вне ползунков — продолжить', 240, 16, '#ddd', false);
    drawSliders(290);
  }
}
loadAssets().then(() => requestAnimationFrame(loop));
// отладочный хук (для автотестов из консоли)
window.HELLKA = { get G() { return G; }, get state() { return state; }, start: startGame, jump: () => { jumpPressed = true; }, step: dt => { if (state === 'play') update(dt); }, keys, tb, MUSIC, SFX_EL };
})();
