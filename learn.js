// Learning UI: question rendering, daily round, dictionary. Game state and helpers come from app.js via initLearn().
import * as E from './engine.js';
import { render, speakText } from './lang.js';
import { CONTENT } from './data.js';
import { displayDe, lemma } from './german.js';

let A;   // api from app.js: G(), save, setScreen, go, openSheet, closeSheet, btn, toast, speak, gain, J, lbl, refreshSheet
export const initLearn = api => { A = api; };
const G = () => A.G();
const C = () => E.mergeCustom(CONTENT, G());
const Jf = (src, furi) => render(src, G().mode, furi && G().furi);
const localDay = () => new Date().toLocaleDateString('sv-SE');   // YYYY-MM-DD in the player's time zone
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** the correct answer as readable HTML, shown after a mistake */
function reveal(id) {
  if (id.startsWith('s:')) { const s = CONTENT.sentences.find(x => x.id === id.slice(2)); return s ? `<span class="jp">${Jf(s.jp, true)}</span> = ${s.de}` : ''; }
  const w = C().byId[id]; return w ? `<span class="jp">${Jf(w.jp, true)}</span> = ${displayDe(w)}` : '';
}
const answered = (q, ok) => { E.recordAnswer(G(), q.id, ok); A.save(); };

/** multiple-choice / sentence-building question (from the engine) */
export function renderQuestion(host, q, done) {
  host.innerHTML = '';
  const box = document.createElement('div'); box.className = 'q'; host.appendChild(box);
  const finish = (ok, locked) => {
    answered(q, ok); locked.forEach(b => b.disabled = true);
    const fb = document.createElement('div'); fb.className = 'kmsg'; fb.innerHTML = ok ? '✔ richtig' : `✘ ${reveal(q.id)}`; host.appendChild(fb);
    setTimeout(() => done(ok), ok ? 650 : 1800);
  };
  const promptHtml = p => (p.jp ? `<span class="jp">${Jf(p.jp, !q.hideFuri)}</span>` : p.de);
  if (q.kind === 'mc') {
    box.innerHTML = promptHtml(q.prompt) + (q.type.startsWith('s_') && q.prompt.de ? '<div class="de">Wie sagt man das auf Japanisch?</div>' : '');
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px'; host.appendChild(wrap);
    const btns = q.options.map(o => A.btn(wrap, o.jp ? `<span class="jp">${Jf(o.jp, !q.hideFuri)}</span>` : o.de, () => {
      const ok = o.id === q.correct; btns[q.options.indexOf(o)].classList.add(ok ? 'ok' : 'no'); finish(ok, btns);
    }));
  } else { // order the words
    box.innerHTML = `${q.prompt.de}<div class="de">Setze den Satz auf Japanisch zusammen (tippe die Wörter in der richtigen Reihenfolge).</div>`;
    const line = document.createElement('div'); line.className = 'oline'; host.appendChild(line);
    const pool = document.createElement('div'); pool.className = 'opool'; host.appendChild(pool);
    const picked = []; let locked = false;
    const draw = () => {
      line.innerHTML = picked.map((c, i) => `<button class="chipw" data-i="${i}">${Jf(c.t, true)}</button>`).join('') || '<span class="de">…</span>';
      pool.innerHTML = q.chips.map((t, i) => (picked.some(p => p.i === i) ? '' : `<button class="chipw" data-c="${i}">${Jf(t, true)}</button>`)).join('');
      if (locked) return;
      line.querySelectorAll('button').forEach(b => b.onclick = () => { picked.splice(+b.dataset.i, 1); draw(); });
      pool.querySelectorAll('button').forEach(b => b.onclick = () => {
        picked.push({ i: +b.dataset.c, t: q.chips[+b.dataset.c] }); draw();
        if (picked.length === q.answer.length) {
          locked = true; const ok = picked.every((p, i) => p.t === q.answer[i]);
          line.classList.add(ok ? 'okline' : 'noline'); finish(ok, [...host.querySelectorAll('button')]);
        }
      });
    };
    draw();
  }
}

/** card shown when a new word is introduced */
function renderIntro(host, task, done) {
  const w = C().byId[task.id], it = E.ensureItem(G(), task.id); if (!it.intro) it.intro = Date.now(); A.save();
  host.innerHTML = `<div class="q intro"><div class="de" style="margin-bottom:6px">Neues Wort</div><span class="jp big">${Jf(w.jp, true)}</span>
    <div class="de" style="font-size:16px;color:var(--fg);margin-top:6px">${displayDe(w)}</div>${w.masu ? `<div class="de">höflich: <span class="jp">${Jf(w.masu, true)}</span></div>` : ''}${w.note ? `<div class="de">${w.note}</div>` : ''}</div>`;
  const row = document.createElement('div'); row.className = 'row';
  A.btn(row, '🔊 Anhören', () => A.speak(w.jp), 'small'); A.btn(row, 'Weiter ▸', () => done(), 'small'); host.appendChild(row);
}

