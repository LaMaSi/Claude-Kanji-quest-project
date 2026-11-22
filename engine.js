// Adaptive learning engine. Pure logic (no DOM, no fetch) so it can be tested in Node.
//
// State G (the learner), stored by the app:
//   G.items[id] = { conf 1..5, pinned, streak, recent:[0|1..], ok, bad, due(ms), intro(ms), src }   id = word id or "s:<sentenceId>"
//   G.log = last answers (0/1)   G.sessions   G.lastNewSession
// Content C = { words, byId, patterns, sentences }
import { displayDe } from './german.js';
import { parse } from './lang.js';
import { hasSprite } from './sprites.js';

export const CONF_LABELS = ['', 'neu', 'wackelig', 'geht so', 'sicher', 'sehr sicher'];
const DAY = 864e5;
const INTERVAL_DAYS = [0, 0, 1, 3, 8, 21];          // by confidence 1..5: when a word comes back
const STREAK_TO_RISE = [0, 2, 2, 3, 3, 99];          // correct answers in a row needed to go up from conf n
const OK_STATUS = ['reviewed', 'checked'];           // content with status "draft" is never shown to learners

export const usable = x => OK_STATUS.includes(x.status || 'draft');

// ------------------------------------------------------------------ learner state
export const defaultLearner = () => ({ items: {}, log: [], sessions: 0, lastNewSession: -1, streak: { days: 0, last: '' }, custom: [], wishes: [] });

export function ensureItem(G, id, init = {}) {
  if (!G.items[id]) G.items[id] = { conf: 1, pinned: false, streak: 0, recent: [], ok: 0, bad: 0, due: 0, intro: 0, src: 'game', ...init };
  return G.items[id];
}
export const isIntro = (G, id) => !!G.items[id]?.intro;
export const introduced = G => Object.keys(G.items).filter(id => G.items[id].intro && !id.startsWith('s:'));

/** learner says: "I already know this" (dictionary) or sets the slider by hand */
export function setConfidence(G, id, conf, { pinned, now = Date.now() } = {}) {
  const it = ensureItem(G, id);
  if (!it.intro) it.intro = now;
  it.conf = Math.min(5, Math.max(1, conf)); it.streak = 0;
  it.due = now + INTERVAL_DAYS[it.conf] * DAY;
  if (pinned !== undefined) it.pinned = pinned;
  return it;
}

/** one answer: updates confidence (unless pinned), schedule and the global log */
export function recordAnswer(G, id, ok, now = Date.now()) {
  const it = ensureItem(G, id);
  if (!it.intro) it.intro = now;
  it.recent = [...it.recent, ok ? 1 : 0].slice(-4);
  G.log = [...G.log, ok ? 1 : 0].slice(-40);
  G.recentIds = [...(G.recentIds || []), id].slice(-5);
  if (ok) {
    it.ok++; it.streak++;
    if (!it.pinned && it.conf < 5 && it.streak >= STREAK_TO_RISE[it.conf]) { it.conf++; it.streak = 0; }
    it.due = now + INTERVAL_DAYS[it.conf] * DAY;
  } else {
    it.bad++; it.streak = 0;
    const lastThree = it.recent.slice(-3);
    if (!it.pinned && it.conf > 1 && lastThree.filter(x => x === 0).length >= 2) it.conf--;   // two misses in the last three
    it.due = now;                                                                              // come back soon
  }
  return it;
}

export function accuracy(G, n = 20) {
  const l = G.log.slice(-n);
  return l.length < 8 ? null : l.reduce((a, b) => a + b, 0) / l.length;
}
const struggling = (G, ids) => ids.filter(id => G.items[id].conf <= 2 || G.items[id].recent.slice(-2).includes(0));

