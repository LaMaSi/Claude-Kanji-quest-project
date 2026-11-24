// Battle screen (animals = fight) with Kanji-Zauber spells, plus the Zauberschule (cast outside of fights) and spell effects.
// Commands: こうげき (vocabulary question or typed romaji → kana), まほう (write a kanji), どうぐ (items), にげる.
import * as E from './engine.js';
import { CONTENT, VOCAB, ANIMALS, LORE_WOLF } from './data.js';
import { speakText, toHira } from './lang.js';
import { spriteEl } from './sprites.js';
import { drawKanji } from './kanji.js';
import { np } from './german.js';
import { renderQuestion } from './learn.js';

let A;
export const initBattle = api => { A = api; };
const G = () => A.G();
const rnd = n => Math.floor(Math.random() * n);

// ------------------------------------------------------------------ content
export const FOES = {
  okami: { hp: 14, atk: [2, 4], art: 'wolf', xp: 40, gold: 200 },
  kuma: { hp: 20, atk: [3, 5], art: 'woods', xp: 55, gold: 260 },
  tori: { hp: 8, atk: [1, 3], art: 'field', xp: 20, gold: 80 },
};
/** spells = kanji of Kanji-Zauber (unlocked once written correctly). fx = colour/particle style, ex = effect in battle */
export const SPELLS = {
  '火': { de: 'Feuer', dmg: 8, fx: 'fire', jp: '{火|ひ}', hint: 'Lektion 2' },
  '水': { de: 'Wasser', dmg: 5, fx: 'water', jp: '{水|みず}', hint: 'Lektion 2' },
  '日': { de: 'Sonne', dmg: 6, fx: 'sun', jp: '{日|ひ}', hint: 'Lektion 2' },
  '月': { de: 'Mond', heal: 8, fx: 'moon', jp: '{月|つき}', hint: 'Lektion 2' },
  '木': { de: 'Baum', shield: true, fx: 'wood', jp: '{木|き}', hint: 'Lektion 3' },
  '山': { de: 'Berg', dmg: 10, fx: 'rock', jp: '{山|やま}', hint: 'Lektion 3' },
};
const HEAL = { kusuri: 12, pan: 6, ringo: 4 };
const known = c => !!(G().kanji || {})[c];
const wordOf = id => CONTENT.byId[id];

// ------------------------------------------------------------------ romaji → kana (typing level)
const T = {};
[['', 'あいうえお'], ['k', 'かきくけこ'], ['s', 'さしすせそ'], ['t', 'たちつてと'], ['n', 'なにぬねの'], ['h', 'はひふへほ'], ['m', 'まみむめも'],
  ['r', 'らりるれろ'], ['g', 'がぎぐげご'], ['z', 'ざじずぜぞ'], ['d', 'だぢづでど'], ['b', 'ばびぶべぼ'], ['p', 'ぱぴぷぺぽ']]
  .forEach(([c, ks]) => [...'aiueo'].forEach((v, i) => { T[c + v] = ks[i]; }));
