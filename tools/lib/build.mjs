// Loads content and generates the sentence list from patterns. Pure functions, no I/O besides reading JSON.
import { readFileSync } from 'fs';
import { parse, num, count, numKana, romanizeChunk } from '../../lang.js';
import { np, inDat, inAcc, capFirst, NUMBER_WORDS } from './german.mjs';

const root = new URL('../../', import.meta.url);
export const load = f => JSON.parse(readFileSync(new URL(f, root), 'utf8'));

export const KANA_RE = /^[ぁ-ゖァ-ヺー　 、。！？…]*$/;
export const KANJI_RE = /[一-鿿々]/;

/** reading (kana) of a markup string, words kept apart by spaces */
export const reading = jp => parse(jp).map(w => w.map(s => s.r).join('')).join(' ');
/** all-kanji spelling (no furigana) */
export const kanjiText = jp => parse(jp).map(w => w.map(s => s.k).join('')).join(' ');
/** markup with kanji replaced by plain kana (used for rare kanji) */
export const kanaOnly = jp => jp.replace(/\{[^|}]+\|([^}]+)\}/g, '$1');
/** romaji for a markup string */
export const romaji = jp => parse(jp).map(w => romanizeChunk(w.map(s => s.r).join(''))).join(' ');

export function loadAll() {
  const words = load('content/words.json');
  const reviewedSentences = load('content/reviewed-sentences.json');
  const patterns = load('content/patterns.json');
  const byId = Object.fromEntries(words.map(w => [w.id, w]));
  return { words, patterns, byId, reviewedSentences };
}

/** Japanese display markup for a word: rare kanji are shown in kana */
const jpDisplay = w => (w.kanjiCommon === false ? kanaOnly(w.jp) : w.jp);

export function buildSentences({ patterns, byId, reviewedSentences = {} }) {
  const out = [];
  for (const p of patterns) {
    p.fills.forEach((fill, i) => {
      const used = [];
      const slot = k => {
        const v = fill[k];
        if (typeof v === 'number') return v;
        const w = byId[v];
        if (!w) throw new Error(`${p.id}[${i}]: unknown word "${v}" in slot ${k}`);
        if (!used.includes(w.id)) used.push(w.id);
        return w;
      };
      const jpTok = (tok, full) => {
        let m;
        if ((m = tok.match(/^w:(.+)$/))) { const w = byId[m[1]]; if (!w) throw new Error(`${p.id}: unknown word ${m[1]}`); if (!used.includes(w.id)) used.push(w.id); return full ? w.jp : jpDisplay(w); }
        const [k, form] = tok.split('.');
        const v = slot(k);
        if (form === 'masu') return full ? v.masu : (v.kanjiCommon === false ? kanaOnly(v.masu) : v.masu);
        if (form === 'yen') return num(v) + '{円|えん}';
        if (form === 'count') return count(v);
        if (form === 'num') return num(v);
        return full ? v.jp : jpDisplay(v);
      };
      const jp = p.jp.replace(/<([^>]+)>/g, (_, t) => jpTok(t, false));
      const jpFull = p.jp.replace(/<([^>]+)>/g, (_, t) => jpTok(t, true));
      const de = capFirst(p.de.replace(/\[([^\]]+)\]/g, (_, tok) => {
        const [k, a, b] = tok.split('.');
        const v = slot(k);
        if (typeof v === 'number') return a === 'word' ? NUMBER_WORDS[v] : String(v);
        if (!a) return v.deSent ?? v.de;
        if (a === 'pl') return v.pl;
        if (a === '1sg') return v.de1;
        if (a === 'in') return inDat(v);
        if (a === 'into') return inAcc(v);
        return np(v, a, b === 'def');
      }));
      out.push({
        id: `${p.id}#${i + 1}`, pattern: p.id, ch: Math.max(+p.ch, ...used.map(u => byId[u].ch)),
        jp, jpFull, romaji: romaji(jp), kana: reading(jp), de, words: used,
        // reviewed only if the sentence text is exactly what a reviewer saw AND all its words and its pattern are reviewed
        status: reviewedSentences[`${p.id}#${i + 1}`] === `${jpFull}|${de}` && p.status === 'reviewed' && used.every(u => byId[u].status === 'reviewed') ? 'reviewed' : 'draft',
      });
    });
  }
  return out;
}