// ------------------------------------------------------------------ content access
export function mergeCustom(C, G) {
  const words = [...C.words, ...G.custom.map(c => ({ ...c, status: 'checked', custom: true, ch: 0 }))];
  return { ...C, words, byId: Object.fromEntries(words.map(w => [w.id, w])) };
}
const kanaOf = w => parse(w.jp).map(x => x.map(s => s.r).join('')).join('');
const kanjiOf = w => parse(w.jp).map(x => x.map(s => (s.kanji ? s.k : '')).join('')).join('');
const bigrams = s => { const b = new Set(); for (let i = 0; i < s.length - 1; i++) b.add(s.slice(i, i + 2)); return b; };

/** 0..~6: how easily two words are confused. Used to pick wrong answers: easy at conf 1, nasty at conf 5. */
export function similarity(a, b) {
  let s = 0;
  if (a.pos === b.pos) s += 1;
  if ((a.tags || []).some(t => (b.tags || []).includes(t))) s += 1;
  if (a.gender && a.gender === b.gender) s += 0.3;
  const ka = kanaOf(a), kb = kanaOf(b);
  s += 0.7 * (1 - Math.abs(ka.length - kb.length) / Math.max(ka.length, kb.length));
  const A = bigrams(ka), B = bigrams(kb);
  if (A.size && B.size) { let inter = 0; for (const x of A) if (B.has(x)) inter++; s += 2 * (2 * inter) / (A.size + B.size); }
  if (ka[0] === kb[0]) s += 0.5;
  if (ka.slice(-1) === kb.slice(-1)) s += 0.3;
  const kj = kanjiOf(a), kk = kanjiOf(b);
  if (kj && kk && [...kj].some(c => kk.includes(c))) s += 1;
  return s;
}

// ------------------------------------------------------------------ what to learn next
export function unlockedChapter(G, C) {
  let ch = 1;
  for (let c = 1; c < 6; c++) {
    const inCh = C.words.filter(w => w.ch === c && usable(w));
    if (!inCh.length) break;
    const intro = inCh.filter(w => isIntro(G, w.id));
    const avg = intro.length ? intro.reduce((s, w) => s + G.items[w.id].conf, 0) / intro.length : 0;
    if (intro.length / inCh.length >= 0.7 && avg >= 2.5) ch = c + 1; else break;
  }
  return ch;
}
/** how many new words this session may bring: depends on accuracy and on how many words are wobbly */
export function newWordBudget(G) {
  const known = introduced(G);
  if (known.length < 3) return 3;                                  // cold start
  const acc = accuracy(G) ?? 0.85, shaky = struggling(G, known).length;
  if (acc < 0.65 || shaky >= 6) return 0;                          // overwhelmed: only repeat
  const sinceNew = G.sessions - G.lastNewSession;
  let n = acc >= 0.9 && shaky <= 1 ? 3 : acc >= 0.8 && shaky <= 3 ? 2 : 1;
  if (n === 1 && sinceNew < 2) n = 0;                              // slow lane: a new word every second session
  if (sinceNew >= 2 && acc >= 0.7) n = Math.max(n, 1);             // but never dry for long ("regularly drop new words")
  return n;
}
export function nextNewWords(G, C, k) {
  const maxCh = unlockedChapter(G, C);
  return C.words.filter(w => usable(w) && !w.custom && w.ch <= maxCh && !isIntro(G, w.id)).slice(0, k);
}
const wordsOfSentence = (C, s) => s.words.map(id => C.byId[id]);
function eligibleSentences(G, C) {
  return C.sentences.filter(s => usable(s) && s.words.every(id => isIntro(G, id)))
    .map(s => ({ s, avg: s.words.reduce((a, id) => a + G.items[id].conf, 0) / s.words.length, seen: !!G.items['s:' + s.id]?.intro }))
    .filter(x => x.seen ? x.avg >= 2 : x.avg >= 3);                // brand-new sentence only when its words feel solid
}

