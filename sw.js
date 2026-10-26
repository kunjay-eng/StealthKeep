const V='stealthkeep-v2.1.0',SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
if(r.method!=='GET'||['google.com','googleusercontent.com','youtube.com','ytimg.com','googlevideo.com','spotify.com','soundcloud.com'].some(d=>u.hostname.endsWith(d)))return;
e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>{const n=fetch(r).then(x=>{if(x.ok||x.type==='opaque')caches.open(V).then(c=>c.put(r,x.clone()));return x}).catch(()=>h);return h||n}))});
