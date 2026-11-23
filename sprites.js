// Pixel sprites drawn in code: light pixels on dark, plus one amber accent (value 2).
// Objects/animals/places are 24x24, portraits 32x32. Every noun in content/words.json needs an entry (tools/validate.mjs checks it).
import { drawPortrait, NPC_LOOKS } from './people.js';
const FG = '#d8d1bf', BG = '#0b0d12', ACC = '#d29a3e';

function mk(n) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), col = v => (typeof v === 'string' ? v : v === 0 ? BG : v === 2 ? ACC : FG);
  const g = {
    c, n,
    px(a, b, v = 1) { x.fillStyle = col(v); x.fillRect(Math.round(a), Math.round(b), 1, 1); },
    rect(a, b, w, h, v = 1) { x.fillStyle = col(v); x.fillRect(a, b, w, h); },
    line(x0, y0, x1, y1, v = 1) {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
      for (;;) { g.px(x0, y0, v); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    },
    disc(cx, cy, r, v = 1) { for (let y = -r; y <= r; y++) for (let a = -r; a <= r; a++) if (a * a + y * y <= r * r + r * 0.5) g.px(cx + a, cy + y, v); },
    ring(cx, cy, r, v = 1) { for (let y = -r; y <= r; y++) for (let a = -r; a <= r; a++) { const d = a * a + y * y; if (d <= r * r + r * 0.5 && d >= (r - 1) * (r - 1) + (r - 1) * 0.2) g.px(cx + a, cy + y, v); } },
    ell(cx, cy, rx, ry, v = 1) { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.5))); for (let a = -w; a <= w; a++) g.px(cx + a, cy + y, v); } },
    poly(pts, v = 1) {
      let mn = 1e9, mx = -1e9; for (const p of pts) { mn = Math.min(mn, p[1]); mx = Math.max(mx, p[1]); }
      for (let y = Math.ceil(mn); y <= mx; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) g.rect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1, v);
      }
    },
    dither(a, b, w, h, ph = 0, v = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + ph) % 2 === 0) g.px(a + i, b + j, v); },
  };
  g.rect(0, 0, n, n, 0);
  return g;
}
const tree = (g, x, y, s = 1) => { g.rect(x, y - 3 * s, s + 1, 3 * s); g.poly([[x + s - 4 * s, y - 3 * s], [x + s, y - 11 * s], [x + s + 4 * s, y - 3 * s]]); g.poly([[x + s - 3 * s, y - 7 * s], [x + s, y - 13 * s], [x + s + 3 * s, y - 7 * s]]); };
const house = (g, x, y, w, h) => { g.rect(x, y, w, h); g.poly([[x - 1, y], [x + w / 2, y - Math.round(w / 2.2)], [x + w, y]]); g.rect(x + w - 4, y + h - 4, 2, 4, 0); g.rect(x + 1, y + 2, 2, 2, 0); };

