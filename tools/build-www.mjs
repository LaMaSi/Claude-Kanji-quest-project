// Copies the web app (no tooling, reviews or tests) into www/ for the Android wrapper. Run: node tools/build-www.mjs
import { rmSync, mkdirSync, cpSync } from 'fs';
rmSync('www', { recursive: true, force: true }); mkdirSync('www/content/generated', { recursive: true });
for (const f of ['index.html', 'style.css', 'icon.svg', 'manifest.webmanifest', 'app.js', 'lang.js', 'art.js', 'data.js', 'german.js', 'engine.js', 'learn.js', 'kanji.js', 'kanjidata.js', 'stage.js', 'sprites.js', 'people.js', 'peopleui.js', 'aipeople.js', 'world.js', 'mapart.js']) cpSync(f, `www/${f}`);
cpSync('content/words.json', 'www/content/words.json'); cpSync('content/patterns.json', 'www/content/patterns.json'); cpSync('content/world.json', 'www/content/world.json'); cpSync('content/generated/sentences.json', 'www/content/generated/sentences.json');
cpSync('scenes', 'www/scenes', { recursive: true }); cpSync('assets', 'www/assets', { recursive: true });
console.log('www/ ready');
