'use strict';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "7025aa91bee0d71f81eaa382f9638ae6",
"assets/assets/boop.mp3": "8a3d81a2c3b45daa57e306ecfea65052",
"assets/assets/dingdingding.mp3": "14177020c892a15a384c73cf9046f441",
"assets/assets/pip.mp3": "ececfb437568b3f87aa374b1bff53fa6",
"assets/FontManifest.json": "ed9cd32fa597ae46abed4ac894b9902b",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/LICENSE": "859e2bea53900ce279a2937a40cc6244",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "ee9df0f8ad44495ccc527178090c5dfe",
"main.dart.js": "6e8d22d703fb06deece163d0c0e7f1da",
"manifest.json": "bde8035bb8ee6ffe08733a199d24ada1"
};

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheName) {
      return caches.delete(cacheName);
    }).then(function (_) {
      return caches.open(CACHE_NAME);
    }).then(function (cache) {
      return cache.addAll(Object.keys(RESOURCES));
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