export const SPRITES = {
  // ---- things
  ringo: () => { const g = mk(24); g.disc(8, 14, 6); g.disc(15, 14, 6); g.rect(8, 9, 8, 11); g.px(12, 8, 0); g.px(12, 9, 0); g.px(11, 8, 0); g.line(12, 8, 13, 3); g.poly([[14, 4], [20, 2], [19, 8], [15, 7]], 2); g.px(6, 12, 0); g.px(6, 13, 0); g.px(7, 11, 0); g.px(12, 20, 0); g.px(11, 20, 0); g.px(13, 20, 0); return g; },
  pan: () => { const g = mk(24); g.poly([[2, 16], [3, 11], [7, 7], [17, 7], [21, 11], [22, 16], [20, 19], [4, 19]]); for (const x of [7, 11, 15]) g.line(x, 8, x + 1, 13, 0); g.rect(3, 17, 19, 2, 2); g.px(2, 16, 0); g.px(22, 16, 0); return g; },
  mizu: () => { const g = mk(24); g.line(5, 4, 8, 20); g.line(19, 4, 16, 20); g.line(8, 20, 16, 20); g.line(5, 4, 19, 4); g.dither(8, 10, 9, 10, 0); g.rect(7, 10, 11, 1, 2); for (let x = 7; x < 18; x += 2) g.px(x, 9, 2); g.px(11, 14, 0); g.px(14, 16, 0); g.px(10, 17, 0); return g; },
  ocha: () => { const g = mk(24); g.poly([[4, 11], [18, 11], [16, 19], [6, 19]]); g.ring(19, 14, 3); g.px(18, 12, 0); g.rect(3, 20, 16, 1); g.rect(5, 12, 12, 1, 2); for (const [x, y] of [[8, 3], [9, 4], [8, 5], [9, 6], [8, 7], [12, 2], [11, 3], [12, 4], [11, 5], [12, 6]]) g.px(x, y, 2); return g; },
  osake: () => { const g = mk(24); g.rect(10, 5, 4, 5); g.rect(9, 3, 6, 2, 2); g.poly([[7, 10], [17, 10], [18, 13], [18, 21], [6, 21], [6, 13]]); g.rect(8, 14, 8, 5, 0); g.rect(10, 16, 4, 1, 2); g.px(9, 12, 0); return g; },
  kusuri: () => { const g = mk(24); g.rect(8, 3, 8, 3); g.rect(9, 6, 6, 3, 1); g.disc(12, 15, 7); g.disc(12, 15, 5, 0); g.rect(11, 11, 2, 8, 2); g.rect(9, 14, 6, 2, 2); return g; },
  tamago: () => { const g = mk(24); g.disc(12, 15, 6); g.disc(12, 10, 5); g.rect(7, 12, 11, 3); g.px(8, 9, 0); g.px(8, 10, 0); g.px(9, 8, 0); g.px(9, 9, 0); g.px(8, 16, 0); g.rect(15, 18, 3, 1, 0); return g; },
  sakana: () => { const g = mk(24); g.ell(10, 13, 8, 5); g.poly([[16, 13], [23, 7], [23, 19]]); g.poly([[8, 9], [12, 4], [14, 9]]); g.px(5, 12, 0); g.line(8, 9, 8, 17, 0); for (const x of [12, 14, 16]) g.line(x, 10, x, 16, 2); return g; },
  niku: () => { const g = mk(24); g.ell(9, 10, 7, 6, 2); g.line(13, 14, 19, 20); g.line(14, 14, 20, 20); g.line(12, 14, 18, 20); g.disc(19, 20, 2); g.disc(21, 18, 2); g.disc(17, 22, 1); g.px(6, 8, 0); g.px(7, 7, 0); g.px(10, 12, 0); g.px(5, 11, 0); return g; },
  en: () => { const g = mk(24); g.disc(12, 12, 9, 2); g.disc(12, 12, 7, 0); g.disc(12, 12, 6, 1); g.rect(10, 10, 4, 4, 0); g.px(8, 8, 0); g.px(8, 9, 0); g.px(9, 8, 0); return g; },
  okane: () => { const g = mk(24); g.poly([[8, 9], [16, 9], [20, 15], [19, 21], [5, 21], [4, 15]]); g.rect(8, 6, 8, 3, 2); g.line(8, 5, 6, 3); g.line(16, 5, 18, 3); g.ring(12, 15, 3, 0); g.rect(11, 14, 2, 2, 0); return g; },
  // ---- animals
  okami: () => { const g = mk(24); g.poly([[4, 2], [10, 9], [3, 13]]); g.poly([[20, 2], [14, 9], [21, 13]]); g.poly([[5, 9], [19, 9], [21, 14], [15, 21], [12, 23], [9, 21], [3, 14]]); g.rect(7, 13, 3, 2, 2); g.rect(14, 13, 3, 2, 2); g.px(8, 13, 0); g.px(15, 13, 0); g.rect(11, 19, 2, 2, 0); g.line(12, 17, 12, 18, 0); g.line(9, 20, 7, 22, 0); g.line(15, 20, 17, 22, 0); return g; },
  inu: () => { const g = mk(24); g.poly([[2, 4], [8, 5], [8, 17], [4, 20], [1, 12]], 2); g.poly([[22, 4], [16, 5], [16, 17], [20, 20], [23, 12]], 2); g.disc(12, 12, 7); g.disc(9, 10, 1, 0); g.disc(15, 10, 1, 0); g.ell(12, 17, 4, 3, 0); g.rect(11, 14, 3, 2, 1); g.px(11, 15, 0); g.px(13, 15, 0); g.line(12, 17, 12, 18, 1); g.rect(11, 19, 3, 3, 2); return g; },
  neko: () => { const g = mk(24); g.poly([[4, 1], [10, 7], [4, 10]]); g.poly([[20, 1], [14, 7], [20, 10]]); g.disc(12, 14, 8); g.rect(7, 12, 3, 3, 2); g.rect(14, 12, 3, 3, 2); g.rect(8, 13, 1, 1, 0); g.rect(15, 13, 1, 1, 0); g.px(12, 16, 0); g.line(2, 15, 6, 16, 1); g.line(22, 15, 18, 16, 1); g.line(9, 19, 11, 18, 0); g.line(15, 19, 13, 18, 0); return g; },
  tori: () => { const g = mk(24); g.disc(11, 14, 6); g.disc(16, 8, 4); g.poly([[18, 7], [23, 9], [18, 11]], 2); g.poly([[7, 12], [1, 8], [3, 16]]); g.line(8, 14, 12, 17, 0); g.line(9, 13, 12, 15, 0); g.px(17, 7, 0); g.line(10, 19, 10, 22); g.line(13, 19, 13, 22); g.line(8, 22, 10, 22); g.line(11, 22, 13, 22); return g; },
  uma: () => { const g = mk(24); g.poly([[13, 2], [20, 4], [21, 14], [19, 20], [14, 12]], 2); g.poly([[7, 5], [13, 2], [17, 6], [18, 14], [18, 23], [11, 23], [9, 18], [5, 16], [4, 10]]); g.poly([[7, 5], [8, 0], [11, 3]]); g.poly([[11, 3], [13, 0], [15, 4]]); g.px(10, 9, 0); g.px(11, 9, 0); g.px(11, 21, 0); g.px(14, 21, 0); g.line(8, 15, 9, 16, 0); return g; },
  kuma: () => { const g = mk(24); g.disc(5, 5, 3); g.disc(19, 5, 3); g.disc(5, 5, 1, 0); g.disc(19, 5, 1, 0); g.disc(12, 13, 8); g.ell(12, 17, 4, 3, 0); g.rect(11, 15, 3, 2, 1); g.disc(8, 11, 1, 0); g.disc(16, 11, 1, 0); g.line(12, 17, 12, 19, 1); return g; },
  kitsune: () => { const g = mk(24); g.poly([[3, 2], [9, 8], [3, 12]], 2); g.poly([[21, 2], [15, 8], [21, 12]], 2); g.poly([[3, 9], [21, 9], [22, 14], [12, 23], [2, 14]], 2); g.poly([[3, 14], [12, 17], [21, 14], [12, 23]], 1); g.line(6, 11, 9, 12, 0); g.line(18, 11, 15, 12, 0); g.rect(11, 20, 2, 2, 0); return g; },
  ushi: () => { const g = mk(24); g.poly([[6, 8], [3, 3], [1, 2], [2, 6], [5, 9]]); g.poly([[18, 8], [21, 3], [23, 2], [22, 6], [19, 9]]); g.ell(2, 11, 2, 1); g.ell(22, 11, 2, 1); g.poly([[6, 7], [18, 7], [19, 16], [16, 22], [8, 22], [5, 16]]); g.disc(8, 12, 1, 0); g.disc(16, 12, 1, 0); g.ell(12, 18, 5, 3, 2); g.px(10, 18, 0); g.px(14, 18, 0); return g; },
  buta: () => { const g = mk(24); g.poly([[5, 3], [10, 7], [4, 10]]); g.poly([[19, 3], [14, 7], [20, 10]]); g.disc(12, 13, 8); g.ell(12, 16, 4, 3, 2); g.px(11, 16, 0); g.px(13, 16, 0); g.disc(8, 11, 1, 0); g.disc(16, 11, 1, 0); return g; },
  // ---- places
  mura: () => { const g = mk(24); house(g, 1, 14, 8, 7); house(g, 12, 11, 10, 10); g.rect(0, 21, 24, 1); g.dither(0, 22, 24, 2, 0); tree(g, 10, 21, 1); g.disc(21, 3, 2, 2); return g; },
  mise: () => { const g = mk(24); g.rect(3, 10, 18, 11); for (let i = 0; i < 6; i++) g.rect(3 + i * 3, 6, 3, 5, i % 2 ? 2 : 1); g.rect(10, 15, 4, 6, 0); g.rect(5, 13, 4, 4, 0); g.rect(15, 13, 4, 4, 0); g.rect(0, 21, 24, 1); return g; },
  ie: () => { const g = mk(24); g.poly([[1, 11], [12, 3], [23, 11]]); g.rect(4, 11, 16, 10); g.rect(16, 3, 2, 6); g.rect(10, 15, 4, 6, 0); g.rect(6, 13, 3, 3, 0); g.rect(15, 13, 3, 3, 0); g.rect(0, 21, 24, 1); return g; },
  sakaba: () => { const g = mk(24); g.rect(2, 11, 20, 10); g.poly([[0, 11], [12, 6], [24, 11]]); g.rect(10, 15, 4, 6, 0); g.rect(4, 14, 4, 4, 2); g.rect(16, 14, 4, 4, 2); g.line(12, 1, 12, 5); g.rect(9, 1, 6, 1); g.rect(15, 2, 2, 3); g.rect(10, 2, 5, 3, 2); g.rect(0, 21, 24, 1); return g; },
  yama: () => { const g = mk(24); g.poly([[1, 21], [10, 6], [14, 12], [17, 9], [23, 21]]); g.poly([[8, 10], [10, 7], [12, 10], [10, 11]], 0); g.disc(19, 4, 2, 2); g.rect(0, 21, 24, 1); return g; },
  kawa: () => { const g = mk(24); for (const [y0, v] of [[4, 1], [9, 2], [14, 1], [19, 2]]) for (let x = 0; x < 24; x++) { const y = y0 + Math.round(Math.sin(x * 0.9) * 1.4); g.px(x, y, v); g.px(x, y + 1, v); } return g; },
  mori: () => { const g = mk(24); tree(g, 5, 21, 1); tree(g, 12, 22, 1.3); tree(g, 19, 21, 1); g.rect(0, 22, 24, 1); return g; },
  michi: () => { const g = mk(24); g.poly([[1, 22], [10, 4], [14, 4], [23, 22]]); for (const [y, h] of [[19, 3], [14, 2], [9, 2], [6, 1]]) g.rect(11, y, 2, h, 0); g.px(4, 20, 1); g.px(6, 18, 1); g.px(19, 20, 1); g.px(17, 18, 1); return g; },
  shiro: () => { const g = mk(24); g.rect(8, 8, 8, 13); g.rect(2, 12, 5, 9); g.rect(17, 12, 5, 9); for (const x of [8, 11, 14]) g.rect(x, 6, 2, 2); for (const x of [2, 5]) g.rect(x, 10, 2, 2); for (const x of [17, 20]) g.rect(x, 10, 2, 2); g.rect(10, 16, 4, 5, 0); g.px(11, 15, 0); g.px(12, 15, 0); g.rect(11, 11, 2, 2, 0); g.line(12, 2, 12, 6); g.poly([[13, 2], [19, 3], [13, 5]], 2); g.rect(0, 21, 24, 1); return g; },
  // ---- people: colour portraits from people.js (40x40)
  ...Object.fromEntries(Object.keys(NPC_LOOKS).map(id => [id, () => ({ c: drawPortrait(NPC_LOOKS[id]), n: 40 })])),
  // ---- face parts, colours, clothes (colour icons), the tanuki
  kami: () => { const g = mk(24); g.poly([[9, 2], [16, 2], [19, 9], [17, 20], [13, 22], [12, 14], [9, 22], [5, 20], [6, 9]], '#241811'); g.poly([[9, 3], [15, 3], [18, 9], [16, 19], [13, 20], [12, 12], [9, 20], [6, 19], [7, 9]], '#6a4630'); g.line(11, 4, 10, 12, '#8a6446'); g.line(14, 5, 15, 12, '#8a6446'); return g; },
  me: () => { const g = mk(24); g.ell(12, 12, 11, 6, '#241811'); g.ell(12, 12, 10, 5, '#fbf8ef'); g.disc(12, 12, 4, '#3f84d6'); g.disc(12, 12, 2, '#1d3c68'); g.px(14, 10, '#fbf8ef'); g.line(3, 9, 9, 7, '#241811'); g.line(21, 9, 15, 7, '#241811'); return g; },
  mayuge: () => { const g = mk(24); g.poly([[2, 11], [9, 7], [12, 8], [11, 11], [8, 11]], '#5a3a26'); g.poly([[22, 11], [15, 7], [12, 8], [13, 11], [16, 11]], '#5a3a26'); g.poly([[3, 17], [9, 15], [11, 16], [9, 17]], '#5a3a26'); g.poly([[21, 17], [15, 15], [13, 16], [15, 17]], '#5a3a26'); return g; },
  hana: () => { const g = mk(24); g.poly([[10, 2], [14, 2], [15, 13], [20, 17], [19, 21], [5, 21], [4, 17], [9, 13]], '#241811'); g.poly([[11, 3], [13, 3], [14, 13], [19, 17], [18, 20], [6, 20], [5, 17], [10, 13]], '#e6b68c'); g.rect(7, 17, 3, 2, '#9a6a45'); g.rect(14, 17, 3, 2, '#9a6a45'); g.line(11, 5, 11, 12, '#f4d2b4'); return g; },
  kuchi: () => { const g = mk(24); g.poly([[2, 12], [8, 7], [12, 9], [16, 7], [22, 12], [12, 13]], '#8c3a33'); g.poly([[2, 12], [12, 13], [22, 12], [17, 19], [12, 20], [7, 19]], '#b9564c'); g.line(2, 12, 22, 12, '#5a211c'); g.line(9, 16, 15, 16, '#d17d72'); return g; },
  kao: () => { const g = mk(24); g.ell(12, 12, 10, 11, '#241811'); g.ell(12, 12, 9, 10, '#f4d2b4'); for (const x of [8, 15]) { g.rect(x, 10, 3, 2, '#fbf8ef'); g.px(x + 1, 10, '#6e4527'); g.px(x + 1, 11, '#2a211c'); } g.line(11, 13, 11, 15, '#c9996f'); g.line(9, 18, 14, 18, '#b9564c'); g.line(7, 8, 10, 8, '#5a3a26'); g.line(14, 8, 17, 8, '#5a3a26'); return g; },
  chairo: () => { const g = mk(24); g.rect(3, 3, 18, 18, '#241811'); g.rect(4, 4, 16, 16, '#6a4630'); g.rect(5, 5, 14, 3, '#8a6446'); return g; },
  kiniro: () => { const g = mk(24); g.rect(3, 3, 18, 18, '#241811'); g.rect(4, 4, 16, 16, '#dfb85e'); g.rect(5, 5, 14, 3, '#f0d588'); return g; },
  midori: () => { const g = mk(24); g.rect(3, 3, 18, 18, '#241811'); g.rect(4, 4, 16, 16, '#3f9b5c'); g.rect(5, 5, 14, 3, '#66bd82'); return g; },
  shatsu: () => { const g = mk(24); const P = [[7, 5], [10, 3], [14, 3], [17, 5], [22, 9], [19, 13], [17, 11], [17, 21], [7, 21], [7, 11], [5, 13], [2, 9]]; g.poly(P, '#241811'); g.poly([[8, 6], [10, 4], [14, 4], [16, 6], [20, 9], [19, 11], [16, 9], [16, 20], [8, 20], [8, 9], [5, 11], [4, 9]], '#c04545'); g.poly([[10, 3], [12, 8], [14, 3]], '#241811'); return g; },
  zubon: () => { const g = mk(24); g.poly([[6, 2], [18, 2], [19, 23], [13, 23], [12, 10], [11, 23], [5, 23]], '#241811'); g.poly([[7, 3], [17, 3], [18, 22], [14, 22], [12, 9], [10, 22], [6, 22]], '#4373c7'); g.rect(7, 3, 10, 2, '#2d4f8f'); return g; },
  sukaato: () => { const g = mk(24); g.poly([[7, 3], [17, 3], [22, 21], [2, 21]], '#241811'); g.poly([[8, 4], [16, 4], [20, 20], [4, 20]], '#3f9158'); g.rect(8, 4, 8, 2, '#2c6a40'); g.line(10, 8, 7, 19, '#58b077'); g.line(14, 8, 17, 19, '#58b077'); return g; },
  boushi: () => { const g = mk(24); g.ell(12, 16, 11, 4, '#241811'); g.poly([[5, 16], [6, 7], [12, 4], [18, 7], [19, 16]], '#241811'); g.ell(12, 16, 10, 3, '#dbb53c'); g.poly([[6, 15], [7, 8], [12, 5], [17, 8], [18, 15]], '#dbb53c'); g.rect(6, 12, 12, 3, '#7b5333'); return g; },
  kutsu: () => { const g = mk(24); g.poly([[3, 6], [10, 6], [11, 12], [21, 14], [22, 20], [3, 20]], '#241811'); g.poly([[4, 7], [9, 7], [10, 13], [20, 15], [21, 19], [4, 19]], '#7b5333'); g.rect(4, 18, 17, 2, '#3e2a1a'); g.line(6, 10, 9, 10, '#a37548'); return g; },
  tanuki: () => { const g = mk(24); g.disc(5, 6, 3); g.disc(19, 6, 3); g.disc(5, 6, 1, 0); g.disc(19, 6, 1, 0); g.ell(12, 14, 10, 8); g.ell(7, 12, 3, 3, 0); g.ell(17, 12, 3, 3, 0); g.px(7, 12); g.px(17, 12); g.ell(12, 17, 4, 3, 0); g.rect(11, 15, 3, 2, 1); g.poly([[10, 1], [14, 1], [16, 5], [12, 7], [8, 5]], 2); g.line(12, 2, 12, 6, 0); return g; },
};
export const SPRITE_IDS = Object.keys(SPRITES);
export const PORTRAITS = Object.keys(NPC_LOOKS);
export const hasSprite = id => id in SPRITES;

/** canvas element with the sprite for a word id (or null). px = displayed size (integer multiples look sharpest) */
export function spriteEl(id, px = 96) {
  if (!SPRITES[id]) return null;
  const c = SPRITES[id]().c; c.className = 'sprite'; c.style.width = px + 'px'; c.style.height = Math.round(px * c.height / c.width) + 'px'; return c;
}