// ------------------------------------------------------------------ daily round
export function startRound(size = 6) {
  const tasks = E.buildSession(G(), CONTENT, { size });
  if (!tasks.length) { A.toast('Noch nichts zu lernen'); return; }
  E.startSession(G(), tasks); A.save();
  const st = { i: 0, ok: 0, asked: 0, fresh: [] };
  const step = () => {
    if (st.i >= tasks.length) return finish();
    const task = E.makeTask(G(), CONTENT, tasks[st.i]);
    const isIntro = task.kind === 'intro';
    if (isIntro) st.fresh.push(task.id);
    const ask = () => A.setScreen(() => ({ art: 'home', title: `{今日|きょう}の ふくしゅう　${st.i + 1}/${tasks.length}`, titleDe: 'Tagesrunde', lines: [],
      widget: host => renderQuestion(host, task.q, ok => { st.asked++; if (ok) st.ok++; st.i++; step(); }), choices: [] }));
    if (isIntro) A.setScreen(() => ({ art: 'home', title: `{今日|きょう}の ふくしゅう　${st.i + 1}/${tasks.length}`, titleDe: 'Tagesrunde', lines: [],
      widget: host => renderIntro(host, task, ask), choices: [] }));
    else ask();
  };
  const finish = () => {
    const today = localDay(), firstToday = G().flags.lastDaily !== today;
    G().flags.lastDaily = today; E.completeDaily(G(), today);
    if (firstToday) A.gain(10, 20);
    A.save();
    const fresh = st.fresh.map(id => C().byId[id]).filter(Boolean);
    A.setScreen(() => ({ art: 'home', title: 'おつかれさま！', titleDe: 'Geschafft!',
      lines: [{ say: `${st.ok} von ${st.asked} richtig.${firstToday ? ' +10 XP, +20 円 für die erste Tagesrunde.' : ''} Serie: <b>${G().streak.days}</b> ${G().streak.days === 1 ? 'Tag' : 'Tage'}.` },
        ...(fresh.length ? [{ say: 'Neue Wörter: ' + fresh.map(w => `<span class="jp">${Jf(w.jp, true)}</span> (${displayDe(w)})`).join(', ') }] : [])],
      choices: [{ t: 'もう いちど', de: 'Noch eine Runde', fn: () => startRound(size) }, { t: 'むらへ もどる', de: 'Zurück ins Dorf', fn: () => A.go(G().loc in A.NODES ? G().loc : 'village') }] }));
  };
  step();
}

// ------------------------------------------------------------------ dictionary
const KANA_ONLY = /^[ぁ-ゖァ-ヺー　 ]+$/;
const checkLabel = w => (w.custom ? 'ungeprüft (eigenes Wort)' : w.status === 'reviewed' ? 'geprüft' : 'korrigiert, Prüfung offen');
let dictTab = 'learned', dictQuery = '';

