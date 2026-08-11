/* Service worker — makes the app installable and lets it start without a
   network. Two caches:

     shell    the app itself (one generated HTML file plus icons)
     runtime  the Three.js module and the planet textures, which live on a CDN

   Caching the CDN is what actually buys offline use: without those files the
   app can only show its "could not load the 3D library" message. jsdelivr
   serves them with CORS, so the responses are real rather than opaque.

   Navigations are network-first, so a redeploy is picked up on the next online
   visit rather than being pinned to whatever was cached first. */

const VERSION = 'v1';
const SHELL_CACHE   = `solar-explorer-shell-${VERSION}`;
const RUNTIME_CACHE = `solar-explorer-runtime-${VERSION}`;
const CDN_HOST = 'cdn.jsdelivr.net';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // one bad entry must not fail the whole install
    await Promise.all(SHELL.map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, RUNTIME_CACHE];
    const names = await caches.keys();
    await Promise.all(names.map(n => keep.includes(n) ? null : caches.delete(n)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if(hit) return hit;
  const response = await fetch(request);
  if(response && response.ok) cache.put(request, response.clone()).catch(() => {});
  return response;
}

async function networkFirst(request){
  const cache = await caches.open(SHELL_CACHE);
  try{
    const response = await fetch(request);
    if(response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }catch(err){
    const hit = await cache.match(request) || await cache.match('./index.html') || await cache.match('./');
    if(hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;

  let url;
  try{ url = new URL(request.url); }catch(err){ return; }
  if(url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if(url.origin === self.location.origin){
    if(request.mode === 'navigate'){
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(cacheFirst(request, SHELL_CACHE).catch(() => fetch(request)));
    }
    return;
  }

  if(url.hostname === CDN_HOST){
    event.respondWith(cacheFirst(request, RUNTIME_CACHE).catch(() => fetch(request)));
  }
});
