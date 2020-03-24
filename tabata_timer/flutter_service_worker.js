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
"favicon.png": "f0159985533bb53262b586282f9b281f",
"icons/Icon-192.png": "52e334b80a74a81cd4621da8da739d2e",
"icons/Icon-512.png": "343a77f898c4078fa86581bf512187ed",
"index.html": "7aee80ee72a52a012e78bdd68a46a6f6",
"main.dart.js": "87cc2ad62ccd98308912fef46221ee5e",
"manifest.json": "a4d5514ee3a556ad4e51e139fbae8ab3"
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
