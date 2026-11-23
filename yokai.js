// Yokai friendships: meet -> understand the wish -> ask the villagers -> shop -> give the gift -> friend (Dex entry, lore card, reward).
// All data comes from content/yokai.json and content/world.json; the Japanese sentences are the generated (reviewed) game sentences.
import { CONTENT } from './data.js';
import * as E from './engine.js';
import { spriteEl } from './sprites.js';
import { displayDe } from './german.js';
import { openPlace, hooks } from './world.js';
import { num } from './lang.js';

let A;   // api from app.js
export const initYokai = api => { A = api; hooks.extras = placeExtras; hooks.badge = badgeFor; hooks.dex = dexSheet; };
const G = () => A.G();
const W = id => CONTENT.byId[id];
const ys = () => CONTENT.yokai, wd = () => CONTENT.world;
const place = id => wd().places.find(p => p.id === id);
const state = id => ((G().yokai ||= {})[id] ||= { stage: 0 });
const sentence = (w0, w1, pat) => CONTENT.sentences.find(s => s.words[0] === w0 && s.words[1] === w1 && (!pat || s.pattern === pat));
const kudasai = y => CONTENT.sentences.find(s => s.pattern === 'p_N_wo_kudasai' && s.words[0] === y.item);
const dozo = y => CONTENT.sentences.find(s => s.pattern === 'p_dozo_item' && s.words[0] === y.item);
const hints = y => [sentence(place(y.shop.place).word, y.shop.building), sentence(y.item, y.shop.building, 'p_item_place')];
const NPC = ['hito', 'obaasan', 'ojiisan', 'okamisan', 'tenshu', 'kodomo'];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const here = pid => ys().filter(y => y.place === pid && G().lv >= place(pid).lv);
const badgeFor = pid => here(pid).some(y => state(y.id).stage < 3);
const note = s => { if (s && !G().notes.includes(s.id)) G().notes.push(s.id); };
const cardWord = (wid, size = 56) => { const d = document.createElement('div'); d.style.textAlign = 'center'; const sp = spriteEl(wid, size); if (sp) d.appendChild(sp); d.insertAdjacentHTML('beforeend', `<div class="jp" style="font-size:1.15rem">${A.J(W(wid).jp)}</div>${G().help ? `<div class="de">${displayDe(W(wid))}</div>` : ''}`); return d; };
const line = (who, s, pic) => ({ who, t: s.jp, de: s.de, pic });

