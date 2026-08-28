const CACHE_NAME="amkina-music-v3";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
