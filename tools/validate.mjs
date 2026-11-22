// Content validation. Run: node tools/validate.mjs
// Errors (exit code 1) = definitely wrong / inconsistent. Warnings = independent tools disagree, a human should look.
import { writeFileSync, mkdirSync } from 'fs';
import kuromoji from 'kuromoji';
import * as wk from 'wanakana';
import { romanize, numKana, numKanji, toHira } from '../lang.js';
import { loadAll, buildSentences, reading, kanjiText, KANA_RE, KANJI_RE, romaji } from './lib/build.mjs';
import { KNOWN_WEAK, lemma, np, inDat, inAcc } from '../german.js';
import { SPRITE_IDS, PORTRAITS } from '../sprites.js';

const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const { words, patterns, byId, reviewedSentences } = loadAll();

// ---------- 1. unit checks of the script helpers ----------
const eq = (name, got, want) => { if (got !== want) err(`self-test ${name}: got "${got}", want "${want}"`); };
for (const [n, k] of [[1, 'いち'], [10, 'じゅう'], [11, 'じゅういち'], [20, 'にじゅう'], [50, 'ごじゅう'], [80, 'はちじゅう'], [100, 'ひゃく'], [150, 'ひゃくごじゅう'],
  [300, 'さんびゃく'], [600, 'ろっぴゃく'], [800, 'はっぴゃく'], [1000, 'せん'], [3000, 'さんぜん'], [8000, 'はっせん'], [4, 'よん'], [7, 'なな'], [9, 'きゅう'], [10000 - 1, 'きゅうせんきゅうひゃくきゅうじゅうきゅう']])
  eq(`numKana(${n})`, numKana(n), k);
eq('numKanji(150)', numKanji(150), '百五十'); eq('numKanji(3000)', numKanji(3000), '三千'); eq('numKanji(111)', numKanji(111), '百十一');
for (const [k, r] of [['しゃしん', 'shashin'], ['ちゅうい', 'chuui'], ['きって', 'kitte'], ['はっぴゃく', 'happyaku'], ['ほんや', "hon'ya"], ['おおかみ', 'ookami'], ['じゃあ', 'jaa'],
  ['パン', 'pan'], ['おちゃ', 'ocha'], ['ごめんなさい', 'gomennasai'], ['おやすみなさい', 'oyasuminasai'], ['いらっしゃいませ', 'irasshaimase'], ['すみません', 'sumimasen']])
  eq(`romanize(${k})`, romanize(k), r);

// German declension self-tests (the reviewer caught "der alter Mann"; keep it fixed)
{
  const T = (name, got, want) => eq(`german ${name}`, got, want);
  const mann = { de: 'Mann', adj: 'alt', gender: 'm' }, frau = { de: 'Frau', adj: 'alt', gender: 'f' }, bar = { de: 'Bär', gender: 'm', weak: true }, brot = { de: 'Brot', gender: 'n', mass: true }, dorf = { de: 'Dorf', gender: 'n' }, burg = { de: 'Burg', gender: 'f' };
  T('der alte Mann', np(mann, 'nom', true), 'der alte Mann'); T('ein alter Mann', np(mann, 'nom', false), 'ein alter Mann');
  T('den alten Mann', np(mann, 'acc', true), 'den alten Mann'); T('die alte Frau', np(frau, 'nom', true), 'die alte Frau');
  T('einen Bären', np(bar, 'acc', false), 'einen Bären'); T('dem Bären', np(bar, 'dat', true), 'dem Bären'); T('Brot', np(brot, 'acc', false), 'Brot');
  T('im Dorf', inDat(dorf), 'im Dorf'); T('in der Burg', inDat(burg), 'in der Burg'); T('ins Dorf', inAcc(dorf), 'ins Dorf'); T('in die Burg', inAcc(burg), 'in die Burg');
  T('lemma', lemma(mann), 'alter Mann');
}