Object.assign(T, { ya: 'や', yu: 'ゆ', yo: 'よ', wa: 'わ', wo: 'を', shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ', ji: 'じ', si: 'し', ti: 'ち', tu: 'つ', hu: 'ふ', zi: 'じ' });
[['ky', 'き'], ['gy', 'ぎ'], ['sh', 'し'], ['sy', 'し'], ['ch', 'ち'], ['ty', 'ち'], ['j', 'じ'], ['jy', 'じ'], ['zy', 'じ'], ['ny', 'に'], ['hy', 'ひ'], ['by', 'び'], ['py', 'ぴ'], ['my', 'み'], ['ry', 'り']]
  .forEach(([pre, base]) => [['a', 'ゃ'], ['u', 'ゅ'], ['o', 'ょ']].forEach(([v, sm]) => { T[pre + v] = base + sm; }));
export function toKana(src, final = false) {
  const s = src.toLowerCase().replace(/ō/g, 'ou').replace(/ū/g, 'uu').replace(/[^a-z']/g, '');
  let out = '', i = 0;
  while (i < s.length) {
    const r = s.slice(i);
    if (r.length > 1 && r[0] === r[1] && /[kstpcgzdbhjmrwf]/.test(r[0])) { out += 'っ'; i++; continue; }
    let hit = null;
    for (const L of [3, 2, 1]) if (T[r.slice(0, L)]) { hit = [L, T[r.slice(0, L)]]; break; }
    if (hit) { out += hit[1]; i += hit[0]; continue; }
    if (r[0] === 'n') {
      if (r[1] === "'") { out += 'ん'; i += 2; continue; }
      if (r[1] === 'n') { out += 'ん'; i += /[aiueoy]/.test(r[2] || '') ? 1 : 2; continue; }
      if (r.length > 1 || final) { out += 'ん'; i++; continue; }
    }
    out += r[0]; i++;
  }
  return out;
}

// ------------------------------------------------------------------ spell effects (particles on the picture)
const PAL = { fire: ['#d29a3e', '#e0b060', '#b45a5a'], water: ['#6f8aa8', '#9db4c8', '#46607a'], wood: ['#6f9a78', '#9ab89f', '#4d7358'],
  sun: ['#e0b060', '#cbc1af', '#d29a3e'], moon: ['#cbc1af', '#9aa0b8', '#6c7290'], rock: ['#a39a86', '#8d887e', '#cbc1af'] };
export function spellFx(kind) {
  const stage = document.querySelector('#stage'); if (!stage || stage.hidden) return;
  const cv = document.createElement('canvas'); cv.width = 120; cv.height = 80; cv.className = 'fx'; stage.appendChild(cv);
  const c = cv.getContext('2d'), pal = PAL[kind], P = [];
  const n = kind === 'sun' ? 40 : 70;
  for (let i = 0; i < n; i++) {
    const p = { c: pal[rnd(pal.length)], s: kind === 'rock' ? 3 + rnd(3) : 1 + rnd(3), t: -rnd(25), life: 40 + rnd(25) };
    if (kind === 'fire') Object.assign(p, { x: 40 + rnd(40), y: 78, vx: (Math.random() - .5) * .7, vy: -.9 - Math.random() * 1.1 });
    else if (kind === 'water') Object.assign(p, { x: rnd(120), y: -4, vx: (Math.random() - .5) * .3, vy: 1.4 + Math.random() * 1.2 });
    else if (kind === 'wood') { const a = Math.random() * 6.28; Object.assign(p, { x: 60, y: 40, vx: Math.cos(a) * 1.1, vy: Math.sin(a) * .8 - .2 }); }
    else if (kind === 'sun') { const a = i / n * 6.28; Object.assign(p, { x: 60, y: 36, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.1 }); }
    else if (kind === 'moon') Object.assign(p, { x: 20 + rnd(80), y: 70 + rnd(8), vx: (Math.random() - .5) * .3, vy: -.5 - Math.random() * .5 });
    else Object.assign(p, { x: 15 + rnd(90), y: -6, vx: 0, vy: 1.8 + Math.random() * 1.2 });
    P.push(p);
  }
  let f = 0;
  const tick = () => {
    c.clearRect(0, 0, 120, 80);
    if (kind === 'sun' || kind === 'moon') { c.globalAlpha = .18 * Math.sin(Math.min(1, f / 40) * Math.PI); c.fillStyle = pal[0]; c.fillRect(0, 0, 120, 80); }
    for (const p of P) {
      p.t++; if (p.t < 0) continue;
      p.x += p.vx; p.y += p.vy; if (kind === 'rock') p.vy += .05;
      c.globalAlpha = Math.max(0, 1 - p.t / p.life); c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    c.globalAlpha = 1;
    if (++f < 90) requestAnimationFrame(tick); else cv.remove();
  };
  tick();
  if (kind === 'rock') { stage.classList.remove('hit'); void stage.offsetWidth; stage.classList.add('hit'); }
}
const hitFlash = () => { const s = document.querySelector('#stage'); if (s) { s.classList.remove('hit'); void s.offsetWidth; s.classList.add('hit'); } };

// ------------------------------------------------------------------ battle
const bar = (hp, max) => `<span class="bar">${[...Array(10)].map((_, i) => `<i class="${i < Math.ceil(hp / max * 10) ? 'f' : ''}"></i>`).join('')}</span>`;
const typedQuestion = (host, ts, done) => {   // ts = { id, text, res } survives redraws (e.g. changing the Schriftwahl)
  const id = ts.id, w = wordOf(id), want = toHira(speakText(w.jp));
  host.innerHTML = ''; const box = document.createElement('div'); box.className = 'q'; host.appendChild(box);
  const sp = spriteEl(id, 110); if (sp) box.appendChild(sp);
  box.insertAdjacentHTML('beforeend', '<div class="de">Wie heißt das auf Japanisch? Tippe es in Rōmaji.</div>');
  const inp = document.createElement('input'); inp.className = 'search'; inp.placeholder = 'z. B. ookami'; inp.autocapitalize = 'off'; inp.autocomplete = 'off'; inp.spellcheck = false; host.appendChild(inp);
  const pv = document.createElement('div'); pv.className = 'jp'; pv.style.cssText = 'text-align:center;min-height:2.4rem;color:var(--amber)'; host.appendChild(pv);
  inp.value = ts.text || ''; pv.textContent = toKana(inp.value);
  inp.oninput = () => { ts.text = inp.value; pv.textContent = toKana(inp.value); };
  const feedback = () => {
    inp.disabled = true; ok1.disabled = true; const ok = ts.res === 'ok';
    const fb = document.createElement('div'); fb.className = 'kmsg'; fb.innerHTML = ok ? '✔ richtig' : `✘ <span class="jp">${A.J(w.jp)}</span> (${want})`; host.appendChild(fb);
    if (ok) { if (!ts.fired) { ts.fired = 1; setTimeout(() => done(true), 650); } } else A.btn(host, 'Weiter ▸', () => { if (!ts.fired) { ts.fired = 1; done(false); } }, 'primary');
  };
  const go = () => { const ok = toHira(toKana(inp.value, true)) === want; ts.res = ok ? 'ok' : 'no'; E.recordAnswer(G(), id, ok); A.save(); feedback(); };
  const ok1 = A.btn(host, 'OK', go, 'primary'); inp.onkeydown = e => { if (e.key === 'Enter' && !ok1.disabled) go(); };
  if (ts.res) feedback(); else setTimeout(() => inp.focus(), 50);
};

export function startBattle(foeId, { onWin } = {}) {
  const F = FOES[foeId], w = wordOf(foeId), g = G();
  A.see(ANIMALS);
  const st = { hp: F.hp, mode: 'menu', log: [], shield: false, over: false, spell: null };
  const say = (de, jp) => { st.log = [{ say: (jp ? `<span class="jp">${A.J(jp)}</span> ` : '') + de }, ...st.log].slice(0, 2); };
  const enemyTurn = () => {
    if (st.shield) { st.shield = false; say('Der Baum schützt dich – der Angriff prallt ab.', 'まもった！'); return; }
    const d = F.atk[0] + rnd(F.atk[1] - F.atk[0] + 1); g.hp = Math.max(0, g.hp - d); hitFlash();
    say(`${np(w, 'nom', true).replace(/^./, c => c.toUpperCase())} greift an. Du verlierst ${d} HP.`, 'いたい！');
  };
  const after = () => {
    st.mode = 'menu';
    if (st.hp <= 0) return win();
    enemyTurn(); A.save();
    if (g.hp <= 0) return lose();
    A.redraw();
  };
  const hurt = (n, msg, jp) => { st.hp = Math.max(0, st.hp - n); hitFlash(); say(`${msg} ${n} Schaden.`, jp); };
  const attackDone = typed => ok => {
    if (ok) hurt(typed ? 6 : 4, 'Treffer!', 'こうげき！'); else say('Daneben!', 'はずれ…');
    after();
  };
  const cast = (c, full) => {
    const S = SPELLS[c], k = full ? 1 : .5;
    spellFx(S.fx);
    if (S.dmg) hurt(Math.max(1, Math.round(S.dmg * k)), `${S.de}-Zauber${full ? '' : ' (schwach)'}!`, S.jp);
    if (S.heal) { const h = Math.round(S.heal * k); g.hp = Math.min(g.maxhp, g.hp + h); say(`Mond-Zauber${full ? '' : ' (schwach)'}: +${h} HP.`, S.jp); }
    if (S.shield) { st.shield = true; say('Ein Baum wächst vor dir und schützt dich vor dem nächsten Angriff.', S.jp); }
    g.spellsCast ||= {}; if (!g.spellsCast[c]) { g.spellsCast[c] = 1; A.gain(3); }
    A.save(); setTimeout(after, 1100);
  };

  const pickQuestion = () => {
    const id = Math.random() < .6 ? foeId : ANIMALS[rnd(ANIMALS.length)];
    return { id, q: E.makeWordQuestion(g, CONTENT, id, { poolIds: ANIMALS }) };
  };
  const menu = () => {
    const typ = g.input === 'type';
    return { widget: null, grid: true, choices: [
      { t: 'こうげき', de: 'Angriff', cls: 'primary', fn: () => { st.mode = 'ask'; st.pq = typ ? { id: Math.random() < .6 ? foeId : ANIMALS[rnd(ANIMALS.length)] } : pickQuestion(); } },
      { t: 'まほう', de: 'Zauber', fn: () => { st.mode = 'spells'; } },
      { t: 'どうぐ', de: 'Gegenstand', fn: () => { st.mode = 'items'; } },
      { t: 'にげる', de: 'Fliehen', fn: () => { g.hp = Math.max(1, g.hp - 2); A.save(); return 'village'; } },
      { t: '{入力|にゅうりょく}', de: typ ? 'Eingabe: Tastatur' : 'Eingabe: Tippen', cls: 'wide', fn: () => { g.input = typ ? 'pick' : 'type'; A.save(); } }] };
  };
  const build = () => {
    const base = { art: F.art, noBanner: true, title: `${w.jp} が あらわれた！`, titleDe: `${np(w, 'nom', false).replace(/^./, c => c.toUpperCase())} erscheint!`,
      lines: [{ say: `${A.J(w.jp)} ${bar(st.hp, F.hp)}<br>Du: ${g.hp}/${g.maxhp} HP` }, ...st.log] };
    const back = { t: 'もどる', de: 'Zurück', fn: () => { st.mode = 'menu'; } };
    if (st.mode === 'ask') {
      const typ = g.input === 'type';
      return { ...base, widget: host => { if (typ) typedQuestion(host, st.pq, attackDone(true)); else renderQuestion(host, st.pq.q, attackDone(false)); }, choices: [back] };
    }
    if (st.mode === 'cast') {
      const c = st.spell; A.lock({ kanji: true });
      return { ...base, lines: [...base.lines.slice(0, 1), { say: `Schreibe: <b>${SPELLS[c].de}</b> – <span class="jp">${A.J(SPELLS[c].jp)}</span>` }],
        widget: host => drawKanji(host, c, ok => cast(c, ok), 'Zeichne den 1. Strich'), choices: [back] };
    }
    if (st.mode === 'spells') {
      return { ...base, choices: [...Object.keys(SPELLS).map(c => { const S = SPELLS[c], ok = known(c);
        return { t: ok ? `${c}　${S.jp}` : `${c}　🔒`, de: ok ? `${S.de} – ${S.dmg ? 'Schaden' : S.heal ? 'heilt' : 'Schutz'}` : `Schreibe es zuerst in Kanji-Zauber (${S.hint})`, disabled: !ok, fn: () => { st.mode = 'cast'; st.spell = c; } }; }), back] };
    }
    if (st.mode === 'items') {
      const ids = Object.keys(HEAL).filter(i => (g.inv[i] || 0) > 0);
      return { ...base, choices: [...(ids.length ? ids.map(i => ({ t: `${VOCAB[i].m}`, de: `${VOCAB[i].de} ×${g.inv[i]} · +${HEAL[i]} HP`, fn: () => { g.inv[i]--; g.hp = Math.min(g.maxhp, g.hp + HEAL[i]); say(`${VOCAB[i].de}: +${HEAL[i]} HP.`, 'おいしい！'); after(); } })) : [{ t: 'からっぽ', de: 'Leer', disabled: true }]), back] };
    }
    const m = menu(); return { ...base, grid: true, choices: m.choices };
  };
  function win() {
    st.over = true; g.hp = Math.max(1, g.hp); A.gain(F.xp, F.gold);
    const quest = foeId === 'okami' && g.q.wolf === 1; if (quest) g.q.wolf = 2;
    g.defeated = g.defeated || {}; g.defeated[foeId] = (g.defeated[foeId] || 0) + 1; A.save();
    A.setScreen(() => ({ art: F.art, noBanner: true, title: 'しょうり！', titleDe: 'Sieg!',
      lines: [...(quest ? [{ who: '{狩人|かりうど}', t: 'ありがとう！ {村|むら} は あんぜん です。', de: 'Danke! Das Dorf ist sicher.' }] : []), { say: `+${F.gold} 円, +${F.xp} XP` }, ...(quest ? [{ say: `<div class="lore">${LORE_WOLF}</div>` }] : [])],
      choices: [{ t: 'もう いちど', de: 'Noch einmal', fn: () => battleChooser() }, { t: 'もどる', de: 'Zurück ins Dorf', go: 'village' }] }), { replace: true });
    onWin && onWin();
  }
  function lose() {
    g.hp = 5; A.save();
    A.setScreen(() => ({ art: 'home', noBanner: true, title: 'まけた…', titleDe: 'Besiegt …',
      lines: [{ say: `Du erwachst zu Hause. ${np(w, 'nom', true).replace(/^./, c => c.toUpperCase())} ist verschwunden – für heute Nacht. Ruh dich aus und versuch es erneut.` }], choices: [{ t: 'もどる', de: 'Weiter', go: 'home' }] }), { replace: true });
  }
  A.setScreen(build, { confirm: 'Kampf verlassen?' });
}

/** choose an opponent (practice fights) */
export function battleChooser() {
  A.setScreen(() => ({ art: 'wolf', title: '{森|もり}で たたかう', titleDe: 'Im Wald kämpfen', lines: [{ say: 'Tiere kämpfen. Yokai kämpfen nie – mit ihnen redest du.' }],
    widget: host => { host.innerHTML = ''; for (const id of Object.keys(FOES)) { const w = wordOf(id), b = A.btn(host, `<span style="display:flex;align-items:center;gap:12px"></span>`, () => startBattle(id));
      const row = b.firstChild, sp = spriteEl(id, 52); if (sp) row.appendChild(sp); row.insertAdjacentHTML('beforeend', `<span><span class="jp">${A.J(w.jp)}</span><small>${(G().defeated || {})[id] ? `besiegt ×${G().defeated[id]}` : 'noch nicht besiegt'}</small></span>`); } },
    choices: [{ t: 'もどる', de: 'Zurück', fn: () => A.navigateBack() }] }));
}

/** Zauberschule: cast a spell outside of a fight (visual effect, the moon heals) */
export function spellSchool() {
  let c = null, msg = '';
  A.setScreen(() => (c && A.lock({ kanji: true }), { art: 'home', noBanner: !!c, title: '{魔法|まほう}の {学校|がっこう}', titleDe: 'Zauberschule',
    lines: [{ say: c ? `Schreibe: <b>${SPELLS[c].de}</b> – <span class="jp">${A.J(SPELLS[c].jp)}</span>` : (msg || 'Schreibe ein Kanji, und der Zauber geschieht. Neue Zauber lernst du in Kanji-Zauber.') }],
    widget: host => {
      if (c) { const cc = c; drawKanji(host, cc, ok => { c = null; msg = ok ? `${SPELLS[cc].de}!` : 'Der Zauber flackert nur schwach.'; const g = G();
          if (SPELLS[cc].heal) { g.hp = Math.min(g.maxhp, g.hp + Math.round(SPELLS[cc].heal * (ok ? 1 : .5))); msg += ` HP ${g.hp}/${g.maxhp}.`; }
          g.spellsCast ||= {}; if (!g.spellsCast[cc]) { g.spellsCast[cc] = 1; A.gain(3); }
          A.save(); A.redraw(); setTimeout(() => spellFx(SPELLS[cc].fx), 150); }, 'Zeichne den 1. Strich'); return; }
      host.innerHTML = ''; const grid = document.createElement('div'); grid.className = 'grid'; host.appendChild(grid);
      for (const k of Object.keys(SPELLS)) { const ok = known(k), b = A.btn(grid, `<span class="jp">${k}</span><small class="de">${ok ? SPELLS[k].de : '🔒'}</small>`, () => { c = k; A.redraw(); }); b.disabled = !ok; }
    },
    choices: [{ t: 'もどる', de: 'Zurück', fn: () => (c ? (c = null, undefined) : A.navigateBack()) }] }));
}
