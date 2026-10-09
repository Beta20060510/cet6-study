// Replace the former app's cache-first worker; preserve localStorage answers.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('cet6-'))await caches.delete(key);await self.clients.claim();for(const client of await self.clients.matchAll({type:'window'}))if(client.url.startsWith(self.registration.scope))await client.navigate(self.registration.scope);await self.registration.unregister();})()));