export function dictSheet(s) {
  const g = G(), c = C();
  s.innerHTML = `<h2>${A.lbl('{単語帳|たんごちょう}', 'Wörterbuch')}</h2>`;
  const tabs = document.createElement('div'); tabs.className = 'row'; tabs.style.marginBottom = '10px'; s.appendChild(tabs);
  for (const [k, label] of [['learned', 'Gelernt'], ['all', 'Alle Wörter'], ['own', 'Eigene'], ['wish', 'Wunschliste']]) {
    const b = A.btn(tabs, label, () => { dictTab = k; A.refreshSheet(); }, 'small'); if (dictTab === k) b.classList.add('ok');
  }
  if (dictTab === 'learned' || dictTab === 'all') {
    const inp = document.createElement('input'); inp.className = 'search'; inp.placeholder = 'Suchen (Deutsch, Kana, Rōmaji)…'; inp.value = dictQuery; s.appendChild(inp);
    const list = document.createElement('div'); s.appendChild(list);
    const fill = () => {
      const q = dictQuery.trim().toLowerCase(); list.innerHTML = '';
      const hay = w => [displayDe(w), lemma(w), w.jp.replace(/\{([^|}]+)\|([^}]+)\}/g, '$1$2'), render(w.jp, 'kana'), render(w.jp, 'romaji')].join(' ').toLowerCase();
      let ws = c.words.filter(w => E.usable(w) && (dictTab === 'learned' ? E.isIntro(g, w.id) : !E.isIntro(g, w.id)));
      if (q) ws = ws.filter(w => hay(w).includes(q));
      if (!ws.length) list.innerHTML = `<div class="de">${dictTab === 'learned' ? 'Noch keine Wörter gelernt – starte die Tagesrunde!' : 'Nichts gefunden.'}</div>`;
      for (const w of ws.slice(0, 60)) {
        const it = g.items[w.id], row = document.createElement('div'); row.className = 'drow';
        row.innerHTML = `<div class="dtop"><span class="jp">${Jf(w.jp, true)}</span><span class="dde">${displayDe(w)}</span></div><div class="de">${checkLabel(w)}</div>`;
        if (dictTab === 'learned') {
          const sl = document.createElement('div'); sl.className = 'dslide';
          sl.innerHTML = `<input type="range" min="1" max="5" step="1" value="${it.conf}" aria-label="Sicherheit"><span class="clabel">${E.CONF_LABELS[it.conf]}</span>`;
          const lock = document.createElement('button'); lock.className = 'chip' + (it.pinned ? '' : ' off'); lock.textContent = it.pinned ? '🔒' : '🔓'; lock.title = 'Wert festhalten (wird nicht automatisch geändert)';
          sl.appendChild(lock); row.appendChild(sl);
          const range = sl.querySelector('input'), lab = sl.querySelector('.clabel');
          range.oninput = () => { E.setConfidence(g, w.id, +range.value); lab.textContent = E.CONF_LABELS[+range.value]; A.save(); };
          lock.onclick = () => { it.pinned = !it.pinned; lock.textContent = it.pinned ? '🔒' : '🔓'; lock.classList.toggle('off', !it.pinned); A.save(); };
        } else {
          const r = document.createElement('div'); r.className = 'row'; r.style.marginTop = '6px';
          A.btn(r, 'Kenne ich schon', () => { E.setConfidence(g, w.id, 4); A.save(); A.toast('Zu „Gelernt“ hinzugefügt'); fill(); }, 'small'); row.appendChild(r);
        }
        list.appendChild(row);
      }
    };
    inp.oninput = () => { dictQuery = inp.value; fill(); }; fill();
  } else if (dictTab === 'own') {
    s.insertAdjacentHTML('beforeend', '<div class="de">Eigene Wörter werden nicht vom Prüfteam kontrolliert und sind als „ungeprüft“ markiert. Schreibe das Japanische in Kana.</div>');
    const f = document.createElement('div'); f.className = 'form';
    f.innerHTML = '<input id="cj" placeholder="Japanisch (Kana), z. B. ねこ"><input id="cd" placeholder="Deutsch, z. B. die Katze">';
    s.appendChild(f); A.btn(s, 'Hinzufügen', () => {
      const jp = f.querySelector('#cj').value.trim(), de = f.querySelector('#cd').value.trim();
      if (!KANA_ONLY.test(jp) || !de) return A.toast('Bitte Kana und Deutsch ausfüllen');
      const id = 'c_' + Date.now(); g.custom.push({ id, pos: 'expr', jp, de, tags: [] }); E.setConfidence(g, id, 3); A.save(); A.toast('Hinzugefügt'); A.refreshSheet();
    });
    for (const cw of g.custom) { const r = document.createElement('div'); r.className = 'kv'; r.innerHTML = `<span class="jp">${Jf(cw.jp, true)}</span><span>${cw.de}</span>`; s.appendChild(r); }
  } else {
    s.insertAdjacentHTML('beforeend', '<div class="de">Welche Wörter möchtest du lernen? Notiere sie hier und schicke mir die Liste – ich prüfe sie und nehme sie in die nächste Version auf.</div>');
    const f = document.createElement('div'); f.className = 'form'; f.innerHTML = '<input id="wt" placeholder="Wunsch, z. B. „Schwert“ oder „Wie viel Uhr ist es?“">'; s.appendChild(f);
    A.btn(s, 'Hinzufügen', () => { const t = f.querySelector('#wt').value.trim(); if (!t) return; g.wishes.push({ t, ts: Date.now() }); A.save(); A.refreshSheet(); });
    g.wishes.forEach((w, i) => { const r = document.createElement('div'); r.className = 'kv'; r.innerHTML = `<span>${w.t}</span>`; const x = document.createElement('button'); x.className = 'chip'; x.textContent = '✕'; x.onclick = () => { g.wishes.splice(i, 1); A.save(); A.refreshSheet(); }; r.appendChild(x); s.appendChild(r); });
    if (g.wishes.length) A.btn(s, 'Liste kopieren', () => { navigator.clipboard?.writeText(g.wishes.map(w => '- ' + w.t).join('\n')).then(() => A.toast('Kopiert'), () => A.toast('Kopieren nicht möglich')); });
  }
  A.btn(s, 'Zurück', () => A.openSheet(A.studySheet));
}