// ---------------------------------------------------------------- on the place screen: yokai + shops
function placeExtras(host, p) {
  const list = here(p.id);
  for (const y of list) {
    const s = state(y.id), card = document.createElement('div'); card.className = 'ycard';
    const sp = spriteEl('y_' + y.id, 72); if (sp) { if (s.stage < 3) sp.classList.add('sil'); card.appendChild(sp); }
    const info = document.createElement('div'); info.className = 'yinfo'; card.appendChild(info);
    info.insertAdjacentHTML('beforeend', `<div class="jp" style="font-size:1.25rem">${s.stage === 0 ? '？？？' : A.J(y.jp)}</div>`);
    const say = t => info.insertAdjacentHTML('beforeend', `<div class="de" style="color:var(--fg)">${t}</div>`);
    const act = (label, fn, cls = 'small') => A.btn(info, label, fn, cls);
    if (s.stage === 0) { say('Etwas regt sich hier …'); act('話す　Ansprechen', () => encounter(y.id)); }
    else if (s.stage === 1) { say(`${y.de} wünscht sich: ${displayDe(W(y.item))}. Frag die Leute, wo es das gibt.`); act('Leute fragen', () => askVillagers(y.id)); }
    else if (s.stage === 2) {
      const has = (G().inv[y.item] || 0) > 0, pl = place(y.shop.place);
      say(has ? `Du hast ${displayDe(W(y.item))} dabei.` : `Besorge ${displayDe(W(y.item))}: ${W(pl.word).deLoc}, ${W(y.shop.building).deLoc}.`);
      if (has) act('どうぞ　Geschenk geben', () => gift(y.id), 'small primary'); else act('Hinweise ansehen', () => A.openSheet(ss => notesFor(ss, y)));
    } else { say('Freund ✔'); act('Eintrag ansehen', () => A.openSheet(ss => dexEntry(ss, y))); }
    host.appendChild(card);
  }
  const shops = (p.shops || []);
  if (shops.length) {
    const h = document.createElement('div'); h.className = 'de'; h.style.margin = '10px 0 4px'; h.textContent = 'Läden und Häuser:'; host.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'pgrid'; host.appendChild(grid);
    for (const sh of shops) {
      const c = document.createElement('button'); c.className = 'pcard'; const sp = spriteEl(sh.word, 64); if (sp) c.appendChild(sp);
      c.insertAdjacentHTML('beforeend', `<div class="jp">${A.J(W(sh.word).jp)}</div>${G().help ? `<div class="de">${displayDe(W(sh.word))}</div>` : ''}`);
      c.onclick = () => A.setScreen(() => shopNode(p, sh)); grid.appendChild(c);
    }
  }
}
function notesFor(s, y) {
  s.innerHTML = `<h2>${A.J(y.jp)}: Hinweise</h2>`;
  for (const h of [kudasai(y), ...hints(y)].filter(Boolean)) { const d = document.createElement('div'); d.className = 'line'; d.innerHTML = `<div class="body"><div class="jp">${A.Jt(h.jp)}</div>${G().help ? `<div class="de">${h.de}</div>` : ''}</div>`; s.appendChild(d); }
  A.btn(s, 'Schließen', A.closeSheet);
}

// ---------------------------------------------------------------- shops
function shopNode(p, sh) {
  const sw = W(sh.word), g = G();
  return { art: p.art, title: sw.jp, titleDe: `${displayDe(sw)} – ${W(p.word).deLoc}`, widgetTop: true,
    lines: [{ who: '{店主|てんしゅ}', t: 'いらっしゃいませ！', de: 'Herzlich willkommen!' }],
    widget: host => {
      const grid = document.createElement('div'); grid.className = 'pgrid'; host.appendChild(grid);
      for (const id of sh.sells) {
        const price = wd().prices[id], c = document.createElement('button'); c.className = 'pcard'; const sp = spriteEl(id, 64); if (sp) c.appendChild(sp);
        c.insertAdjacentHTML('beforeend', `<div class="jp">${A.J(W(id).jp)}</div><div class="pr">${A.J(num(price) + '{円|えん}')}</div>${g.help ? `<div class="de">${displayDe(W(id))} · ${price} Yen</div>` : ''}`);
        c.onclick = () => { if (g.gold < price) return A.toast('Zu wenig Geld'); g.gold -= price; g.inv[id] = (g.inv[id] || 0) + 1; A.save(); A.toast(`${displayDe(W(id))} gekauft`); A.redraw(); };
        grid.appendChild(c);
      }
    },
    choices: [{ t: 'でる', de: 'Zurück', fn: () => { A.navigateBack(); } }] };
}

// ---------------------------------------------------------------- 1. meet: understand the wish
function encounter(id) {
  const y = ys().find(x => x.id === id), req = kudasai(y);
  const foods = ['kyuuri', 'aburaage', 'mochi', 'ocha', 'momo', 'tamago', 'kusuri', 'sakana', 'pan', 'niku', 'osake', 'ringo'];
  const opts = shuffle([y.item, ...shuffle(foods.filter(f => f !== y.item)).slice(0, 3)]); let msg = '', done = false;
  A.setScreen(() => ({ art: place(y.place).art, noBanner: true, title: y.jp, titleDe: `${y.deLong} – ${W(place(y.place).word).deLoc}`, widgetTop: true,
    lines: [{ say: 'Ein Wesen taucht auf und sagt etwas. Was möchte es?' }, line(y.jp, req, 'y_' + y.id), ...(msg ? [{ say: msg }] : [])],
    widget: host => {
      const grid = document.createElement('div'); grid.className = 'pgrid'; grid.style.gridTemplateColumns = 'repeat(2,1fr)'; host.appendChild(grid);
      for (const o of opts) {
        const c = document.createElement('button'); c.className = 'pcard'; c.appendChild(cardWord(o, 64));
        c.onclick = () => {
          if (done) return; const ok = o === y.item; E.recordAnswer(G(), o, ok);
          if (!ok) { msg = 'Das Wesen schüttelt den Kopf. Lies den Satz noch einmal – tippe auf Wörter für die Übersetzung.'; A.save(); return A.redraw(); }
          done = true; state(y.id).stage = 1; note(req); A.gain(8, 10); A.save(); A.toast('Wunsch verstanden!'); A.navigateBack();
        };
        grid.appendChild(c);
      }
    }, choices: [] }));
}

