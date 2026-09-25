// Сгенерировано tools/build_assets.py — не править руками
const CACHE = 'hellka-edf2156d0e';
const FILES = [
"./",
"index.html",
"game.js",
"manifest.webmanifest",
"favicon.ico",
"favicon-32.png",
"icon-192.png",
"icon-512.png",
"icon-512-maskable.png",
"apple-touch-icon.png",
"assets/bg_far.png",
"assets/bg_mid.png",
"assets/bg_sky.png",
"assets/coin.png",
"assets/crystal.png",
"assets/heart.png",
"assets/imp.png",
"assets/lava.png",
"assets/manifest.js",
"assets/manifest.json",
"assets/music.mp3",
"assets/music.ogg",
"assets/music_fast.mp3",
"assets/music_fast.ogg",
"assets/player_dead.png",
"assets/player_hurt.png",
"assets/player_jump.png",
"assets/player_run.png",
"assets/portrait.png",
"assets/spike.png",
"assets/tile.png",
"assets/title.png",
"assets/ach/coins_50.png",
"assets/ach/crystals_50.png",
"assets/ach/daredevil.png",
"assets/ach/deaths_10.png",
"assets/ach/first_run.png",
"assets/ach/ghost.png",
"assets/ach/hidden.png",
"assets/ach/marathon.png",
"assets/ach/midnight.png",
"assets/ach/no_hit_500.png",
"assets/ach/pacifist.png",
"assets/ach/perfectionist.png",
"assets/ach/phoenix.png",
"assets/ach/score_1000.png",
"assets/ach/score_2500.png",
"assets/ach/score_500.png",
"assets/ach/speed_2.png",
"assets/ach/speed_max.png",
"assets/ach/stomp_10.png",
"assets/ach/survive_60.png",
"assets/fonts/Lobster-Regular.ttf",
"assets/sfx/coin.wav",
"assets/sfx/confirm.wav",
"assets/sfx/crystal.wav",
"assets/sfx/dead.wav",
"assets/sfx/djump.wav",
"assets/sfx/hurt.wav",
"assets/sfx/jump.wav",
"assets/sfx/step.wav",
"assets/sfx/stomp.wav"
];
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
