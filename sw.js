const V='tanuki-v3';
const FILES=['./','index.html','style.css','app.js','lang.js','art.js','data.js','german.js','engine.js','learn.js','kanji.js','kanjidata.js','stage.js','sprites.js','people.js','peopleui.js','aipeople.js','world.js','mapart.js','yokai.js','content/world.json','content/yokai.json','assets/fonts/KleeOne-subset.woff2','scenes/index.json','icon.svg','manifest.webmanifest','content/words.json','content/patterns.json','content/generated/sentences.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
