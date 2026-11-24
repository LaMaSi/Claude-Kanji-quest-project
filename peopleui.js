// Character editor (learn the words for face parts, colours and clothes) and the "who is this?" quest.
// Both use the same description sentences: "<part> は <adjective> です。", built from the words in content/words.json (see german.js describe()).
import { drawPortrait, drawBody, DEFAULT_LOOK, OPTIONS, randomLook } from './people.js';
import { CONTENT } from './data.js';
import { describe, optionLabel } from './german.js';

let A;   // api from app.js: G(), save, setScreen, go, btn, toast, J, Jt, gain, NODES
export const initPeople = api => { A = api; };
const G = () => A.G();
const W = id => CONTENT.byId[id];

const CLOTH_WORD = { red: 'akai', blue: 'aoi', green: 'midori', yellow: 'kiiroi', white: 'shiroi', black: 'kuroi', brown: 'chairo' };
const colorOpts = keys => keys.map(k => [k, CLOTH_WORD[k]]);
export const FACE_FEATURES = [
  { key: 'hairLen', part: 'kami', hint: 'Haarlänge', opts: [['short', 'mijikai'], ['long', 'nagai']] },
  { key: 'hairType', part: 'kami', hint: 'Haartyp', opts: [['straight', 'massugu'], ['curly', 'makige'], ['wavy', 'weibu']] },
  { key: 'hair', part: 'kami', hint: 'Haarfarbe', opts: [['black', 'kuroi'], ['brown', 'chairo'], ['blond', 'kiniro'], ['white', 'shiroi'], ['red', 'akai'], ['purple', 'murasaki'], ['pink', 'pinku'], ['blue', 'aoi'], ['green', 'midori']] },
  { key: 'eyeSize', part: 'me', hint: 'Augengröße', opts: [['big', 'ookii'], ['small', 'chiisai'], ['narrow', 'hosoi']] },
  { key: 'eyeColor', part: 'me', hint: 'Augenfarbe', opts: [['black', 'kuroi'], ['brown', 'chairo'], ['blue', 'aoi'], ['green', 'midori']] },
  { key: 'brows', part: 'mayuge', hint: 'Augenbrauen', opts: [['thick', 'futoi'], ['thin', 'hosoi']] },
  { key: 'nose', part: 'hana', hint: 'Nase', opts: [['big', 'ookii'], ['small', 'chiisai'], ['high', 'takai'], ['low', 'hikui']] },
  { key: 'mouth', part: 'kuchi', hint: 'Mund', opts: [['open', 'aiteimasu'], ['closed', 'tojite']] },
  { key: 'face', part: 'kao', hint: 'Gesichtsform', opts: [['round', 'marui'], ['square', 'shikakui'], ['long', 'nagai']] },
];
const bottomPart = look => (look.bottom === 'skirt' ? 'sukaato' : 'zubon');
export const CLOTH_FEATURES = [
  { key: 'hat', part: 'boushi', hint: 'Mütze', opts: [[null, null], ...colorOpts(['red', 'blue', 'green', 'yellow', 'white', 'black'])] },
  { key: 'shirt', part: 'shatsu', hint: 'Oberkörper', opts: colorOpts(['red', 'blue', 'green', 'yellow', 'white', 'black']) },
  { key: 'bottom', part: null, hint: 'Beine', opts: [['trousers', 'zubon'], ['skirt', 'sukaato']], noSentence: true },
  { key: 'bottomColor', part: look => bottomPart(look), hint: 'Beinfarbe', opts: colorOpts(['red', 'blue', 'green', 'yellow', 'white', 'black']) },
  { key: 'shoes', part: 'kutsu', hint: 'Schuhe', opts: [['black', 'kuroi'], ['brown', 'chairo'], ['white', 'shiroi']] },
];

/** the Japanese + German sentence for one feature of a look (null when there is nothing to say) */
export function featureSentence(look, f) {
  if (f.noSentence) return null;
  const val = look[f.key], opt = f.opts.find(o => o[0] === val);
  if (!opt || !opt[1]) return null;
  const part = typeof f.part === 'function' ? f.part(look) : f.part;
  return describe(W(part), W(opt[1]));
}
/** portraits: `size` = display width in px; full bodies: `size` = integer pixel scale */
const lookCanvas = (look, size, body) => { const c = body ? drawBody(look) : drawPortrait(look); c.className = 'sprite'; if (body) { c.style.width = c.width * size + 'px'; c.style.height = c.height * size + 'px'; } else { c.style.width = size + 'px'; c.style.height = Math.round(size * c.height / c.width) + 'px'; } return c; };
function sentenceLine(parent, s) {
  const d = document.createElement('div'); d.className = 'line'; d.innerHTML = `<div class="body"><div class="jp">${A.Jt(s.jp)}</div>${A.G().help ? `<div class="de">${s.de}</div>` : ''}</div>`;
  const b = document.createElement('button'); b.className = 'spk'; b.textContent = '🔊'; b.onclick = () => A.speak(s.jp); d.querySelector('.body').prepend(b); b.style.cssText = 'float:right';
  parent.appendChild(d); return d;
}

