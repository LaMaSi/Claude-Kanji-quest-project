// Simulation of three learner types over 3 weeks. Run: node tools/test-engine.mjs
// Checks the behaviour we promised: new words only when things go well, struggling words come back, similarity grows with confidence.
import { readFileSync } from 'fs';
import * as E from '../engine.js';
const load = f => JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const words = load('content/words.json'), sentences = load('content/generated/sentences.json');
const C = { words, byId: Object.fromEntries(words.map(w => [w.id, w])), patterns: load('content/patterns.json'), sentences };

let seed = 42; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let fails = 0; const check = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

function simulate(name, learnRate, forget, days = 21, sessionsPerDay = 1) {
  seed = 42;
  const G = E.defaultLearner(), know = {};                       // hidden "true" knowledge per item, 0..1
  const rows = [];
  let now = Date.parse('2026-11-23T20:00:00Z'), newTotal = 0;
  for (let d = 0; d < days; d++) {
    for (let s = 0; s < sessionsPerDay; s++) {
      const tasks = E.buildSession(G, C, { size: 6, now, rng });
      E.startSession(G, tasks);
      let ok = 0, nNew = 0;
      for (const t of tasks) {
        const task = E.makeTask(G, C, t, { rng });
        if (t.kind === 'intro') { nNew++; E.ensureItem(G, t.id, { intro: now }); }
        const q = task.q, k = know[q.id] ?? 0;
        const chance = q.kind === 'order' ? 0.15 : 1 / (q.options.length);
        const correct = rng() < chance + (1 - chance) * k;
        E.recordAnswer(G, q.id, correct, now);
        know[q.id] = Math.min(1, k + learnRate * (correct ? 1 : 0.6));
        if (correct) ok++;
      }
      newTotal += nNew;
      rows.push({ d: d + 1, n: tasks.length, nNew, ok });
      now += 6 * 3600e3;
    }
    for (const id in know) know[id] *= 1 - forget;                    // forgetting overnight
    now += 18 * 3600e3;
  }
  const known = E.introduced(G), conf = known.map(id => G.items[id].conf);
  const avg = conf.reduce((a, b) => a + b, 0) / (conf.length || 1);
  console.log(`${name.padEnd(8)} words introduced: ${String(known.length).padStart(2)}  avg confidence: ${avg.toFixed(2)}  shaky(<=2): ${conf.filter(c => c <= 2).length}  last-20 accuracy: ${(E.accuracy(G) ?? 0).toFixed(2)}  chapter unlocked: ${E.unlockedChapter(G, C)}`);
  return { G, known: known.length, rows, avg };
}
const fast = simulate('fast', 0.35, 0.02), mid = simulate('medium', 0.18, 0.05), slow = simulate('slow', 0.07, 0.08);
check(fast.known > mid.known && mid.known > slow.known, 'faster learners should be given more new words');
check(slow.known >= 6, 'even a slow learner must still get new words over three weeks');
check(fast.known <= 80 && E.usable({ status: 'draft' }) === false, 'draft content must be excluded');
const ids = new Set(sentences.filter(s => s.status === 'draft').map(s => s.id));
for (const r of [fast, mid, slow]) for (const id of Object.keys(r.G.items)) check(!(id.startsWith('s:') && ids.has(id.slice(2))), `draft sentence ${id} was used`);

// similarity grows with confidence: distractors for the same word at conf 1 vs conf 5
const G = E.defaultLearner(); for (const w of words) if (w.ch <= 2) E.setConfidence(G, w.id, 3);
const avgSim = conf => { let t = 0, n = 0; for (let i = 0; i < 60; i++) { const q = E.makeWordQuestion(G, C, 'ringo', { rng, forceConf: conf, pictures: false }); for (const o of q.options) if (o.id !== 'ringo') { t += E.similarity(C.byId.ringo, C.byId[o.id]); n++; } } return t / n; };
const s1 = avgSim(1), s5 = avgSim(5);
console.log(`distractor similarity to ringo: conf1=${s1.toFixed(2)}  conf3=${avgSim(3).toFixed(2)}  conf5=${s5.toFixed(2)}`);
check(s5 > s1 + 0.8, 'wrong answers must get more similar with confidence');
const q5 = E.makeWordQuestion(G, C, 'ringo', { rng, forceConf: 5 }); console.log('sample conf5 question:', JSON.stringify(q5.prompt), q5.options.map(o => o.id).join(', '));

// beginners get picture questions for words that have a picture; advanced ones never do
let pics = 0; for (let i = 0; i < 100; i++) if (E.makeWordQuestion(G, C, 'ringo', { rng, forceConf: 1 }).type === 'pic2jp') pics++;
check(pics > 40 && pics < 95, `picture questions at conf 1 should be common but not exclusive (${pics}/100)`);
check(E.makeWordQuestion(G, C, 'ringo', { rng, forceConf: 4 }).type !== 'pic2jp', 'no picture questions at confidence 4');
check(E.makeWordQuestion(G, C, 'konbanwa', { rng, forceConf: 1 }).type !== 'pic2jp', 'words without a picture never get picture questions');

// overwhelmed learner: no new words
const H = E.defaultLearner(); for (const w of words.slice(0, 10)) { E.setConfidence(H, w.id, 1); }
H.log = Array(20).fill(0).map((_, i) => (i % 3 === 0 ? 1 : 0)); H.sessions = 5; H.lastNewSession = 1;
check(E.newWordBudget(H) === 0, 'struggling learner must get 0 new words');
const tasks = E.buildSession(H, C, { size: 6, rng }); check(!tasks.some(t => t.kind === 'intro'), 'no intro tasks when overwhelmed');
console.log(fails ? `\n${fails} check(s) FAILED` : '\nengine checks OK');
process.exit(fails ? 1 : 0);
