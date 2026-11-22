// Pixel sprites drawn in code: light pixels on dark, plus one amber accent (value 2).
// Objects/animals/places are 24x24, portraits 32x32. Every noun in content/words.json needs an entry (tools/validate.mjs checks it).
const FG = '#d8d1bf', BG = '#0b0d12', ACC = '#d29a3e';

function mk(n) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), col = v => (v === 0 ? BG : v === 2 ? ACC : FG);
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
  // ---- people (portraits 32x32)
  tenshu: () => { const g = mk(32); g.poly([[8, 10], [24, 10], [25, 19], [21, 28], [11, 28], [7, 19]]); g.rect(6, 7, 20, 4, 2); g.rect(7, 5, 18, 2, 2); g.rect(11, 15, 4, 2, 0); g.rect(18, 15, 4, 2, 0); g.line(10, 13, 14, 12, 0); g.line(18, 12, 22, 13, 0); g.line(16, 16, 16, 20, 0); g.poly([[10, 22], [16, 20], [22, 22], [20, 25], [16, 23], [12, 25]], 0); g.dither(11, 26, 10, 3, 0, 0); return g; },
  okamisan: () => { const g = mk(32); g.disc(16, 5, 4, 2); g.poly([[5, 24], [5, 12], [9, 5], [16, 3], [23, 5], [27, 12], [27, 24]], 2); g.poly([[10, 10], [22, 10], [22, 19], [19, 27], [13, 27], [10, 19]]); g.rect(12, 16, 3, 2, 0); g.rect(18, 16, 3, 2, 0); g.line(13, 22, 19, 22, 0); g.px(12, 21, 0); g.px(20, 21, 0); g.poly([[8, 28], [24, 28], [28, 31], [4, 31]], 2); return g; },
  obaasan: () => { const g = mk(32); g.poly([[4, 18], [6, 10], [16, 2], [26, 10], [28, 18], [24, 24], [8, 24]], 2); g.poly([[10, 11], [22, 11], [22, 19], [19, 27], [13, 27], [10, 19]]); g.rect(12, 16, 3, 2, 0); g.rect(18, 16, 3, 2, 0); g.line(13, 23, 19, 23, 0); g.px(12, 22, 0); g.px(20, 22, 0); g.px(11, 13, 0); g.px(21, 13, 0); g.poly([[8, 27], [24, 27], [28, 31], [4, 31]], 2); return g; },
  ojiisan: () => { const g = mk(32); g.poly([[9, 8], [23, 8], [24, 18], [16, 31], [8, 18]]); g.poly([[7, 5], [25, 5], [25, 8], [7, 8]], 2); g.rect(11, 14, 4, 2, 0); g.rect(18, 14, 4, 2, 0); g.line(10, 12, 14, 11, 0); g.line(18, 11, 22, 12, 0); g.line(16, 15, 16, 18, 0); g.dither(11, 21, 11, 9, 0, 0); g.line(12, 20, 20, 20, 0); g.rect(9, 9, 2, 8, 0); g.rect(21, 9, 2, 8, 0); return g; },
  kariudo: () => { const g = mk(32); g.poly([[3, 12], [29, 12], [24, 7], [10, 5]], 2); g.rect(8, 11, 16, 3, 2); g.line(24, 7, 29, 1); g.line(25, 7, 30, 2); g.poly([[9, 13], [23, 13], [24, 20], [21, 29], [11, 29], [8, 20]]); g.rect(11, 17, 4, 2, 0); g.rect(18, 17, 4, 2, 0); g.line(10, 15, 14, 16, 0); g.line(22, 15, 18, 16, 0); g.line(16, 18, 16, 21, 0); g.line(21, 14, 17, 22, 0); g.dither(11, 25, 10, 4, 0, 0); return g; },
  kodomo: () => { const g = mk(32); g.disc(16, 17, 10); g.poly([[5, 14], [8, 6], [16, 4], [24, 6], [27, 14], [22, 10], [10, 10]], 2); g.rect(11, 17, 3, 3, 0); g.rect(18, 17, 3, 3, 0); g.px(12, 17, 1); g.px(19, 17, 1); g.line(14, 23, 18, 23, 0); g.px(13, 22, 0); g.px(19, 22, 0); return g; },
  hito: () => { const g = mk(32); g.poly([[4, 30], [4, 14], [16, 3], [28, 14], [28, 30]], 2); g.poly([[10, 12], [22, 12], [23, 19], [20, 28], [12, 28], [9, 19]]); g.rect(12, 16, 3, 2, 0); g.rect(18, 16, 3, 2, 0); g.line(14, 23, 18, 23, 0); return g; },
};
export const SPRITE_IDS = Object.keys(SPRITES);
export const PORTRAITS = ['tenshu', 'okamisan', 'obaasan', 'ojiisan', 'kariudo', 'kodomo', 'hito'];
export const hasSprite = id => id in SPRITES;

/** canvas element with the sprite for a word id (or null). px = displayed size (integer multiples look sharpest) */
export function spriteEl(id, px = 96) {
  if (!SPRITES[id]) return null;
  const c = SPRITES[id]().c; c.className = 'sprite'; c.style.width = c.style.height = px + 'px'; return c;
}