// ---------- 2. schema ----------
const POS = ['noun', 'verb', 'adj', 'expr', 'pron', 'dem', 'q'];
const seen = new Set();
for (const w of words) {
  const at = `word ${w.id}`;
  if (seen.has(w.id)) err(`${at}: duplicate id`); seen.add(w.id);
  if (!/^[a-z][a-z0-9_]*$/.test(w.id)) err(`${at}: id must be lowercase ascii`);
  if (!POS.includes(w.pos)) err(`${at}: bad pos ${w.pos}`);
  if (!['draft', 'checked', 'reviewed'].includes(w.status)) err(`${at}: bad status`);
  if (![1, 2, 3, 4, 5, 6].includes(w.ch)) err(`${at}: bad chapter`);
  if (!w.de || !w.jp) err(`${at}: missing de/jp`);
  for (const f of ['jp', 'masu'].filter(f => w[f])) {
    const jp = w[f];
    if ((jp.match(/\{/g) || []).length !== (jp.match(/\}/g) || []).length) err(`${at}.${f}: unbalanced braces`);
    for (const m of jp.matchAll(/\{([^|}]*)\|([^}]*)\}/g)) {
      if (!KANJI_RE.test(m[1])) err(`${at}.${f}: furigana base "${m[1]}" has no kanji`);
      if (!KANA_RE.test(m[2])) err(`${at}.${f}: furigana "${m[2]}" is not kana`);
    }
    const plain = jp.replace(/\{[^|}]+\|[^}]+\}/g, '');
    if (!KANA_RE.test(plain)) err(`${at}.${f}: malformed markup or non-kana outside {kanji|reading}: "${plain}"`);
  }
  if (w.pos === 'noun') {
    if (!['m', 'f', 'n'].includes(w.gender)) err(`${at}: noun needs gender`);
    if (!/^\p{Lu}/u.test(w.de)) err(`${at}: German noun must be capitalized ("${w.de}")`);
    if (w.adj && /^\p{Lu}/u.test(w.adj)) err(`${at}: German adjective stem must be lowercase`);
    if (w.de.includes(' ')) err(`${at}: put an adjective in "adj" (stem, e.g. "alt") so it can be declined; "de" is the bare noun`);
    if (!w.mass && !w.pl && !w.adj) warn(`${at}: countable noun without plural`);
    if (w.adj && w.pl) err(`${at}: noun with adjective must not have a plural field (declension not supported)`);
    if (w.gender === 'm' && KNOWN_WEAK.includes(w.de) && !w.weak) err(`${at}: "${w.de}" is a weak masculine noun (Bären/Menschen) – set "weak": true`);
  }
  if (w.pos === 'verb' && !w.masu) err(`${at}: verb needs masu`);
  if (w.pos === 'verb' && w.objects && !Array.isArray(w.objects)) err(`${at}: objects must be a list`);
  if (['q', 'dem', 'pron'].includes(w.pos) && !w.deSent) err(`${at}: needs deSent`);
  if (w.kanjiCommon !== undefined && !KANJI_RE.test(kanjiText(w.jp))) err(`${at}: kanjiCommon only makes sense for words with kanji`);
}

// every noun needs a picture (sprites.js); people need a portrait
for (const w of words) if (w.pos === 'noun' && !SPRITE_IDS.includes(w.id)) err(`word ${w.id}: noun without a sprite in sprites.js`);
for (const id of SPRITE_IDS) if (!byId[id]) warn(`sprites.js: sprite "${id}" has no word`);
for (const id of PORTRAITS) if (!SPRITE_IDS.includes(id)) err(`portrait ${id} missing in SPRITES`);