// ---------------------------------------------------------------- 2. ask around: where is it?
function askVillagers(id) {
  const y = ys().find(x => x.id === id), [h1, h2] = hints(y), npc = NPC[(y.id.length + y.id.charCodeAt(0)) % NPC.length]; let msg = '', done = false;
  const shopPlace = place(y.shop.place);
  const pool = wd().places.flatMap(p => (p.shops || []).map(s => ({ pid: p.id, sw: s.word, key: p.id + '/' + s.word }))).filter(c => c.key !== y.shop.place + '/' + y.shop.building);
  const opts = shuffle([{ pid: y.shop.place, sw: y.shop.building, key: 'ok' }, ...shuffle(pool).slice(0, 3)]);
  A.setScreen(() => ({ art: 'village', noBanner: true, title: '{聞|き}く', titleDe: `Nach ${displayDe(W(y.item))} fragen`, widgetTop: true,
    lines: [{ say: 'Die Leute geben dir zwei Hinweise. Wohin musst du gehen?' }, { ...line('{村人|むらびと}', h1, npc), who: '' }, { ...line('', h2, npc), who: '' }, ...(msg ? [{ say: msg }] : [])],
    widget: host => {
      const grid = document.createElement('div'); grid.className = 'pgrid'; grid.style.gridTemplateColumns = 'repeat(2,1fr)'; host.appendChild(grid);
      for (const o of opts) {
        const c = document.createElement('button'); c.className = 'pcard'; const pw = place(o.pid).word;
        c.insertAdjacentHTML('beforeend', `<div style="display:flex;justify-content:center;gap:6px"></div>`); const row = c.firstChild; row.appendChild(cardWord(pw, 40)); row.appendChild(cardWord(o.sw, 40));
        c.onclick = () => {
          if (done) return; const ok = o.key === 'ok'; E.recordAnswer(G(), o.sw, ok);
          if (!ok) { msg = 'Hm, das passt nicht zu den Hinweisen. Lies sie noch einmal.'; A.save(); return A.redraw(); }
          done = true; state(y.id).stage = 2; note(h1); note(h2); A.gain(10, 10); A.save(); A.toast('Hinweis verstanden – reise dorthin!'); A.navigateBack();
        };
        grid.appendChild(c);
      }
    }, choices: [] }));
}

