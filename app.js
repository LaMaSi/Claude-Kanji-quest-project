import { render, num, count, speakText } from './lang.js';
import { drawArt } from './art.js';
import { VOCAB, ANIMALS, SHOP, KANJI, LORE_WOLF } from './data.js';
import { drawKanji } from './kanji.js';

const $ = s => document.querySelector(s);
const KEY = 'wolfsdorf.save.v1';
const DEFAULT = () => ({ mode: 'kanji', furi: true, help: true, gold: 300, hp: 20, maxhp: 20, xp: 0, lv: 1,
  inv: {}, q: { apple: 0, wolf: 0 }, flags: {}, seen: {}, srs: {}, kanji: {}, loc: 'village' });
let G;
try { G = { ...DEFAULT(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { G = DEFAULT(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch {} };
const J = src => render(src, G.mode, G.furi);
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const see = ids => { for (const i of ids) G.seen[i] = G.seen[i] || 1; };
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
function speak(src) {
  try { const u = new SpeechSynthesisUtterance(speakText(src)); u.lang = 'ja-JP'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  catch { toast('Keine Sprachausgabe verfügbar'); }
}
function gain(xp, gold = 0) {
  G.xp += xp; G.gold += gold;
  while (G.xp >= G.lv * 40) { G.xp -= G.lv * 40; G.lv++; G.maxhp += 4; G.hp = G.maxhp; toast(`レベル ${G.lv}！ Level up!`); }
}

// ---------- screen engine ----------
let screen = null;                       // () => node, re-run whenever display options change
function setScreen(fn) { screen = fn; draw(); }
function go(id) { G.loc = id; save(); setScreen(NODES[id]); }

function draw() {
  const n = screen();
  drawArt($('#art'), n.art || 'village');
  $('#loc').innerHTML = J(n.title) + (G.help && n.titleDe ? `<small>${n.titleDe}</small>` : '');
  const text = $('#text'); text.innerHTML = '';
  for (const l of n.lines || []) {
    const d = document.createElement('div');
    if (l.say) { d.className = 'say'; d.innerHTML = l.say; text.appendChild(d); continue; }
    d.className = 'line';
    d.innerHTML = `<div class="who"><span>${l.who ? J(l.who) : ''}</span><button class="spk" aria-label="Vorlesen">🔊</button></div>` +
      `<div class="jp">${J(l.t)}</div>` + (G.help && l.de ? `<div class="de">${l.de}</div>` : '');
    d.querySelector('.spk').onclick = () => speak(l.t);
    text.appendChild(d);
  }
  const wg = $('#widget'); wg.innerHTML = '';
  if (n.widget) n.widget(wg);
  const ch = $('#choices'); ch.innerHTML = '';
  for (const c of n.choices || []) {
    const b = document.createElement('button'); b.className = 'btn' + (c.cls ? ' ' + c.cls : '');
    b.innerHTML = J(c.t) + (G.help && c.de ? `<small>${c.de}</small>` : '');
    if (c.disabled) b.disabled = true;
    b.onclick = () => { const r = c.fn ? c.fn() : c.go; if (typeof r === 'string') go(r); else if (r === undefined) draw(); };
    ch.appendChild(b);
  }
  renderStats();
  window.scrollTo(0, 0);
}
function renderStats() {
  $('#stats').innerHTML = `<span>HP <b>${G.hp}/${G.maxhp}</b></span><span><b>${G.gold}</b> 円</span><span>Lv <b>${G.lv}</b></span>`;
  $('#bMode').textContent = { kanji: '漢', kana: 'あ', romaji: 'A' }[G.mode];
  $('#bFuri').classList.toggle('off', G.mode !== 'kanji' || !G.furi);
  $('#bHelp').classList.toggle('off', !G.help);
}
$('#bMode').onclick = () => { G.mode = { kanji: 'kana', kana: 'romaji', romaji: 'kanji' }[G.mode]; save(); draw(); refreshSheet(); };
$('#bFuri').onclick = () => { G.furi = !G.furi; if (G.mode !== 'kanji') G.mode = 'kanji'; save(); draw(); refreshSheet(); };
$('#bHelp').onclick = () => { G.help = !G.help; save(); draw(); refreshSheet(); };
$('#bMenu').onclick = () => openSheet(menuSheet);

// ---------- overlay sheet ----------
let sheetFn = null;
function openSheet(fn) { sheetFn = fn; $('#overlay').hidden = false; refreshSheet(); }
function closeSheet() { sheetFn = null; $('#overlay').hidden = true; $('#sheet').innerHTML = ''; }
function refreshSheet() { if (sheetFn) { const s = $('#sheet'); s.innerHTML = ''; sheetFn(s); } }
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeSheet(); });
function btn(parent, html, fn, cls = '') { const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = html; b.onclick = fn; parent.appendChild(b); return b; }
const lbl = (m, de) => J(m) + (G.help ? `<small>${de}</small>` : '');

// ---------- number keypad (type the number you read/hear in Japanese) ----------
function keypad(host, onSubmit) {
  let v = '';
  const disp = document.createElement('div'); disp.className = 'disp'; disp.textContent = '　';
  const pad = document.createElement('div'); pad.className = 'pad';
  const upd = () => { disp.textContent = v || '　'; };
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔']) {
    btn(pad, k, () => {
      if (k === '⌫') v = v.slice(0, -1); else if (k === '✔') { if (v) onSubmit(parseInt(v, 10)); return; } else if (v.length < 5) v += k;
      upd();
    });
  }
  host.append(disp, pad);
}

// ---------- quiz helpers ----------
function vocabQuestion(id, pool) {
  const type = Math.random() < 0.5 ? 'jp2de' : 'de2jp';
  const others = shuffle(pool.filter(x => x !== id && VOCAB[x].cat === VOCAB[id].cat)).slice(0, 3);
  while (others.length < 3) { const x = pool[rnd(pool.length)]; if (x !== id && !others.includes(x)) others.push(x); }
  return { kind: 'vocab', id, type, opts: shuffle([id, ...others]) };
}
function numberQuestion() {
  const n = [3, 4, 5, 7, 8, 12, 20, 30, 45, 60, 80, 100, 150, 300, 600, 800][rnd(16)];
  return { kind: Math.random() < 0.5 ? 'numkp' : 'numpick', n };
}
function srsUpdate(id, ok) {
  const s = G.srs[id] || { box: 0, due: 0 };
  s.box = ok ? Math.min(4, s.box + 1) : 0; s.due = Date.now() + [0, 1, 3, 7, 14][s.box] * 864e5; G.srs[id] = s;
}
/** renders a question into host; calls done(correct) once */
function askQuestion(host, q, done) {
  host.innerHTML = '';
  const finish = (ok, correctHtml) => {
    if (q.id) srsUpdate(q.id, ok);
    host.querySelectorAll('button').forEach(b => b.disabled = true);
    const nx = document.createElement('div'); nx.className = 'kmsg';
    nx.innerHTML = ok ? '✔ richtig' : `✘ ${correctHtml}`; host.appendChild(nx);
    setTimeout(() => done(ok), ok ? 650 : 1500);
  };
  const box = document.createElement('div'); box.className = 'q'; host.appendChild(box);
  if (q.kind === 'vocab') {
    const v = VOCAB[q.id];
    box.innerHTML = q.type === 'jp2de' ? `<span class="jp">${J(v.m)}</span>` : v.de;
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px'; host.appendChild(wrap);
    for (const o of q.opts) {
      const b = btn(wrap, q.type === 'jp2de' ? VOCAB[o].de : `<span class="jp">${J(VOCAB[o].m)}</span>`, () => {
        const ok = o === q.id; b.classList.add(ok ? 'ok' : 'no');
        finish(ok, `<span class="jp">${J(v.m)}</span> = ${v.de}`);
      });
    }
  } else if (q.kind === 'numpick') {
    box.innerHTML = `${q.n}<div class="de">Wie sagt man das?</div>`;
    const set = new Set([q.n]); while (set.size < 4) set.add(Math.max(1, q.n + [-10, -1, 1, 2, 10, 20, -2, 100][rnd(8)]));
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px'; host.appendChild(wrap);
    for (const o of shuffle([...set])) { const b = btn(wrap, `<span class="jp">${J(num(o))}</span>`, () => { const ok = o === q.n; b.classList.add(ok ? 'ok' : 'no'); finish(ok, `${q.n} = <span class="jp">${J(num(q.n))}</span>`); }); }
  } else { // numkp: read the Japanese number, type digits
    box.innerHTML = `<span class="jp">${J(num(q.n))}</span><div class="de">Welche Zahl ist das? Tippe sie ein.</div>`;
    const kp = document.createElement('div'); host.appendChild(kp);
    keypad(kp, v => { const ok = v === q.n; finish(ok, `<span class="jp">${J(num(q.n))}</span> = ${q.n}`); });
  }
}

// ---------- NPC / story nodes ----------
const NODES = {
  village() {
    see(['mura', 'mise', 'sakaba', 'ie', 'shiro']);
    const lines = [];
    if (!G.flags.intro) lines.push({ who: '{語|かた}り{手|て}', t: '{夜|よる} の {村|むら}。{狼|おおかみ} が {月|つき} に {吠|ほ}える。', de: 'Nachts im Dorf. Ein Wolf heult den Mond an.' });
    else lines.push({ say: 'Die Nacht ist still. Wohin gehst du?' });
    const ch = [
      { t: '{店|みせ} へ いく', de: 'Zum Laden gehen', go: 'shop' },
      { t: '{酒場|さかば} へ いく', de: 'In die Taverne gehen', go: 'tavern' },
      { t: 'おばあさん と はなす', de: 'Mit der alten Frau sprechen', go: 'granny' },
      { t: '{家|いえ} へ かえる', de: 'Nach Hause gehen', go: 'home' },
    ];
    if (G.q.wolf === 1) ch.unshift({ t: '{村|むら} の {外|そと} へ いく', de: 'Vor das Dorf gehen (Wolf!)', fn: () => startBattle('okami') });
    G.flags.intro = 1;
    return { art: 'village', title: '{狼|おおかみ} の {村|むら}', titleDe: 'Wolfsdorf', lines, choices: ch };
  },

  home() {
    return { art: 'home', title: '{家|いえ}', titleDe: 'Zuhause', lines: [{ say: 'Eine warme Kerze, ein weiches Bett. Hier kannst du speichern und lernen.' }],
      choices: [
        { t: 'ねる', de: 'Schlafen (HP auffüllen)', fn: () => { G.hp = G.maxhp; save(); toast('おやすみなさい… HP voll'); } },
        { t: '{勉強|べんきょう}', de: 'Lernen (Wiederholung & Kanji)', fn: () => { openSheet(studySheet); } },
        { t: 'セーブ', de: 'Speichern', fn: () => { save(); toast('Gespeichert ✔'); } },
        { t: 'もどる', de: 'Zurück', go: 'village' },
      ] };
  },

  shop() {
    see(['ringo', 'pan', 'kusuri', 'tenshu']);
    const ch = [
      { t: '{買|か}う', de: 'Kaufen', go: 'buy' },
    ];
    if (!G.flags.sign) ch.push({ t: '{看板|かんばん} を みる', de: 'Das Ladenschild ansehen', fn: () => { signTask(); } });
    ch.push({ t: 'でる', de: 'Hinausgehen', go: 'village' });
    return { art: 'shop', title: '{店|みせ}', titleDe: 'Der Laden',
      lines: [{ who: '{店主|てんしゅ}', t: 'いらっしゃいませ！', de: 'Herzlich willkommen!' }], choices: ch };
  },

  buy() {
    const ch = SHOP.map(it => ({
      t: `${VOCAB[it.id].m}　${num(it.price)}{円|えん}`, de: `${VOCAB[it.id].de} – ${it.price} Yen`,
      fn: () => buyItem(it),
    }));
    ch.push({ t: 'やめる', de: 'Zurück', go: 'shop' });
    return { art: 'shop', title: '{何|なに} を {買|か}いますか？', titleDe: 'Was möchtest du kaufen?',
      lines: [{ who: '{店主|てんしゅ}', t: 'どうぞ。{一|ひと}つ ずつ の ねだん です。', de: 'Bitte sehr. Das sind die Preise pro Stück.' }], choices: ch };
  },

  tavern() {
    see(['sakaba', 'ocha', 'mizu', 'sake', 'okami_san', 'kariudo']);
    const ch = [
      { t: 'おかみさん に はなす', de: 'Mit der Wirtin sprechen (bestellen)', go: 'order' },
      { t: '{狩人|かりうど} に はなす', de: 'Mit dem Jäger sprechen', go: 'hunter' },
      { t: 'でる', de: 'Hinausgehen', go: 'village' },
    ];
    return { art: 'tavern', title: '{酒場|さかば}', titleDe: 'Die Taverne',
      lines: [{ who: 'おかみさん', t: 'いらっしゃい！ ゆっくり して ください。', de: 'Willkommen! Machen Sie es sich gemütlich.' }], choices: ch };
  },

  order() {
    const items = [['ocha', 10, 4], ['mizu', 0, 1], ['sake', 30, 2]];
    const ch = items.map(([id, price, heal]) => ({
      t: `${VOCAB[id].m} を ください。`, de: `${VOCAB[id].de} bestellen (${price} Yen, +${heal} HP)`,
      fn: () => {
        if (G.gold < price) { toast('Zu wenig Geld'); return; }
        G.gold -= price; G.hp = Math.min(G.maxhp, G.hp + heal); gain(2); save(); orderReply(id);
      },
    }));
    ch.push({ t: 'もどる', de: 'Zurück', go: 'tavern' });
    return { art: 'tavern', title: '{何|なに} を のみますか？', titleDe: 'Was möchtest du trinken?',
      lines: [{ who: 'おかみさん', t: '{何|なに} を のみますか？', de: 'Was möchten Sie trinken?' },
        { say: 'Tipp: 「Nを ください」 = „Bitte (gib mir) N“. を markiert das Objekt.' }], choices: ch };
  },

  hunter() {
    const q = G.q.wolf;
    if (q === 0) return { art: 'tavern', title: '{狩人|かりうど}', titleDe: 'Der Jäger',
      lines: [
        { who: '{狩人|かりうど}', t: '{狼|おおかみ} が こわいです。', de: 'Ich habe Angst vor Wölfen.' },
        { who: '{狩人|かりうど}', t: '{狼|おおかみ} は {村|むら} の {外|そと} に います。 たすけて ください。', de: 'Der Wolf ist vor dem Dorf. Bitte hilf uns.' }],
      choices: [
        { t: 'はい、たすけます。', de: 'Ja, ich helfe.', fn: () => { G.q.wolf = 1; save(); toast('Neuer Auftrag: Wolf!'); return 'tavern'; } },
        { t: 'ごめんなさい。', de: 'Entschuldigung. (später)', go: 'tavern' }] };
    if (q === 1) return { art: 'tavern', title: '{狩人|かりうど}', titleDe: 'Der Jäger',
      lines: [{ who: '{狩人|かりうど}', t: '{気|き} を つけて ください！', de: 'Pass auf dich auf!' }], choices: [{ t: 'もどる', de: 'Zurück', go: 'tavern' }] };
    return { art: 'tavern', title: '{狩人|かりうど}', titleDe: 'Der Jäger',
      lines: [{ who: '{狩人|かりうど}', t: 'ありがとう！ もう こわく ない です。', de: 'Danke! Jetzt habe ich keine Angst mehr.' }], choices: [{ t: 'もどる', de: 'Zurück', go: 'tavern' }] };
  },

  granny() {
    see(['obaasan', 'ringo']);
    const st = G.q.apple;
    const title = { title: 'おばあさん', titleDe: 'Die alte Frau', art: 'village' };
    if (st === 0) return { ...title,
      lines: [{ who: 'おばあさん', t: `${VOCAB.ringo.m} を いくつ か ください。`, de: 'Kannst du mir bitte ein paar Äpfel besorgen?' },
        { say: 'Sie wirkt nicht sicher, wie viele sie braucht …' }],
      choices: [{ t: 'いくつ ですか？', de: 'Wie viele?', fn: () => { G.flags.appleN = 2 + rnd(4); G.q.apple = 1; save(); return 'granny'; } },
        { t: 'もどる', de: 'Zurück', go: 'village' }] };
    if (st === 1) return { ...title,
      lines: [{ who: 'おばあさん', t: `${VOCAB.ringo.m} を ${count(G.flags.appleN)} ください。`, de: 'Bitte bring mir ■ Äpfel. (Die Zahl musst du selbst lesen!)' },
        { say: `Du hast ${G.inv.ringo || 0} Äpfel dabei. Kaufe sie im Laden (店).` }],
      choices: [
        { t: 'わたす', de: 'Äpfel übergeben', fn: () => giveApples() },
        { t: 'もどる', de: 'Zurück', go: 'village' }] };
    return { ...title, lines: [{ who: 'おばあさん', t: 'ありがとう。 おいしい です！', de: 'Danke. Die sind lecker!' }], choices: [{ t: 'もどる', de: 'Zurück', go: 'village' }] };
  },
};

function orderReply(id) {
  setScreen(() => ({ art: 'tavern', title: '{酒場|さかば}', titleDe: 'Die Taverne',
    lines: [{ who: 'おかみさん', t: `${VOCAB[id].m} ですね。 どうぞ。`, de: `${VOCAB[id].de}, bitte sehr.` }, { say: '+2 XP' }],
    choices: [{ t: 'ありがとう', de: 'Danke', go: 'order' }] }));
}

function signTask() {
  setScreen(() => ({ art: 'shop', title: '{看板|かんばん}', titleDe: 'Das Ladenschild',
    lines: [{ say: 'Auf dem Schild fehlt ein Zeichen. Schreibe 店 (みせ = Laden) Strich für Strich.' }],
    widget: host => drawKanji(host, '店', ok => {
      G.flags.sign = 1; if (ok) { G.kanji['店'] = 1; gain(10, 50); toast('+50 円, +10 XP'); } save(); go('shop');
    }, 'Zeichne den 1. Strich'),
    choices: [] }));
}

// buying: how many (stepper) -> shopkeeper says total in Japanese -> type the total on the keypad
function buyItem(it) {
  let n = 1;
  const v = VOCAB[it.id];
  setScreen(() => ({ art: 'shop', title: `${v.m}　${num(it.price)}{円|えん}`, titleDe: `${v.de} – ${it.price} Yen`,
    lines: [{ who: '{店主|てんしゅ}', t: 'いくつ ですか？', de: 'Wie viele?' }],
    widget: host => {
      const st = document.createElement('div'); st.className = 'stepper';
      const num_ = document.createElement('b'); num_.textContent = n;
      btn(st, '−', () => { n = Math.max(1, n - 1); num_.textContent = n; }); st.appendChild(num_); btn(st, '+', () => { n = Math.min(9, n + 1); num_.textContent = n; });
      host.appendChild(st);
    },
    choices: [{ t: 'これを ください', de: 'Das nehme ich', fn: () => payTotal(it, n) }, { t: 'やめる', de: 'Zurück', go: 'buy' }] }));
}
function payTotal(it, n) {
  const total = it.price * n, v = VOCAB[it.id];
  let msg = '';
  setScreen(() => ({ art: 'shop', title: 'おかいけい', titleDe: 'Die Rechnung',
    lines: [{ who: '{店主|てんしゅ}', t: `${count(n)} ですね。 ぜんぶで ${num(total)}{円|えん} です。`, de: 'Das macht zusammen … (Betrag tippen, um zu zahlen)' },
      ...(msg ? [{ say: msg }] : [])],
    widget: host => keypad(host, val => {
      if (val !== total) { msg = 'ちがいます。 もう いちど！ (Falscher Betrag – hör/lies die Zahl genau.)'; draw(); return; }
      if (G.gold < total) { toast('Zu wenig Geld!'); return go('shop'); }
      G.gold -= total; G.inv[it.id] = (G.inv[it.id] || 0) + n; gain(3); save(); toast(`${v.de} ×${n} gekauft`); go('buy');
    }),
    choices: [{ t: 'やめる', de: 'Abbrechen', go: 'buy' }] }));
}

function giveApples() {
  let msg = '';
  setScreen(() => ({ art: 'village', title: 'おばあさん', titleDe: 'Die alte Frau',
    lines: [{ who: 'おばあさん', t: `${VOCAB.ringo.m} を ${count(G.flags.appleN)} ください。`, de: 'Wie viele Äpfel wollte sie? Tippe die Zahl.' }, ...(msg ? [{ say: msg }] : [])],
    widget: host => keypad(host, val => {
      if (val !== G.flags.appleN) { msg = 'ちがいます… もう いちど {聞|き}いて ください。'.replace(/\{[^}]+\}/g, 'も'); msg = 'ちがいます… (Falsche Zahl – lies das Zahlwort nochmal.)'; draw(); return; }
      if ((G.inv.ringo || 0) < val) { msg = 'りんごが たりません。 (Du hast nicht genug Äpfel.)'; draw(); return; }
      G.inv.ringo -= val; G.q.apple = 2; gain(25, 100); save(); toast('Auftrag erledigt! +100 円, +25 XP'); go('granny');
    }),
    choices: [{ t: 'もどる', de: 'Zurück', go: 'granny' }] }));
}

// ---------- battle (animal vocabulary) ----------
function startBattle(foeId) {
  see(ANIMALS);
  const st = { foe: 3, round: 0, q: null, log: '', over: false };
  const nextQ = () => { st.q = st.round % 3 === 2 ? numberQuestion() : vocabQuestion(Math.random() < 0.6 ? foeId : ANIMALS[rnd(ANIMALS.length)], ANIMALS); };
  nextQ();
  setScreen(() => ({
    art: 'wolf', title: `${VOCAB[foeId].m} が あらわれた！`, titleDe: `Ein ${VOCAB[foeId].de.replace('der ', '')} erscheint!`,
    lines: [{ say: `Gegner <span class="bar">${[...Array(3)].map((_, i) => `<i class="${i < st.foe ? 'f' : ''}"></i>`).join('')}</span> &nbsp; Du: ${G.hp}/${G.maxhp} HP` },
      ...(st.log ? [{ say: st.log }] : [])],
    widget: host => {
      if (st.over) return;
      const box = document.createElement('div'); host.appendChild(box);
      askQuestion(box, st.q, ok => {
        st.round++;
        if (ok) { st.foe--; st.log = 'こうげき！ Treffer!'; } else { G.hp = Math.max(0, G.hp - 4); st.log = 'いたい！ Du verlierst 4 HP.'; }
        if (st.foe <= 0) return win();
        if (G.hp <= 0) return lose();
        nextQ(); draw();
      });
    },
    choices: [{ t: 'にげる', de: 'Fliehen', fn: () => { G.hp = Math.max(1, G.hp - 2); return 'village'; } }],
  }));
  function win() {
    G.q.wolf = 2; gain(40, 200); save();
    setScreen(() => ({ art: 'wolf', title: 'しょうり！', titleDe: 'Sieg!',
      lines: [{ who: '{狩人|かりうど}', t: 'ありがとう！ {村|むら} は あんぜん です。', de: 'Danke! Das Dorf ist sicher.' }, { say: '+200 円, +40 XP' }, { say: `<div class="lore">${LORE_WOLF}</div>` }],
      choices: [{ t: 'もどる', de: 'Zurück zum Dorf', go: 'village' }] }));
  }
  function lose() {
    G.hp = 5; save();
    setScreen(() => ({ art: 'home', title: 'まけた…', titleDe: 'Besiegt …',
      lines: [{ say: 'Du erwachst zu Hause. Der Wolf ist verschwunden – für heute Nacht. Ruh dich aus und versuch es erneut.' }], choices: [{ t: 'もどる', de: 'Weiter', go: 'home' }] }));
  }
}

// ---------- menu sheets ----------
function menuSheet(s) {
  s.innerHTML = `<h2>${lbl('メニュー', 'Menü')}</h2>`;
  btn(s, lbl('{持|も}ち{物|もの}', 'Inventar'), () => openSheet(invSheet));
  btn(s, lbl('ステータス', 'Werte & Aufträge'), () => openSheet(statusSheet));
  btn(s, lbl('{勉強|べんきょう}', 'Lernen: Wiederholen, Kanji, Wörter'), () => openSheet(studySheet));
  btn(s, lbl('セーブ', 'Speichern'), () => { save(); toast('Gespeichert ✔'); });
  btn(s, lbl('ロード', 'Laden'), () => { try { G = { ...DEFAULT(), ...JSON.parse(localStorage.getItem(KEY)) }; go(G.loc in NODES ? G.loc : 'village'); closeSheet(); toast('Geladen'); } catch { toast('Kein Spielstand'); } });
  btn(s, 'Backup kopieren / einfügen', () => openSheet(backupSheet));
  btn(s, 'Schließen', closeSheet);
}
function backupSheet(s) {
  s.innerHTML = '<h2>Backup</h2><div class="de">Kopiere den Text zum Sichern oder füge einen gesicherten Text ein und tippe „Importieren“.</div>';
  const ta = document.createElement('textarea'); ta.style.cssText = 'width:100%;height:120px;background:#12151d;color:#d3cdbd;border:1px solid #232838;border-radius:8px;margin:10px 0'; ta.value = JSON.stringify(G); s.appendChild(ta);
  btn(s, 'Importieren', () => { try { G = { ...DEFAULT(), ...JSON.parse(ta.value) }; save(); closeSheet(); go('village'); toast('Importiert'); } catch { toast('Ungültiger Text'); } });
  btn(s, 'Zurück', () => openSheet(menuSheet));
}
function invSheet(s) {
  s.innerHTML = `<h2>${lbl('{持|も}ち{物|もの}', 'Inventar')}</h2>`;
  const ids = Object.keys(G.inv).filter(k => G.inv[k] > 0);
  if (!ids.length) s.insertAdjacentHTML('beforeend', '<div class="de">Leer.</div>');
  for (const id of ids) {
    const it = SHOP.find(x => x.id === id), row = document.createElement('div'); row.className = 'kv';
    row.innerHTML = `<span class="jp">${J(VOCAB[id].m)}</span><span>×${G.inv[id]} ${G.help ? ' · ' + VOCAB[id].de : ''}</span>`; s.appendChild(row);
    if (it && it.heal) btn(s, `${lbl('つかう', 'Benutzen (+' + it.heal + ' HP)')}`, () => { G.inv[id]--; G.hp = Math.min(G.maxhp, G.hp + it.heal); save(); renderStats(); refreshSheet(); });
  }
  btn(s, 'Zurück', () => openSheet(menuSheet));
}
function statusSheet(s) {
  s.innerHTML = `<h2>${lbl('ステータス', 'Werte')}</h2>`;
  const row = (a, b) => s.insertAdjacentHTML('beforeend', `<div class="kv"><span class="jp">${a}</span><span>${b}</span></div>`);
  row('HP', `${G.hp} / ${G.maxhp}`); row('Lv', G.lv); row('XP', `${G.xp} / ${G.lv * 40}`); row(J('お{金|かね}'), `${G.gold} 円`);
  s.insertAdjacentHTML('beforeend', `<h2 style="margin-top:16px">${lbl('クエスト', 'Aufträge')}</h2>`);
  const stat = n => ['offen', 'läuft', '✔ erledigt'][n];
  row(J(`${VOCAB.ringo.m} の おつかい`), G.q.apple === 1 ? `${J(VOCAB.ringo.m)} × ${J(count(G.flags.appleN))}` : stat(G.q.apple));
  row(J(`${VOCAB.okami.m}たいじ`), stat(G.q.wolf));
  btn(s, 'Zurück', () => openSheet(menuSheet));
}
function studySheet(s) {
  s.innerHTML = `<h2>${lbl('{勉強|べんきょう}', 'Lernen')}</h2>`;
  btn(s, lbl('ふくしゅう', 'Wiederholung (Vokabeln & Zahlen)'), () => { closeSheet(); startReview(); });
  btn(s, lbl('{漢字|かんじ}れんしゅう', 'Kanji schreiben'), () => openSheet(kanjiSheet));
  btn(s, lbl('{単語帳|たんごちょう}', 'Wörterbuch (bisher gesehen)'), () => openSheet(wordSheet));
  btn(s, 'Schließen', closeSheet);
}
function wordSheet(s) {
  s.innerHTML = `<h2>${lbl('{単語帳|たんごちょう}', 'Wörterbuch')}</h2>`;
  for (const id of Object.keys(VOCAB).filter(k => G.seen[k])) {
    const r = document.createElement('div'); r.className = 'kv'; r.innerHTML = `<span class="jp">${J(VOCAB[id].m)}</span><span>${VOCAB[id].de}</span>`; r.onclick = () => speak(VOCAB[id].m); s.appendChild(r);
  }
  btn(s, 'Zurück', () => openSheet(studySheet));
}
function kanjiSheet(s) {
  s.innerHTML = `<h2>${lbl('{漢字|かんじ}れんしゅう', 'Kanji schreiben')}</h2><div class="grid"></div>`;
  const g = s.querySelector('.grid');
  for (const k of Object.keys(KANJI)) {
    const b = btn(g, `<span class="jp">${k}</span>${G.help ? `<small class="de">${KANJI[k][1]}</small>` : ''}`, () => { closeSheet(); practiceKanji(k); });
    if (G.kanji[k]) b.classList.add('ok');
  }
  btn(s, 'Zurück', () => openSheet(studySheet));
}
function practiceKanji(k) {
  setScreen(() => ({ art: 'home', title: `${k}　${KANJI[k][0]}`, titleDe: KANJI[k][1],
    lines: [{ say: 'Schreibe das Zeichen Strich für Strich. Nach zwei Fehlern erscheint ein Hinweis.' }],
    widget: host => drawKanji(host, k, ok => { if (ok) { if (!G.kanji[k]) gain(8); G.kanji[k] = 1; save(); toast('Gespeichert ✔'); } go(G.loc in NODES ? G.loc : 'village'); }, 'Zeichne den 1. Strich'),
    choices: [{ t: 'もどる', de: 'Abbrechen', go: 'home' }] }));
}
function startReview() {
  const seen = Object.keys(VOCAB).filter(k => G.seen[k]);
  const pool = seen.length >= 4 ? seen : Object.keys(VOCAB);
  const now = Date.now();
  const due = shuffle(pool.filter(k => !G.srs[k] || G.srs[k].due <= now)).slice(0, 7);
  const qs = [...(due.length ? due : shuffle(pool).slice(0, 7)).map(id => vocabQuestion(id, pool)), numberQuestion()];
  let i = 0, right = 0;
  const step = () => {
    if (i >= qs.length) { gain(right * 2); save(); return setScreen(() => ({ art: 'home', title: 'おわり！', titleDe: 'Geschafft!', lines: [{ say: `${right} von ${qs.length} richtig. +${right * 2} XP` }], choices: [{ t: 'もどる', de: 'Zurück', go: 'home' }] })); }
    setScreen(() => ({ art: 'home', title: `ふくしゅう ${i + 1}/${qs.length}`, titleDe: 'Wiederholung', lines: [],
      widget: host => askQuestion(host, qs[i], ok => { if (ok) right++; i++; step(); }), choices: [] }));
  };
  step();
}

// ---------- start ----------
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
go(G.loc in NODES ? G.loc : 'village');
