// Generates paste-ready review sheets for an external reviewer (e.g. ChatGPT) into review/.
// Run: node tools/make-review.mjs   (validate first: node tools/validate.mjs)
import { writeFileSync, mkdirSync } from 'fs';
import { loadAll, buildSentences, reading, kanjiText } from './lib/build.mjs';
import { romaji } from './lib/build.mjs';
import { lemma, np } from './lib/german.mjs';

const { words, patterns, byId, reviewedSentences } = loadAll();
const sentences = buildSentences({ patterns, byId, reviewedSentences });
const out = new URL('../review/', import.meta.url);
mkdirSync(out, { recursive: true });

const readable = jp => jp.replace(/\{([^|}]+)\|([^}]+)\}/g, '$1($2)');   // 食(た)べる
const cell = s => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
const POSNAME = { noun: 'Nomen', verb: 'Verb', adj: 'i-Adjektiv', expr: 'Ausdruck', pron: 'Pronomen', dem: 'Demonstrativ', q: 'Fragewort' };
const GEN = { m: 'der', f: 'die', n: 'das' };

const ROLE = `You are a strict reviewer with two roles at once: (1) a native Japanese speaker and experienced teacher of Japanese for German-speaking beginners, and (2) a native German speaker with a good grasp of German grammar. The material below is for a beginner game (roughly JLPT N5 level) whose learners are German speakers who already know hiragana and katakana, but no kanji.

Rules for your answer:
- Do NOT simply agree. Check every single row. If you are not sure, say UNSICHER (unsure) and explain, instead of guessing.
- Report anything that is wrong, unnatural, misleading for a beginner, or inconsistent, even if it is only a small point.
- Answer ONLY with the Markdown table described below, then a short list "General remarks". No introduction.
- Verdict values: OK / FEHLER (error) / UNNATÜRLICH (correct but unnatural) / UNSICHER (unsure).
- When you propose a correction, give the exact replacement text.
`;

function wordSheet(title, list, n) {
  const rows = list.map(w => {
    const art = w.pos === 'noun'
      ? `${np(w, 'nom', true)} (Nominativ mit bestimmtem Artikel)${w.pl ? `; Plural: ${w.pl}` : ''}${w.mass ? '; ohne Artikel gebraucht, wenn allgemein gemeint (z. B. „Ich esse Brot“)' : ''}${w.weak ? `; Akkusativ/Dativ Singular: ${np(w, 'acc', true)}` : ''}`
      : w.de + (w.de1 ? `; 1. Person Singular: „ich ${w.de1}“` : '');
    const jp = readable(w.jp) + (w.masu ? `  /  ます-Form: ${readable(w.masu)}` : '');
    return `| ${w.id} | ${cell(POSNAME[w.pos])} | ${cell(jp)} | ${cell(kanjiText(w.jp))} | ${cell(reading(w.jp))}${w.masu ? ' / ' + cell(reading(w.masu)) : ''} | ${cell(romaji(w.jp))} | ${cell(art)} | ${cell(w.kanjiCommon === false ? 'nein (im Spiel nur Kana)' : (/\{/.test(w.jp) ? 'ja' : '–'))} | ${cell(w.note || '')} |`;
  });
  return `# Review sheet ${n}: ${title}

${ROLE}
## What to check for each word
1. Is the Japanese correct: kanji, hiragana reading, furigana split (the brackets show kanji(reading)), the ます-form for verbs, and the rōmaji (Hepburn)?
2. Is this the normal way to write the word for a beginner? Should it be written in kana instead of kanji? (Column "Kanji im Spiel" tells what we planned.)
3. Is the German translation accurate and the usual one? Check gender (der/die/das), plural, countability, and whether a more common German equivalent exists. For words with several meanings, is the chosen meaning the one a beginner needs?
4. Is the note (Hinweis) correct and helpful? Is the word sensible for a beginner at this stage?

## Answer format (one row per word, same order, use the ID)
| ID | Verdict | Problem (short) | Exact correction | Reason |
|---|---|---|---|---|

## The words
| ID | Wortart | Japanese (kanji(reading)) | Kanji spelling | Hiragana | Rōmaji | German | Kanji im Spiel | Hinweis |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
}

function sentenceSheet(title, list, pats, n) {
  const rows = list.map(s => `| ${s.id} | ${cell(s.jpFull.replace(/\{([^|}]+)\|([^}]+)\}/g, '$1').replace(/ /g, ''))} | ${cell(s.kana.replace(/ /g, ''))} | ${cell(s.romaji)} | ${cell(s.de)} |`);
  const prow = pats.map(p => `| ${p.id} | ${cell(p.title)} | ${cell(p.explain)} |`);
  return `# Review sheet ${n}: ${title}

${ROLE}
## Part A – grammar notes (German text shown to learners)
Check that each explanation is correct, understandable for a beginner, and free of errors in German.
Answer in a table: | ID | Verdict | Problem | Exact correction | Reason |

| ID | Pattern | Explanation shown to the learner |
|---|---|---|
${prow.join('\n')}

## Part B – example sentences
Check each sentence for: (a) correct and natural Japanese (particles, word choice, politeness, counter, 何→なん, long vowels), (b) a German translation that is correct, natural and a faithful translation, and (c) whether the sentence makes sense as a beginner lesson. Japanese in these sentences is spaced between words only for learning; ignore the spacing.
Answer in a table: | ID | Verdict | Problem (Japanese or German) | Exact correction | Reason |

| ID | Japanese (kanji) | Hiragana | Rōmaji | German |
|---|---|---|---|---|
${rows.join('\n')}
`;
}

const todo = x => (x.status || 'draft') !== 'reviewed';
const ws = c => words.filter(w => w.ch === c && todo(w));
import { readdirSync, unlinkSync } from 'fs';
for (const f of readdirSync(out)) if (f.endsWith('.md')) unlinkSync(new URL(f, out));   // sheets only ever contain what is still open
const openWords = words.filter(todo), openPats = patterns.filter(todo), openSent = sentences.filter(todo);
let n = 0, written = [];
const put = (name, text) => { writeFileSync(new URL(name, out), text); written.push(name); };
if (openWords.length) put(`review-${++n}-words.md`, wordSheet('Vocabulary still open for review', openWords, n));
if (openSent.length || openPats.length) {
  const pids = new Set([...openPats.map(p => p.id), ...openSent.map(s => s.pattern)]);
  put(`review-${++n}-sentences.md`, sentenceSheet('Sentence patterns and example sentences still open for review', openSent, patterns.filter(p => pids.has(p.id)), n));
}
console.log(written.length ? `review sheets written: ${written.join(', ')} (${openWords.length} words, ${openPats.length} patterns, ${openSent.length} sentences open)` : 'nothing open – all content reviewed');
