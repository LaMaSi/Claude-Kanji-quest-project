// Stroke-by-stroke kanji drawing with stroke-order and shape checking (KanjiVG data, 109x109 box).
import { STROKES } from './kanjidata.js';
const NS = 'http://www.w3.org/2000/svg';
const N = 24;

function resample(pts, n = N) {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1] || 1, out = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const t = L * i / (n - 1);
    while (j < pts.length - 1 && d[j] < t) j++;
    const seg = d[j] - d[j - 1] || 1, u = Math.min(1, Math.max(0, (t - d[j - 1]) / seg));
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u]);
  }
  return { pts: out, len: L };
}
const meanDist = (a, b) => a.reduce((s, p, i) => s + Math.hypot(p[0] - b[i][0], p[1] - b[i][1]), 0) / a.length;

export function drawKanji(host, ch, onDone, note = '') {
  const strokes = STROKES[ch];
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute';
  document.body.appendChild(svg);
  const targets = strokes.map(d => {
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p);
    const L = p.getTotalLength(), raw = [];
    for (let i = 0; i < 60; i++) { const q = p.getPointAtLength(L * i / 59); raw.push([q.x, q.y]); }
    return { d, ...resample(raw), path2d: new Path2D(d) };
  });

  host.innerHTML = '';
  const SIZE = Math.min(host.clientWidth || 320, 340), S = SIZE / 109;
  const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(SIZE * devicePixelRatio);
  cv.style.width = cv.style.height = SIZE + 'px'; cv.className = 'kcanvas';
  const msg = document.createElement('div'); msg.className = 'kmsg';
  host.append(cv, msg);
  const c = cv.getContext('2d');
  let idx = 0, fails = 0, cur = null, hint = false, done = false;
  const say = t => { msg.textContent = t; };

  function paint() {
    const k = cv.width / 109;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(k, 0, 0, k, 0, 0);
    c.strokeStyle = '#1e2230'; c.lineWidth = 0.6; c.setLineDash([2, 2]);
    c.strokeRect(0.5, 0.5, 108, 108); c.beginPath(); c.moveTo(54.5, 0); c.lineTo(54.5, 109); c.moveTo(0, 54.5); c.lineTo(109, 54.5); c.stroke(); c.setLineDash([]);
    c.lineCap = 'round'; c.lineJoin = 'round';
    targets.forEach((t, i) => { // faint full guide, finished strokes bright
      c.lineWidth = i < idx ? 4.6 : 4; c.strokeStyle = i < idx ? '#d8d1bf' : '#222736'; c.stroke(t.path2d);
    });
    if (hint && idx < targets.length) { c.strokeStyle = '#8a6a34'; c.lineWidth = 4; c.setLineDash([5, 4]); c.stroke(targets[idx].path2d); c.setLineDash([]);
      const s = targets[idx].pts[0]; c.fillStyle = '#d29a3e'; c.beginPath(); c.arc(s[0], s[1], 3.2, 0, 7); c.fill(); }
    if (cur && cur.length > 1) { c.strokeStyle = '#e0b060'; c.lineWidth = 4.2; c.beginPath(); cur.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
  }

  function judge(pts) {
    const u = resample(pts), t = targets[idx];
    if (u.len < t.len * 0.35 || u.len < 8) return 'short';
    const fwd = meanDist(u.pts, t.pts), rev = meanDist(u.pts.slice().reverse(), t.pts);
    const endsOk = Math.hypot(...[u.pts[0][0] - t.pts[0][0], u.pts[0][1] - t.pts[0][1]]) < 26 &&
                   Math.hypot(u.pts[N - 1][0] - t.pts[N - 1][0], u.pts[N - 1][1] - t.pts[N - 1][1]) < 30;
    if (fwd < 15 && endsOk) return 'ok';
    if (rev < 15) return 'reverse';
    for (let j = 0; j < targets.length; j++) if (j !== idx && j > idx && meanDist(u.pts, targets[j].pts) < 12) return 'order';
    return 'bad';
  }

  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
  cv.addEventListener('pointerdown', e => { if (done) return; cv.setPointerCapture(e.pointerId); cur = [pos(e)]; paint(); });
  cv.addEventListener('pointermove', e => { if (!cur) return; cur.push(pos(e)); paint(); });
  const end = () => {
    if (!cur) return; const pts = cur; cur = null;
    if (pts.length < 3) { paint(); return; }
    const r = judge(pts);
    if (r === 'ok') {
      idx++; fails = 0; hint = false;
      if (idx === targets.length) { done = true; say('✔ かんぺき！ Perfekt!'); paint(); setTimeout(() => finish(true), 700); return; }
      say(`${idx} / ${targets.length}`);
    } else {
      fails++;
      say({ short: 'Zu kurz – zieh den ganzen Strich.', reverse: 'Richtig, aber falsche Richtung!', order: 'Falsche Reihenfolge – dieser Strich kommt später.', bad: 'Nicht ganz – versuch es nochmal.' }[r]);
      if (fails >= 2) hint = true;
      cv.classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake');
    }
    paint();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  const bar = document.createElement('div'); bar.className = 'kbar';
  const b = (t, f) => { const x = document.createElement('button'); x.className = 'btn small'; x.textContent = t; x.onclick = f; bar.appendChild(x); };
  b('💡 Hinweis', () => { hint = true; paint(); });
  b('↺ Neu', () => { idx = 0; fails = 0; hint = false; done = false; say(note); paint(); });
  b('Überspringen', () => finish(false));
  host.appendChild(bar);
  function finish(ok) { svg.remove(); onDone(ok); }
  say(note); paint();
}

export const hasKanji = ch => !!STROKES[ch];
