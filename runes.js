// Kanji-Zauber: gamified kanji lessons (5 runes per lesson: meet → quiz → write) and the random "five kanji" drawing round.
// Data: content/runes.json. Progress: G.runes[c] = { s: 0..3 stars, miss }, G.runeLessons[id] = best stars (1..3).
import { CONTENT } from './data.js';
import { drawKanji, playStrokeOrder } from './kanji.js';

let A;
export const initRunes = api => { A = api; };
const G = () => A.G();
const LESSONS = CONTENT.runes.lessons;
const ALL = LESSONS.flatMap(l => l.runes.map(r => ({ ...r, lesson: l.id })));
const BY = Object.fromEntries(ALL.map(r => [r.c, r]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (pool, n, not) => shuffle(pool.filter(x => !not(x))).slice(0, n);
const rs = c => (G().runes ||= {})[c] ||= { s: 0, miss: 0 };
const done = id => (G().runeLessons ||= {})[id] || 0;
const unlocked = id => id === 1 || done(id - 1) > 0;
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const jpOf = r => A.J(r.jp);
export const nextLesson = () => LESSONS.find(l => !done(l.id));

// ------------------------------------------------------------------ overview
export function runeHome() {
  A.setScreen(() => ({ art: 'home', title: '{漢字|かんじ}の まほう', titleDe: 'Kanji-Zauber',
    lines: [{ say: 'Jede Lektion zeigt dir fünf Zeichen: kennenlernen, Zauberprobe, dann aufschreiben.' }],
    widget: host => {
      host.innerHTML = '';
      A.btn(host, `${A.J('{五|いつ}つの {漢字|かんじ}')}<small>Fünf Kanji</small>`, () => fiveKanji(), 'primary');
      A.btn(host, `${A.J('{魔法|まほう}の {学校|がっこう}')}<small>Zauberschule</small>`, () => A.spellSchool());
      for (const l of LESSONS) {
        const ok = unlocked(l.id), b = A.btn(host, `<span class="jp">${l.runes.map(r => r.c).join(' ')}</span><small>Lektion ${l.id} · ${ok ? stars(done(l.id)) : '🔒'}</small>`, () => lesson(l), done(l.id) ? 'ok' : '');
        b.disabled = !ok;
      }
      const bk = document.createElement('div'); bk.className = 'grid'; bk.style.marginTop = '14px'; host.appendChild(bk);
      for (const r of ALL) { const s = rs(r.c).s; const b = A.btn(bk, `<span class="jp">${r.c}</span><small class="de">${s ? stars(s) : '·'}</small>`, () => showRune(r), s >= 3 ? 'ok' : ''); b.style.opacity = s ? 1 : .55; }
    },
    choices: [{ t: 'もどる', de: 'Zurück', fn: () => A.navigateBack() }] }));
}
function showRune(r) {
  A.setScreen(() => ({ art: null, noBanner: true, title: r.jp, titleDe: r.de, lines: [], widget: host => playStrokeOrder(host, r.c, () => A.navigateBack(), 'Strichfolge'), choices: [] }));
}

// ------------------------------------------------------------------ lesson
function lesson(l) {
  const runes = l.runes, st = { miss: 0 }, steps = [];
  for (const r of runes) steps.push({ t: 'meet', r });
  const qs = [];
  for (const r of runes) { qs.push({ t: 'meaning', r }); qs.push({ t: Math.random() < .5 ? 'glyph' : 'reading', r }); }
  steps.push(...shuffle(qs));
  for (const r of shuffle(runes)) steps.push({ t: 'write', r });
  let i = 0, started = false;
  const total = () => steps.length;
  const show = fn => { A.setScreen(fn, { replace: started, confirm: 'Lektion beenden?' }); started = true; };
  const next = () => { i++; run(); };
  const head = k => ({ art: null, noBanner: true, title: '{漢字|かんじ}の まほう', titleDe: `Lektion ${l.id} · ${Math.min(i + 1, total())}/${total()}`, lines: [], ...k });
  function run() {
    if (i >= steps.length) return finish();
    const s = steps[i], r = s.r;
    if (s.t === 'meet') show(() => head({ widgetTop: true,
      widget: host => { host.innerHTML = '<div class="q intro"><div class="de">Neues Zeichen</div></div>'; const box = host.firstChild;
        box.insertAdjacentHTML('beforeend', `<span class="jp big" style="font-size:3rem">${r.c}</span><div class="de" style="font-size:1.15rem;color:var(--fg)">${r.de}</div><div class="de"><span class="jp">${jpOf(r)}</span></div>`);
        const h = document.createElement('div'); box.appendChild(h);
        playStrokeOrder(h, r.c, () => { G().kanjiSeen[r.c] = 1; rs(r.c).s = Math.max(rs(r.c).s, 1); A.save(); next(); }, 'Strichfolge'); } }));
    else if (s.t === 'write') show(() => head({ titleDe: `Lektion ${l.id} · ${i + 1}/${total()} · Aufschreiben`, lines: [{ say: `Schreibe: <b>${r.de}</b> – <span class="jp">${jpOf(r)}</span>` }],
      widget: host => drawKanji(host, r.c, ok => { if (ok) { G().kanji[r.c] = 1; rs(r.c).s = Math.max(rs(r.c).s, 3); A.save(); } next(); }, 'Zeichne den 1. Strich') }));
    else show(() => head({ widget: host => question(host, s, l, ok => { if (!ok) { st.miss++; rs(r.c).miss++; if (!s.again) steps.push({ ...s, again: true }); } else rs(r.c).s = Math.max(rs(r.c).s, 2); A.save(); next(); }) }));
  }
  function finish() {
    const n = st.miss <= 1 ? 3 : st.miss <= 3 ? 2 : 1, first = !done(l.id);
    G().runeLessons[l.id] = Math.max(done(l.id), n);
    A.gain(first ? 15 + n * 5 : 5, first ? 30 : 0); A.save();
    const nx = LESSONS.find(x => x.id === l.id + 1);
    A.setScreen(() => ({ art: 'home', noBanner: true, title: 'おつかれさま！', titleDe: 'Geschafft!',
      lines: [{ who: '{狸|たぬき} {先生|せんせい}', pic: 'tanuki', t: 'すごい！', de: 'Toll!' },
        { say: `${l.runes.map(r => `<span class="jp">${r.c}</span>`).join(' ')}<br>${stars(n)} · ${st.miss} Fehler.${first ? ` +${15 + n * 5} XP, +30 円.` : ''}` }],
      choices: [...(nx ? [{ t: 'つぎへ', de: `Lektion ${nx.id}`, cls: 'primary', fn: () => lesson(nx) }] : []), { t: 'もどる', de: 'Zurück', fn: () => runeHome() }] }), { replace: true });
  }
  run();
}

/** multiple-choice question about one rune */
function question(host, s, l, done) {
  const r = s.r, pool = ALL.filter(x => x.c !== r.c), near = l.runes.filter(x => x.c !== r.c);
  const others = n => shuffle([...pick(near, 2, () => false), ...pick(pool, 6, x => near.includes(x))]).slice(0, n);
  let prompt, opts;
  if (s.t === 'meaning') { prompt = `<span class="jp big" style="font-size:4rem">${r.c}</span><div class="de">Was bedeutet das?</div>`; opts = [r, ...others(3)].map(x => ({ x, html: x.de })); }
  else if (s.t === 'glyph') { prompt = `<div style="font-size:1.4rem;color:var(--fg)">${r.de}</div><div class="de">Welches Zeichen ist das?</div>`; opts = [r, ...others(3)].map(x => ({ x, html: `<span class="jp" style="font-size:2rem">${x.c}</span>` })); }
  else { prompt = `<span class="jp big" style="font-size:4rem">${r.c}</span><div class="de">Wie liest man das? (in diesem Wort)</div>`; opts = [r, ...others(3)].map(x => ({ x, html: `<span class="jp">${jpOf(x)}</span>` })); }
  host.innerHTML = ''; const box = document.createElement('div'); box.className = 'q'; box.innerHTML = prompt; host.appendChild(box);
  const wrap = document.createElement('div'); wrap.className = 'opts'; host.appendChild(wrap);
  const btns = shuffle(opts).map(o => { const b = A.btn(wrap, o.html, () => { const ok = o.x === r; btns.forEach(x => x.disabled = true); b.classList.add(ok ? 'ok' : 'no'); fb(ok); }); return b; });
  function fb(ok) {
    const m = document.createElement('div'); m.className = 'kmsg'; m.innerHTML = ok ? '✔ richtig' : `✘ <span class="jp">${r.c}</span> = ${r.de} · <span class="jp">${jpOf(r)}</span>`; host.appendChild(m);
    if (ok) setTimeout(() => done(true), 600); else A.btn(host, 'Weiter ▸', () => done(false), 'primary');
  }
}

// ------------------------------------------------------------------ five random kanji
export function fiveKanji() {
  const pool = ALL.map(r => ({ r, w: 3.5 - rs(r.c).s + rs(r.c).miss * .3 + Math.random() * 2 })).sort((a, b) => b.w - a.w).slice(0, 5).map(x => x.r);
  const set = shuffle(pool); let i = 0, ok = 0, started = false;
  const show = fn => { A.setScreen(fn, { replace: started, confirm: 'Runde beenden?' }); started = true; };
  const step = () => {
    if (i >= set.length) return end();
    const r = set[i], seen = G().kanjiSeen[r.c];
    const draw = () => show(() => ({ art: null, noBanner: true, title: '{五|いつ}つの {漢字|かんじ}', titleDe: `Fünf Kanji · ${i + 1}/5`, lines: [{ say: `Schreibe: <b>${r.de}</b> – <span class="jp">${jpOf(r)}</span>` }],
      widget: host => drawKanji(host, r.c, good => { if (good) { ok++; G().kanji[r.c] = 1; rs(r.c).s = Math.max(rs(r.c).s, 3); A.save(); } i++; step(); }, 'Zeichne den 1. Strich') }));
    if (seen) draw(); else show(() => ({ art: null, noBanner: true, title: '新しい漢字', titleDe: `Fünf Kanji · ${i + 1}/5 · Strichfolge`, lines: [{ say: `<b>${r.de}</b> – <span class="jp">${jpOf(r)}</span>` }],
      widget: host => playStrokeOrder(host, r.c, () => { G().kanjiSeen[r.c] = 1; rs(r.c).s = Math.max(rs(r.c).s, 1); A.save(); draw(); }, 'Strichfolge'), choices: [] }));
  };
  const end = () => {
    A.gain(8 + ok * 2, ok >= 3 ? 10 : 0); A.save();
    A.setScreen(() => ({ art: 'home', noBanner: true, title: 'おつかれさま！', titleDe: 'Geschafft!',
      lines: [{ who: '{狸|たぬき} {先生|せんせい}', pic: 'tanuki', t: 'よく できました！', de: 'Gut gemacht!' }, { say: `${set.map(r => `<span class="jp">${r.c}</span>`).join(' ')}<br>${ok} von 5 ganz geschrieben.` }],
      choices: [{ t: 'もう いちど', de: 'Noch einmal', cls: 'primary', fn: () => fiveKanji() }, { t: 'もどる', de: 'Zurück', fn: () => runeHome() }] }), { replace: true });
  };
  step();
}