// ------------------------------------------------------------------ editor
export function openEditor() {
  const g = G(); if (!g.avatar) g.avatar = { ...DEFAULT_LOOK };
  const st = { page: 'face', feat: 'hairLen', last: null };
  const done = () => { g.flags.editorSeen = 1; A.save(); A.navigateBack(); };
  const node = () => {
    const feats = st.page === 'face' ? FACE_FEATURES : CLOTH_FEATURES, f = feats.find(x => x.key === st.feat) || feats[0];
    return { art: null, noBanner: true, title: 'キャラクター', titleDe: 'Charakter', lines: [], widget: host => build(host, st, feats, f), choices: [] };
  };
  A.setScreen(node);
  function build(host, st, feats, f) {
    const g = G(), look = g.avatar;
    // the portrait stays in view while you scroll; the sentence of the last change sits next to it
    const sticky = document.createElement('div'); sticky.className = 'edtop';
    const pic = document.createElement('div'); pic.appendChild(lookCanvas(look, st.page === 'face' ? 118 : 1.6, st.page !== 'face')); sticky.appendChild(pic);
    const side = document.createElement('div'); side.className = 'edside'; sticky.appendChild(side);
    if (st.last) sentenceLine(side, st.last); else side.innerHTML = '<div class="de">Wähle unten eine Eigenschaft – hier erscheint ihr Satz.</div>';
    host.appendChild(sticky);
    // one small row: page switch + description + done
    const bar = document.createElement('div'); bar.className = 'edbar';
    for (const [k, label] of [['face', 'Gesicht'], ['cloth', 'Kleidung']]) { const b = A.btn(bar, label, () => { st.page = k; st.feat = (k === 'face' ? FACE_FEATURES : CLOTH_FEATURES)[0].key; st.last = null; A.redraw(); }, 'small'); if (st.page === k) b.classList.add('ok'); }
    A.btn(bar, `${A.J('{説明|せつめい}')}${g.help ? '<small>Beschreibung</small>' : ''}`, allSentences, 'small');
    A.btn(bar, `${A.J('おわり')}${g.help ? '<small>Fertig</small>' : ''}`, done, 'small');
    host.appendChild(bar);
    // feature chips
    const chips = document.createElement('div'); chips.className = 'row'; chips.style.cssText = 'margin-bottom:8px;justify-content:center';
    for (const x of feats) { const part = typeof x.part === 'function' ? x.part(look) : x.part; const b = document.createElement('button'); b.className = 'chipw'; b.style.cssText = 'padding:8px 12px;min-height:48px;text-align:center' + (x.key === f.key ? ';border-color:var(--amber);color:var(--amber)' : '');
      b.innerHTML = `${part ? `<span class="jp" style="font-size:1.15rem">${A.J(W(part).jp)}</span>` : ''}<small style="margin:0;font-size:.7rem">${x.hint}</small>`; b.onclick = () => { st.feat = x.key; st.last = null; A.redraw(); }; chips.appendChild(b); }
    host.appendChild(chips);
    // options (bottom: thumb zone). The German label is the meaning for THIS body part (高い at the nose = markant, not "teuer").
    const wrap = document.createElement('div'); wrap.className = 'opts'; wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto';
    const part = typeof f.part === 'function' ? f.part(look) : f.part;
    for (const [val, wid] of f.opts) {
      const de = wid ? (part ? optionLabel(W(part), W(wid)) : W(wid).de) : 'keine';
      const b = A.btn(wrap, wid ? `<span class="jp" style="font-size:1.3rem">${A.J(W(wid).jp)}</span>${g.help ? `<small>${de}</small>` : ''}` : `<span class="jp" style="font-size:1.3rem">${A.J('なし')}</span>${g.help ? '<small>keine</small>' : ''}`, () => {
        look[f.key] = val; if (f.key === 'bottom') look.bottomColor = look.bottomColor || 'black';
        st.last = featureSentence(look, f); A.save(); A.redraw();
      }, look[f.key] === val ? 'ok' : '');
      b.style.textAlign = 'center';
    }
    host.appendChild(wrap);
  }
  function allSentences() {
    A.openSheet(s => {
      s.innerHTML = `<h2>${A.lbl('{説明|せつめい}', 'Beschreibung deiner Figur')}</h2>`; const look = G().avatar;
      for (const f of [...FACE_FEATURES, ...CLOTH_FEATURES]) { const x = featureSentence(look, f); if (x) sentenceLine(s, x); }
      A.btn(s, 'Schließen', A.closeSheet);
    });
  }
}

// ------------------------------------------------------------------ quest: who is this?
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const QUEST_FACE = FACE_FEATURES.map(f => f.key), QUEST_OUTFIT = ['hat', 'shirt', 'bottomColor', 'shoes'];

