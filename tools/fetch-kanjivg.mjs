// Fetches stroke paths from KanjiVG (CC BY-SA 3.0, http://kanjivg.tagaini.net) and writes ./kanjidata.js
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
// the 24 practice kanji plus every kanji used by a word in content/words.json
const used = JSON.parse(readFileSync('content/words.json', 'utf8')).flatMap(w => [w.jp, w.masu || '']).join('').replace(/\{([^|}]+)\|[^}]+\}/g, '$1').match(/[\u4e00-\u9fff]/g) || [];
const chars = [...new Set([...'人一二三大小日月水火木山川口手目食飲店金犬村王夜', ...used])];
const out = {};
for (const c of chars) {
  const hex = c.codePointAt(0).toString(16).padStart(5, '0');
  const svg = await (await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`)).text();
  out[c] = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(m => m[1]);
  console.log(c, out[c].length);
}
writeFileSync('./kanjidata.js',
  '// Stroke data: KanjiVG (c) Ulrich Apel, CC BY-SA 3.0 - http://kanjivg.tagaini.net\nexport const STROKES = ' + JSON.stringify(out) + ';\n');