// ---------------------------------------------------------------- 3. give the gift
function gift(id) {
  const y = ys().find(x => x.id === id), give = dozo(y); let msg = '';
  const items = Object.keys(G().inv).filter(k => G().inv[k] > 0 && W(k));
  A.setScreen(() => ({ art: place(y.place).art, noBanner: true, title: y.jp, titleDe: 'Was schenkst du?', widgetTop: true,
    lines: [line(y.jp, kudasai(y), 'y_' + y.id), ...(msg ? [{ say: msg }] : [])],
    widget: host => {
      const grid = document.createElement('div'); grid.className = 'pgrid'; host.appendChild(grid);
      for (const k of items) { const c = document.createElement('button'); c.className = 'pcard'; c.appendChild(cardWord(k, 56)); c.insertAdjacentHTML('beforeend', `<div class="de">×${G().inv[k]}</div>`);
        c.onclick = () => { if (k !== y.item) { msg = 'Das Wesen schaut dich fragend an. Das war nicht der Wunsch.'; return A.redraw(); } G().inv[k]--; befriend(y, give); }; grid.appendChild(c); }
    }, choices: [{ t: 'もどる', de: 'Zurück', fn: () => { A.navigateBack(); } }] }));
}
function befriend(y, give) {
  state(y.id).stage = 3; A.gain(30, 100); A.save();
  A.setScreen(() => ({ art: place(y.place).art, noBanner: true, title: 'ともだち！', titleDe: `${y.de} ist jetzt dein Freund`, widgetTop: true,
    lines: [{ ...line('', give, null), who: '' }, { say: '+30 XP, +100 円. Neuer Eintrag im Yokai-Dex.' }],
    widget: host => { const d = document.createElement('div'); host.appendChild(d); dexEntry(d, y, true); },
    choices: [{ t: '{図鑑|ずかん}', de: 'Yokai-Dex ansehen', fn: () => { A.openSheet(dexSheet); } }, { t: 'もどる', de: 'Weiter', fn: () => { A.navigateBack(); } }] }), { replace: true });
}

// ---------------------------------------------------------------- Dex
function dexEntry(s, y, inline = false) {
  const st = state(y.id), known = st.stage >= 1, friend = st.stage >= 3;
  if (!inline) s.innerHTML = `<h2>${known ? A.J(y.jp) : '？？？'}　<small style="display:inline">${known ? `${y.de} · ${y.rom}` : ''}</small></h2>`;
  const top = document.createElement('div'); top.className = 'ycard'; const sp = spriteEl('y_' + y.id, 96); if (sp) { if (!friend) sp.classList.add('sil'); top.appendChild(sp); }
  const info = document.createElement('div'); info.className = 'yinfo'; top.appendChild(info);
  info.innerHTML = `<div class="jp" style="font-size:1.3rem">${known ? A.J(y.jp) : '？？？'}</div><div class="de">${known ? `${y.deLong}` : 'Noch unbekannt'}</div><div class="de">Lebensraum: ${W(place(y.place).word).de} (${W(place(y.place).word).deLoc})</div><div class="de">Wunsch: ${known ? displayDe(W(y.item)) : '?'}</div>`;
  s.appendChild(top);
  const lore = document.createElement('div'); lore.className = 'lore';
  lore.innerHTML = friend ? `${y.lore}<br><br><i>Einordnung: ${y.einordnung}</i><br><br><b>Kultur:</b> ${y.culture}` : 'Befreunde dich mit diesem Wesen, um seine Geschichte zu lesen.'; s.appendChild(lore);
  if (!inline) A.btn(s, 'Zurück', () => A.openSheet(dexSheet));
}
export function dexSheet(s) {
  const all = ys(), n = all.filter(y => state(y.id).stage >= 3).length;
  s.innerHTML = `<h2>${A.lbl('{妖怪図鑑|ようかいずかん}', 'Yokai-Dex')}</h2><div class="de">${n} von ${all.length} Freunden</div>`;
  const grid = document.createElement('div'); grid.className = 'pgrid'; grid.style.marginTop = '10px'; s.appendChild(grid);
  for (const y of all) {
    const st = state(y.id), c = document.createElement('button'); c.className = 'pcard'; const sp = spriteEl('y_' + y.id, 64); if (sp) { if (st.stage < 3) sp.classList.add('sil'); c.appendChild(sp); }
    c.insertAdjacentHTML('beforeend', `<div class="jp" style="font-size:1.1rem">${st.stage >= 1 ? A.J(y.jp) : '？？？'}</div><div class="de">${st.stage >= 3 ? 'Freund ✔' : st.stage >= 1 ? 'begegnet' : 'unbekannt'}</div>`);
    c.onclick = () => A.openSheet(ss => dexEntry(ss, y)); grid.appendChild(c);
  }
  A.btn(s, 'Schließen', A.closeSheet);
}