// ---------- 3. patterns and sentences ----------
const has = (w, t) => (w.tags || []).includes(t);
const checkSlot = (p, i, k, w, req) => {
  const at = `${p.id}[${i + 1}] slot ${k} (${w.id})`;
  if (req.pos && w.pos !== req.pos) err(`${at}: pos ${w.pos}, needs ${req.pos}`);
  if (req.id && w.id !== req.id) err(`${at}: must be ${req.id}`);
  if (req.tagsAny && !req.tagsAny.some(t => has(w, t))) err(`${at}: needs one of tags ${req.tagsAny}`);
  if (req.notTags && req.notTags.some(t => has(w, t))) err(`${at}: must not have tags ${req.notTags}`);
  if (req.hasPl && !w.pl) err(`${at}: needs a plural`);
  if (req.notMass && w.mass) err(`${at}: mass nouns cannot be counted`);
};
for (const p of patterns) {
  if (!p.fills?.length) err(`pattern ${p.id}: no fills`);
  p.fills?.forEach((f, i) => {
    for (const [k, req] of Object.entries(p.require || {})) {
      const w = byId[f[k]]; if (!w) { err(`${p.id}[${i + 1}]: slot ${k} unknown word "${f[k]}"`); continue; }
      checkSlot(p, i, k, w, req);
    }
    for (const [o, vb] of p.objOf || []) {
      const ow = byId[f[o]], vw = byId[f[vb]];
      if (ow && vw && !(vw.objects || []).some(t => has(ow, t))) err(`${p.id}[${i + 1}]: ${vw.id} cannot take ${ow.id} (needs tags ${vw.objects})`);
    }
  });
}
let sentences = [];
try { sentences = buildSentences({ patterns, byId, reviewedSentences }); } catch (e) { err(`sentence build failed: ${e.message}`); }
const seenJp = new Set();
for (const s of sentences) {
  const at = `sentence ${s.id}`;
  if (/[<>\[\]]/.test(s.jp + s.de)) err(`${at}: unresolved token in "${s.jp}" / "${s.de}"`);
  if (!/[.?!]$/.test(s.de)) err(`${at}: German must end with punctuation: "${s.de}"`);
  if (/ {2}/.test(s.de) || /undefined|NaN/.test(s.de + s.jp)) err(`${at}: malformed output "${s.de}" / "${s.jp}"`);
  if (!/^\p{Lu}/u.test(s.de)) err(`${at}: German must start uppercase`);
  if (/\{何\|なに\}[^ ]* ?(です|だ)/.test(s.jpFull) || /\{何\|なに\} です/.test(s.jpFull)) err(`${at}: 何 before です must be read なん`);
  if (!/[。？]$/.test(s.jp)) err(`${at}: Japanese must end with 。or ？`);
  if (seenJp.has(s.jp)) err(`${at}: duplicate sentence ${s.jp}`); seenJp.add(s.jp);
}

for (const id of Object.keys(reviewedSentences)) if (!sentences.some(s => s.id === id)) warn(`reviewed-sentences.json: stale id ${id}`);

// ---------- 4. readings vs. kuromoji, romaji vs. wanakana (independent cross-check) ----------
const tokenizer = await new Promise((res, rej) => kuromoji.builder({ dicPath: new URL('../node_modules/kuromoji/dict', import.meta.url).pathname }).build((e, t) => e ? rej(e) : res(t)));
const kuroReading = text => tokenizer.tokenize(text).map(t => toHira(t.reading && t.reading !== '*' ? t.reading : t.surface_form)).join('');
const strip = s => s.replace(/ /g, '');
const KNOWN_DIFF = { nani: 'なに/なん both valid' };
for (const w of words) for (const f of ['jp', 'masu'].filter(x => w[x])) {
  const mine = strip(reading(w[f])), kanji = strip(kanjiText(w[f]));
  if (!KANJI_RE.test(kanji)) continue;
  const k = kuroReading(kanji);
  if (k !== mine && !KNOWN_DIFF[w.id]) warn(`reading ${w.id}.${f}: mine ${mine}  vs kuromoji ${k}  (${kanji})`);
}
for (const w of words) {
  const mine = romaji(w.jp).replace(/'/g, '');
  const theirs = wk.toRomaji(reading(w.jp)).replace(/'/g, '').replace(/ /g, ' ');
  if (strip(mine) !== strip(theirs) && !/[はへ]\b/.test(reading(w.jp)) && !/(は|へ)$/.test(reading(w.jp).split(' ').pop())) warn(`romaji ${w.id}: mine "${mine}" vs wanakana "${theirs}"`);
}

// ---------- 5. output ----------
mkdirSync(new URL('../content/generated/', import.meta.url), { recursive: true });
writeFileSync(new URL('../content/generated/sentences.json', import.meta.url), JSON.stringify(sentences, null, 1));

const byCh = [1, 2, 3].map(c => `ch${c}: ${words.filter(w => w.ch === c).length} words, ${sentences.filter(s => s.ch === c).length} sentences`).join(' | ');
console.log(`${words.length} words, ${patterns.length} patterns, ${sentences.length} generated sentences  (${byCh})`);
const cnt = (arr, s) => arr.filter(x => (x.status || 'draft') === s).length;
console.log(`status (draft/checked/reviewed): words ${['draft', 'checked', 'reviewed'].map(s => cnt(words, s)).join('/')} | patterns ${['draft', 'checked', 'reviewed'].map(s => cnt(patterns, s)).join('/')} | sentences ${['draft', 'checked', 'reviewed'].map(s => cnt(sentences, s)).join('/')}`);
for (const w of warns) console.log('WARN ', w);
for (const e of errors) console.log('ERROR', e);
console.log(errors.length ? `\n${errors.length} error(s), ${warns.length} warning(s)` : `\nOK – 0 errors, ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
