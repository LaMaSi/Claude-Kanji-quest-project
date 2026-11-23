// World map, places, hint quiz ("where can I find …?") and notebook. Instant travel: tap a place, you are there – no transition screens.
import { CONTENT } from './data.js';
import * as E from './engine.js';
import { spriteEl } from './sprites.js';
import { drawMapArt } from './mapart.js';
import { displayDe } from './german.js';

export const hooks = { extras: null, badge: null };   // set by yokai.js (shops, yokai cards on the place screen, map badges)
export const openPlace = (id, replace = false) => A.setScreen(() => placeNode(id), { replace });
let A;   // api from app.js: G, setScreen, go, openSheet, closeSheet, btn, toast, gain, J, Jt, redraw
export const initWorld = api => { A = api; };
const G = () => A.G();
const W = id => CONTENT.byId[id];
const places = () => CONTENT.world.places;
const unlocked = p => G().lv >= p.lv;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** the map screen (also registered as NODES.map) */
export function mapNode() {
  return { art: null, noBanner: true, widgetTop: true, title: '{地図|ちず}', titleDe: 'Die Karte – tippe auf einen Ort', lines: [],
    widget: host => {
      const box = document.createElement('div'); box.className = 'mapbox'; const cv = document.createElement('canvas'); drawMapArt(cv, places()); box.appendChild(cv);
      box.insertAdjacentHTML('beforeend', '<div class="lcd"></div>');
      for (const p of places()) {
        const w = W(p.word), ok = unlocked(p), b = document.createElement('button'); b.className = 'pmark' + (ok ? '' : ' locked');
        b.style.left = p.x + '%'; b.style.top = p.y + '%';
        const sp = spriteEl(p.word, 32); if (sp) b.appendChild(sp);
        b.insertAdjacentHTML('beforeend', `<span class="jp">${ok ? A.J(w.jp) : '🔒 Lv ' + p.lv}</span>`);
        if (ok && hooks.badge?.(p.id)) b.insertAdjacentHTML('beforeend', '<span class="badge">!</span>');
        b.onclick = () => (ok ? A.setScreen(() => placeNode(p.id)) : A.toast(`Dieser Ort öffnet sich ab Level ${p.lv}`));
        box.appendChild(b);
      }
      host.appendChild(box);
    },
    choices: [{ t: 'ばしょ クイズ', de: 'Orts-Quiz: Wo gibt es was?', fn: () => { startPlaceQuiz(); } }, { t: 'ノート', de: 'Notizbuch ansehen', fn: () => { A.openSheet(notebookSheet); } }, { t: '{妖怪図鑑|ようかいずかん}', de: 'Yokai-Dex', fn: () => { A.openSheet(hooks.dex); } }] };
}

function placeNode(id) {
  const p = places().find(x => x.id === id), w = W(p.word);
  const things = [...p.items.map(i => ['item', i]), ...p.animals.map(i => ['animal', i])];
  return { art: p.art, title: w.jp, titleDe: `${displayDe(w)} – ${w.deLoc}`, widgetTop: true,
    lines: [{ say: things.length ? 'Hier findest du:' : 'Hier gibt es nicht viel zu sehen.' }],
    widget: host => {
      hooks.extras?.(host, p);
      if (!things.length) return;
      const grid = document.createElement('div'); grid.className = 'pgrid'; host.appendChild(grid);
      for (const [kind, wid] of things) {
        const ww = W(wid), card = document.createElement('div'); card.className = 'pcard'; const sp = spriteEl(wid, 64); if (sp) card.appendChild(sp);
        card.insertAdjacentHTML('beforeend', `<div class="jp tok-wrap">${A.Jt(ww.jp)}</div>${G().help ? `<div class="de">${displayDe(ww)}${kind === 'animal' ? ' (Tier)' : ''}</div>` : ''}`);
        grid.appendChild(card);
      }
    },
    choices: [{ t: '{地図|ちず}', de: 'Zurück zur Karte', go: 'map' }, { t: 'クイズ', de: 'Orts-Quiz', fn: () => { startPlaceQuiz(); } }] };
}