// ------------------------------------------------------------------ session
/** returns an ordered task list. rng: () => 0..1 (injectable for tests) */
export function buildSession(G, C0, { size = 6, now = Date.now(), rng = Math.random } = {}) {
  const C = mergeCustom(C0, G);
  const known = introduced(G);
  const eligible = eligibleSentences(G, C);
  const sentSlots = eligible.length && size >= 5 ? 1 : 0;            // sentence practice always gets a seat once the words are solid
  const budget = Math.min(newWordBudget(G), Math.floor((size - sentSlots) / 2));
  const fresh = nextNewWords(G, C, budget);
  const recentlyAsked = new Set(G.recentIds || []);

  const due = known.filter(id => G.items[id].due <= now);
  const shaky = struggling(G, known);
  const rank = id => {                                              // lower = more urgent
    const it = G.items[id];
    return it.conf * 10 - Math.min(5, (now - it.due) / DAY) - (shaky.includes(id) ? 6 : 0) + (recentlyAsked.has(id) ? 8 : 0) + rng();
  };
  const reviewSlots = size - fresh.length;
  const pickFrom = [...new Set([...shaky.filter(id => due.includes(id) || G.items[id].conf <= 2), ...due, ...known])];
  const review = pickFrom.sort((a, b) => rank(a) - rank(b)).slice(0, reviewSlots - sentSlots);
  const tasks = review.map(id => ({ kind: 'word', id }));

  const sents = eligible.sort((a, b) => (a.seen - b.seen) * -1 + (a.avg - b.avg) + (rng() - 0.5)).slice(0, sentSlots);
  for (const x of sents) tasks.push({ kind: 'sentence', id: x.s.id });
  // with few words known the review list may be short: top up with the easiest known words again
  while (tasks.length + fresh.length < Math.min(size, 3) && known.length) tasks.push({ kind: 'word', id: known[tasks.length % known.length] });

  // interleave: new words (intro) spread between reviews, sentence last
  const out = [], rev = tasks.filter(t => t.kind === 'word'), sen = tasks.filter(t => t.kind === 'sentence');
  const gap = Math.max(1, Math.floor((rev.length + 1) / (fresh.length + 1)));
  let fi = 0;
  rev.forEach((t, i) => { out.push(t); if (fi < fresh.length && (i + 1) % gap === 0) out.push({ kind: 'intro', id: fresh[fi++].id }); });
  while (fi < fresh.length) out.push({ kind: 'intro', id: fresh[fi++].id });
  out.push(...sen);
  return out;
}
/** call when a session starts for real (counts the day's streak and the new-word rhythm) */
export function startSession(G, tasks, today = '') {
  G.sessions++;
  if (tasks.some(t => t.kind === 'intro')) G.lastNewSession = G.sessions;
}
export function completeDaily(G, today = new Date().toLocaleDateString('sv-SE')) {
  if (G.streak.last === today) return G.streak;
  const y = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  G.streak.days = G.streak.last === y ? G.streak.days + 1 : 1;
  G.streak.last = today;
  return G.streak;
}

// ------------------------------------------------------------------ questions
const shuffle = (a, rng) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** pick k distractors: the higher the confidence, the more similar they are to the target */
function distractors(target, pool, conf, k, rng, sim = similarity) {
  const cands = pool.filter(w => w.id !== target.id && displayDe(w) !== displayDe(target)).map(w => ({ w, s: sim(target, w) })).sort((a, b) => a.s - b.s);
  if (cands.length <= k) return cands.map(c => c.w);
  const f = (Math.min(5, Math.max(1, conf)) - 1) / 4;                // 0 = most different, 1 = most similar
  const win = Math.max(k, Math.ceil(cands.length * 0.4));
  const start = Math.round(f * (cands.length - win));
  const slice = cands.slice(start, start + win).map(c => c.w);
  return shuffle(slice, rng).slice(0, k);
}
const wordPool = (G, C, target) => {
  const ids = new Set([...introduced(G), target.id]);
  let pool = C.words.filter(w => usable(w) && ids.has(w.id));
  if (pool.length < 6) pool = [...pool, ...C.words.filter(w => usable(w) && !ids.has(w.id) && w.ch <= target.ch)];   // early game: borrow from the same chapter
  return pool;
};

