'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "3a5ec224d78ca13610c3dae95267470f",
"assets/assets/cone.png": "a36b693d5263e8a3408bf371a12ad3da",
"assets/assets/icon-512.png": "3704a6c7a87b99536b3efb6a33f3af1f",
"assets/assets/linux-ifconfig.png": "589d9645374aa78ad29752e1c8a5cf51",
"assets/assets/linux-lua.png": "263e7d93a8d679dc7c95b7d7970781f9",
"assets/assets/linux-main-interface.png": "876836802f655d5aa1244c0a2313cfcd",
"assets/assets/linux-menu.png": "654a6572ce193f265c8d800fe2811593",
"assets/assets/linux-password.png": "3aa7a22bf5bbd823d53e6b5cf491cc4b",
"assets/assets/linux-show-settings.png": "f04e8f618e967305f03539707be351b0",
"assets/assets/linux-terminal.png": "c9e954c56c5e095ffa154f75a52ea7d6",
"assets/assets/linux-web.png": "281eb662e691910a5bc7b2715c5752db",
"assets/assets/mac-http-interface.png": "77a592defe09f09ae110724b6c02d60c",
"assets/assets/mac-ip.png": "8c43afb6d585ffd5c3d7899037b7539a",
"assets/assets/mac-menu.png": "081b9a3a87a1162f6a79339f026626e8",
"assets/assets/mac-network.png": "cd597a7c4ccbdffa47f6c49d18a9e0c2",
"assets/assets/signal-0.png": "8f72a9046bc161142a6721f842836f39",
"assets/assets/signal-1.png": "d54b6756ecd79e0c274d7c2574aa044c",
"assets/assets/signal-2.png": "dbcb597e5a82f324172603bdbb225478",
"assets/assets/signal-3.png": "7e9c2891a02af9451c7716375be4209f",
"assets/assets/windows-cmd.png": "3a40a460460d2ac3d8d43fc7bf45193d",
"assets/assets/windows-ipconfig.png": "6237eb2ea1577e4fe0e978af9fca7b4a",
"assets/assets/windows-lua.png": "937db072bea75c4d3bcba542ea0d289c",
"assets/assets/windows-main-interface.png": "c48f141a819495175f35924339cbffb3",
"assets/assets/windows-menu.png": "df6172bb4e101907669927e426107bd6",
"assets/assets/windows-password.png": "1f167fd14d794b292fbdec373335f57e",
"assets/assets/windows-run.png": "c489d9ba3957b372f9abd9eece409da7",
"assets/assets/windows-show-settings.png": "7a1b995cf8e889c53f0d0493dc523fcd",
"assets/assets/windows-web.png": "073ccce9b2324205b4b8559e1bcbc22b",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/fonts/MaterialIcons-Regular.otf": "7e7a6cccddf6d7b20012a548461d5d81",
"assets/NOTICES": "1cdd4ad31fc9363660052a0759b2214e",
"canvaskit/canvaskit.js": "c2b4e5f3d7a3d82aed024e7249a78487",
"canvaskit/canvaskit.wasm": "4b83d89d9fecbea8ca46f2f760c5a9ba",
"canvaskit/profiling/canvaskit.js": "ae2949af4efc61d28a4a80fffa1db900",
"canvaskit/profiling/canvaskit.wasm": "95e736ab31147d1b2c7b25f11d4c32cd",
"favicon.png": "59f15c844f5742895e256b1703843a83",
"icons/Icon-192.png": "669fda5478a920ebf6dcfae1922dbcff",
"icons/Icon-512.png": "364acd907d56259c3a31d8e92fb3431b",
"icons/Icon-maskable-192.png": "a51deff445e980379cade6a240f707b1",
"icons/Icon-maskable-512.png": "98e38a9f6f2a16169600b6e785d56a43",
"index.html": "3894882eb8007121eb4602a3384133be",
"/": "3894882eb8007121eb4602a3384133be",
"main.dart.js": "c3d41f225660b5f3c7c944bbffd31e31",
"manifest.json": "87975fc4b00c10268c7d50fb16f30ba3",
"version.json": "b38bbd3c89ee63c131af851d8a8c89a1"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
