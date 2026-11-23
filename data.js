// Loads the reviewed content (content/*.json) and exposes it in the shapes the game uses.
import { displayDe } from './german.js';
import { numKana } from './lang.js';
const get = f => fetch(f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
const [words, patterns, sentences, world, yokai] = await Promise.all([get('content/words.json'), get('content/patterns.json'), get('content/generated/sentences.json'), get('content/world.json'), get('content/yokai.json')]);
export const CONTENT = { words, patterns, sentences, world, yokai, byId: Object.fromEntries(words.map(w => [w.id, w])) };

const catOf = w => (w.tags || []).includes('animal') ? 'animal' : (w.tags || []).includes('place') ? 'place' : (w.tags || []).includes('person') ? 'person'
  : (w.tags || []).some(t => ['food', 'drink', 'item', 'money'].includes(t)) ? 'item' : w.pos;
/** VOCAB[id] = { m: markup, de: "der Apfel", cat } – used by the story scenes */
export const VOCAB = Object.fromEntries(words.map(w => [w.id, { m: w.jp, de: displayDe(w), cat: catOf(w) }]));
export const ANIMALS = words.filter(w => (w.tags || []).includes('animal') && w.status !== 'draft').map(w => w.id);

export const SHOP = [
  { id: 'ringo', price: 50 },
  { id: 'pan', price: 80 },
  { id: 'kusuri', price: 150, heal: 12 },
];

// NOT YET REVIEWED (not part of the content pipeline): kanji meanings and the wolf lore text.
export const KANJI = {
  '人': ['ひと', 'der Mensch'], '一': ['いち', 'eins'], '二': ['に', 'zwei'], '三': ['さん', 'drei'],
  '大': ['おおきい', 'groß'], '小': ['ちいさい', 'klein'], '日': ['ひ・にち', 'Tag, Sonne'], '月': ['つき', 'Mond, Monat'],
  '水': ['みず', 'Wasser'], '火': ['ひ', 'Feuer'], '木': ['き', 'Baum, Holz'], '山': ['やま', 'Berg'],
  '川': ['かわ', 'Fluss'], '口': ['くち', 'Mund'], '手': ['て', 'Hand'], '目': ['め', 'Auge'],
  '食': ['たべる', 'essen'], '飲': ['のむ', 'trinken'], '店': ['みせ', 'Laden'], '金': ['かね', 'Geld, Gold'],
  '犬': ['いぬ', 'Hund'], '村': ['むら', 'Dorf'], '王': ['おう', 'König'], '夜': ['よる', 'Nacht'],
};
export const LORE_WOLF =
  'Im alten Japan wurde der Wolf nicht nur gefürchtet, sondern auch verehrt: 狼 (おおかみ, „Ōkami“) klingt wie 大神 – ' +
  '„großer Gott“. Bauern stellten Reis und Sake für die Wölfe bereit, damit sie Wildschweine von den Feldern fernhielten. ' +
  'Manche Schreine, z. B. in den Bergen von Chichibu, haben bis heute Wolfsstatuen als Wächter.';

// ---- tap-to-translate: gloss for one word of a Japanese line (null = unknown) ----
const PARTICLES = { 'は': 'Themenpartikel („was … betrifft“)', 'が': 'Subjektpartikel', 'を': 'Objektpartikel', 'に': 'Partikel: Ort / Zeit / Ziel', 'へ': 'Partikel: Richtung (hin zu)',
  'の': 'Partikel: von / gehört zu', 'と': 'Partikel: und / mit', 'で': 'Partikel: Ort einer Handlung / mit', 'も': 'Partikel: auch', 'か': 'Fragepartikel',
  'です': 'ist / sind (höflich)', 'ですか': 'ist …? (höfliche Frage)', 'ます': 'höfliche Verbendung' };
const stripPunct = s => s.replace(/[。！？、…]+$/g, '');
const readingOf = m => m.replace(/\{[^|}]+\|([^}]+)\}/g, '$1');
const byMarkup = new Map(), byReading = new Map();
for (const w of words) {
  const add = (m, de) => { byMarkup.set(m, de); const r = readingOf(m); if (!byReading.has(r)) byReading.set(r, de); };
  add(w.jp, displayDe(w)); if (w.masu) add(w.masu, `${w.de} (höflich)`);
}
export function glossOf(wordMarkup) {
  const m = stripPunct(wordMarkup), r = readingOf(m);
  if (!m) return null;
  if (PARTICLES[r]) return `${r} – ${PARTICLES[r]}`;
  const hit = byMarkup.get(m) ?? byReading.get(r);
  if (hit) return `${r} – ${hit}`;
  // numbers like 五十円 / 三つ
  const yen = r.endsWith('えん') ? r.slice(0, -2) : null;
  for (let n = 1; n <= 9999; n++) { const k = numKana(n); if (r === k) return `${r} – ${n}`; if (yen === k) return `${r} – ${n} Yen`; }
  const tsu = { 'ひとつ': 1, 'ふたつ': 2, 'みっつ': 3, 'よっつ': 4, 'いつつ': 5, 'むっつ': 6, 'ななつ': 7, 'やっつ': 8, 'ここのつ': 9, 'とお': 10 }[r];
  if (tsu) return `${r} – ${tsu} Stück`;
  return null;
}