export function makeWordQuestion(G, C0, id, { rng = Math.random, forceConf, poolIds, pictures = true } = {}) {
  const C = mergeCustom(C0, G), w = C.byId[id];
  const conf = forceConf ?? (G.items[id]?.conf || 1);
  const n = conf <= 2 ? 2 : 3;                                      // wrong answers: fewer when beginning
  let pool = poolIds ? C.words.filter(x => poolIds.includes(x.id)) : wordPool(G, C, w);
  // picture questions for beginners: the picture carries the meaning, the learner picks the Japanese word
  const picPool = pool.filter(x => hasSprite(x.id));
  const pic = pictures && hasSprite(id) && conf <= 2 && picPool.length > n && rng() < (conf <= 1 ? 0.7 : 0.4);
  if (pic) {
    const opts = shuffle([w, ...distractors(w, picPool, conf, n, rng)], rng);
    return { kind: 'mc', type: 'pic2jp', id, conf, hideFuri: false, prompt: { pic: id }, options: opts.map(o => ({ jp: o.jp, id: o.id })), correct: id };
  }
  const type = conf <= 1 ? 'jp2de' : conf === 2 ? 'de2jp' : conf === 3 ? (rng() < 0.5 ? 'jp2de' : 'de2jp') : 'de2jp';
  const opts = shuffle([w, ...distractors(w, pool, conf, n, rng)], rng);
  return { kind: 'mc', type, id, conf, hideFuri: conf >= 4,
    prompt: type === 'jp2de' ? { jp: w.jp } : { de: displayDe(w) },
    options: opts.map(o => (type === 'jp2de' ? { de: displayDe(o), id: o.id } : { jp: o.jp, id: o.id })), correct: id };
}

const sentSim = (a, b) => (a.pattern === b.pattern ? 2 : 0) + a.words.filter(x => b.words.includes(x)).length;
export function makeSentenceQuestion(G, C0, sid, { rng = Math.random } = {}) {
  const C = mergeCustom(C0, G), s = C.sentences.find(x => x.id === sid);
  const conf = G.items['s:' + sid]?.conf || 1;
  const types = conf <= 1 ? ['s_jp2de'] : conf === 2 ? ['s_order', 's_de2jp'] : ['s_order', 's_de2jp', 's_jp2de'];
  const type = types[Math.floor(rng() * types.length)];
  if (type === 's_order') {
    const toks = s.jp.split(' ');
    const extra = conf >= 3 ? ['は', 'が', 'を', 'に', 'で'].filter(p => !toks.includes(p)).slice(0, 1) : [];
    return { kind: 'order', type, id: 's:' + sid, conf, prompt: { de: s.de }, answer: toks, chips: shuffle([...toks, ...extra], rng) };
  }
  let pool = C.sentences.filter(x => usable(x) && x.id !== sid && x.de !== s.de && x.jp !== s.jp);
  const known = pool.filter(x => x.words.every(id => isIntro(G, id)));          // wrong answers should only use words the learner has met
  pool = known.length >= 4 ? known : pool.filter(x => x.ch <= s.ch);
  const f = (conf - 1) / 4;
  const sorted = pool.map(x => ({ x, s: sentSim(s, x) + rng() * 0.5 })).sort((a, b) => a.s - b.s);
  const win = Math.max(3, Math.ceil(sorted.length * 0.4)), start = Math.round(f * (sorted.length - win));
  const wrong = shuffle(sorted.slice(start, start + win).map(c => c.x), rng).slice(0, 3);
  const opts = shuffle([s, ...wrong], rng);
  return { kind: 'mc', type, id: 's:' + sid, conf, hideFuri: conf >= 4, correct: 's:' + sid,
    prompt: type === 's_jp2de' ? { jp: s.jp } : { de: s.de },
    options: opts.map(o => (type === 's_jp2de' ? { de: o.de, id: 's:' + o.id } : { jp: o.jp, id: 's:' + o.id })) };
}

export function makeTask(G, C, task, opts) {
  if (task.kind === 'sentence') return { ...task, q: makeSentenceQuestion(G, C, task.id, opts) };
  return { ...task, q: makeWordQuestion(G, C, task.id, { ...opts, forceConf: task.kind === 'intro' ? 1 : undefined }) };
}