/** how many features are described and how alike the wrong people are: grows with the number of finished quests */
export const questLevel = () => Math.min(5, 1 + Math.floor((G().pq?.done || 0) / 3));

export function makeSearch(variant, level = questLevel()) {
  const pool = variant === 'face' ? FACE_FEATURES : CLOTH_FEATURES, keys = variant === 'face' ? QUEST_FACE : QUEST_OUTFIT;
  const target = randomLook(Math.random); target.hat = variant === 'outfit' && Math.random() < 0.7 ? OPTIONS.hat[1 + rnd(6)] : (variant === 'outfit' ? null : target.hat);
  if (variant === 'face') target.hat = null;
  // describe 2..4 features (hat only if the person wears one)
  const usable = shuffle(keys.filter(k => !(k === 'hat' && !target.hat)));
  const described = usable.slice(0, Math.min(usable.length, 1 + Math.min(level, 3)));
  const feats = described.map(k => pool.find(f => f.key === k));
  const cands = [{ look: target, ok: true }];
  while (cands.length < 4) {
    const l = randomLook(Math.random);                       // everything not described is random
    for (const k of described) l[k] = target[k];
    if (variant === 'face') l.hat = null; else if (!described.includes('hat')) l.hat = Math.random() < 0.5 ? OPTIONS.hat[1 + rnd(6)] : null;
    if (variant === 'outfit') l.bottom = target.bottom;      // garment type is part of the description
    // change `changes` described features (all of them at level 1, only one at level 5)
    const changes = Math.max(1, Math.min(described.length, level >= 5 ? 1 : level >= 3 ? 2 : described.length));
    for (const k of shuffle(described).slice(0, changes)) {
      const opts = (variant === 'face' ? OPTIONS[k] : OPTIONS[k]).filter(v => v !== target[k] && (k !== 'hat' || v !== null)); l[k] = opts[rnd(opts.length)];
    }
    cands.push({ look: l, ok: false });
  }
  return { variant, target, feats, level, cands: shuffle(cands), sentences: feats.map(f => featureSentence(target, f)).filter(Boolean) };
}

export function startSearch(variant, replace = false) {
  const q = makeSearch(variant); let answered = false, msg = '';
  const title = '{人探|ひとさが}し';
  const node = () => ({ art: null, noBanner: true, title, titleDe: variant === 'face' ? 'Personensuche: Gesicht' : 'Personensuche: Kleidung',
    lines: [{ say: 'Tippe die Person an, die zur Beschreibung passt. Tippe auf ein Wort für die Übersetzung.' }, { who: '{誰|だれ}', t: 'この {人|ひと} は {誰|だれ} ですか？', de: 'Wer ist diese Person?' }],
    widget: host => {
      for (const s of q.sentences) sentenceLine(host, s);
      const grid = document.createElement('div'); grid.style.cssText = `display:grid;grid-template-columns:repeat(${variant === 'face' ? 2 : 4},1fr);gap:8px;margin-top:auto;padding-top:10px`;
      q.cands.forEach(c => {
        const b = document.createElement('button'); b.className = 'pcard'; b.style.cssText = 'padding:8px;min-width:0;display:flex;justify-content:center;align-items:center';
        const cv = lookCanvas(c.look, variant === 'face' ? 150 : 2, variant !== 'face'); cv.style.margin = '0'; b.appendChild(cv);
        if (answered && c.ok) b.style.borderColor = 'var(--green)'; if (c.picked) b.style.borderColor = c.ok ? 'var(--green)' : 'var(--red)';
        b.onclick = () => {
          if (answered) return; answered = true; c.picked = true;
          const g = G(); g.pq = g.pq || { done: 0 };
          if (c.ok) { g.pq.done++; const gold = 15 + 10 * q.level; A.gain(6 + 2 * q.level, gold); msg = `✔ Richtig! +${gold} 円`; }
          else {
            const miss = q.feats.filter(f => c.look[f.key] !== q.target[f.key]).map(f => featureSentence(c.look, f)).filter(Boolean);
            msg = '✘ Nicht ganz. Bei dieser Person gilt: ' + (miss.map(m => m.de).join(' ') || '–'); g.pq.miss = (g.pq.miss || 0) + 1;
          }
          A.save(); A.redraw();
        };
        grid.appendChild(b);
      });
      host.appendChild(grid);
      if (msg) { const m = document.createElement('div'); m.className = 'kmsg'; m.textContent = msg; host.appendChild(m); }
    },
    choices: answered ? [{ t: 'もう いちど', de: 'Noch einmal', fn: () => { startSearch(variant === 'face' ? 'outfit' : 'face', true); } }, { t: 'もどる', de: 'Zurück', go: 'board' }] : [{ t: 'もどる', de: 'Zurück', go: 'board' }] });
  A.setScreen(node, { replace });
}