// ---------------------------------------------------------------- hint quiz
function makeQuestions(n = 6) {
  const open = places().filter(unlocked), hints = CONTENT.sentences.filter(s => s.pattern === 'p_item_place' && open.some(p => s.words.includes(p.word)));
  const qs = [];
  for (let i = 0; i < n; i++) {
    const kind = i % 2 === 0 && hints.length ? 'hint' : 'name';
    const target = open[Math.floor(Math.random() * open.length)];
    if (kind === 'hint') {
      const s = hints[Math.floor(Math.random() * hints.length)], placeWord = s.words.find(id => (W(id).tags || []).includes('place')), itemWord = s.words.find(id => id !== placeWord);
      qs.push({ kind, s, answer: placeWord, item: itemWord, opts: shuffle([placeWord, ...shuffle(open.map(p => p.word).filter(x => x !== placeWord)).slice(0, 3)]) });
    } else qs.push({ kind, answer: target.word, opts: shuffle([target.word, ...shuffle(open.map(p => p.word).filter(x => x !== target.word)).slice(0, 3)]) });
  }
  return qs;
}
export function startPlaceQuiz() {
  const qs = makeQuestions(), st = { i: 0, ok: 0 }; let started = false;
  const show = fn => { A.setScreen(fn, { replace: started, confirm: 'Quiz beenden?' }); started = true; };
  const step = () => {
    if (st.i >= qs.length) return finish();
    const q = qs[st.i];
    show(() => ({ art: null, noBanner: true, title: `ばしょ クイズ　${st.i + 1}/${qs.length}`, titleDe: 'Orts-Quiz', lines: [],
      widget: host => {
        const box = document.createElement('div'); box.className = 'q'; host.appendChild(box);
        if (q.kind === 'hint') { const sp = spriteEl(q.item, 72); box.appendChild(sp); box.insertAdjacentHTML('beforeend', `<div class="jp" style="font-size:1.4rem;margin-top:6px">${A.Jt(q.s.jp)}</div><div class="de">Wo gibt es das? Tippe auf einen Wort für die Übersetzung.</div>`.replace('einen Wort', 'ein Wort')); }
        else { const sp = spriteEl(q.answer, 96); box.appendChild(sp); box.insertAdjacentHTML('beforeend', '<div class="de">Wie heißt dieser Ort?</div>'); }
        const wrap = document.createElement('div'); wrap.className = 'opts'; host.appendChild(wrap);
        const btns = q.opts.map(o => A.btn(wrap, `<span class="jp">${A.J(W(o).jp)}</span>${G().help ? `<small>${displayDe(W(o))}</small>` : ''}`, () => {
          const ok = o === q.answer; btns[q.opts.indexOf(o)].classList.add(ok ? 'ok' : 'no'); btns.forEach(b => { b.disabled = true; });
          E.recordAnswer(G(), q.answer, ok); if (ok) { st.ok++; if (q.kind === 'hint' && !G().notes.includes(q.s.id)) G().notes.push(q.s.id); }
          const fb = document.createElement('div'); fb.className = 'kmsg'; fb.innerHTML = ok ? '✔ richtig' : `✘ ${A.J(W(q.answer).jp)} = ${displayDe(W(q.answer))}`; host.appendChild(fb);
          if (ok) setTimeout(() => { st.i++; step(); }, 600); else A.btn(host, 'Weiter ▸', () => { st.i++; step(); }, 'primary');
        }));
      }, choices: [] }));
  };
  const finish = () => {
    const xp = st.ok * 3, gold = st.ok * 4; A.gain(xp, gold); A.save();
    A.setScreen(() => ({ art: 'board', noBanner: true, title: 'おつかれさま！', titleDe: 'Geschafft!', lines: [{ say: `${st.ok} von ${qs.length} richtig. +${xp} XP, +${gold} 円. Neue Hinweise stehen im Notizbuch.` }],
      choices: [{ t: 'もう いちど', de: 'Noch ein Quiz', fn: () => { startPlaceQuiz(); } }, { t: '{地図|ちず}', de: 'Zur Karte', go: 'map' }] }), { replace: true });
  };
  step();
}

export function notebookSheet(s) {
  const g = G(), hand = g.diaryFont !== 'normal';
  s.innerHTML = `<h2>${A.lbl('ノート', 'Notizbuch: gelernte Hinweise')}</h2>`;
  const row = document.createElement('div'); row.className = 'row'; row.style.marginBottom = '10px';
  A.btn(row, hand ? 'Schrift: Handschrift ✎' : 'Schrift: Normal', () => { g.diaryFont = hand ? 'normal' : 'hand'; A.save(); A.openSheet(notebookSheet); }, 'small'); s.appendChild(row);
  const page = document.createElement('div'); if (hand) page.className = 'hand'; s.appendChild(page);
  const notes = g.notes.map(id => CONTENT.sentences.find(x => x.id === id)).filter(Boolean);
  if (!notes.length) page.insertAdjacentHTML('beforeend', '<div class="de">Noch leer. Löse das Orts-Quiz, dann stehen die Hinweise hier.</div>');
  for (const n of notes) {
    const d = document.createElement('div'); d.className = 'line'; d.innerHTML = `<div class="body"><div class="jp">${A.Jt(n.jp)}</div>${g.help ? `<div class="de">${n.de}</div>` : ''}</div>`; page.appendChild(d);
  }
  A.btn(s, 'Schließen', A.closeSheet);
}
