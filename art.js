// 1-bit pixel art, drawn in code. Light pixels on the dark background. 96x54 logical pixels per scene.
const W = 96, H = 54;

function mk(canvas) {
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  const g = {
    c,
    on: '#d8d1bf', off: '#0b0d12',
    px(x, y, v = 1) { c.fillStyle = v ? g.on : g.off; c.fillRect(x | 0, y | 0, 1, 1); },
    rect(x, y, w, h, v = 1) { c.fillStyle = v ? g.on : g.off; c.fillRect(x, y, w, h); },
    frame(x, y, w, h) { g.rect(x, y, w, 1); g.rect(x, y + h - 1, w, 1); g.rect(x, y, 1, h); g.rect(x + w - 1, y, 1, h); },
    line(x0, y0, x1, y1, v = 1) {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) { g.px(x0, y0, v); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    },
    disc(cx, cy, r, v = 1) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) g.px(cx + x, cy + y, v); },
    ring(cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d <= r * r + r && d >= (r - 1) * (r - 1)) g.px(cx + x, cy + y); } },
    poly(pts, v = 1) { // scanline fill
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.ceil(minY); y <= maxY; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) g.rect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1, v);
      }
    },
    dither(x, y, w, h, phase = 0) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + phase) % 2 === 0) g.px(x + i, y + j); },
  };
  g.rect(0, 0, W, H, 0);
  return g;
}

// deterministic "random" so the sky never flickers
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; });
function stars(g, n = 26, maxY = 28) { const r = rnd(); for (let i = 0; i < n; i++) g.px(r() * W, r() * maxY); }
function moon(g, x, y, r = 6) { g.disc(x, y, r); g.disc(x + 3, y - 2, r - 1, 0); g.disc(x - r - 3, y + r, 0, 0); }
function fullMoon(g, x, y, r = 6) { g.disc(x, y, r); g.px(x - 2, y - 1, 0); g.px(x + 2, y + 2, 0); g.px(x + 1, y - 3, 0); }
function mountains(g, base, seed = 0) {
  const pts = [[0, base]];
  for (let x = 0; x <= W; x += 8) pts.push([x, base - 6 - Math.abs(Math.sin(x * 0.07 + seed)) * 12]);
  pts.push([W, base]);
  for (let i = 0; i < pts.length - 1; i++) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
}
function house(g, x, y, w, h, lit = true) {
  g.frame(x, y, w, h);
  g.poly([[x - 2, y], [x + w / 2, y - Math.round(w / 3)], [x + w + 1, y]]);
  g.rect(x + 3, y + 3, 3, 3, lit ? 1 : 0); g.frame(x + 3, y + 3, 3, 3);
  g.rect(x + w - 6, y + h - 6, 3, 6);
}
function tree(g, x, y, s = 1) {
  g.rect(x, y - 3 * s, 1 * s + 1, 3 * s);
  g.poly([[x + s - 5 * s, y - 3 * s], [x + s, y - 14 * s], [x + s + 5 * s, y - 3 * s]]);
}
function ground(g, y) { g.rect(0, y, W, 1); g.dither(0, y + 1, W, 2, 0); }
function lantern(g, x, y) { g.line(x, y - 4, x, y - 1); g.frame(x - 2, y, 5, 5); g.px(x, y + 2, 0); g.rect(x - 1, y + 5, 3, 1); }
function wolf(g, x, y, s = 1) { // howling wolf, sitting, facing right. x,y = ground under the haunch; ~50 units tall at s=1
  const P = (pts, v = 1) => g.poly(pts.map(p => [x + p[0] * s, y + p[1] * s]), v);
  P([[-11, 0], [-13, -8], [-9, -17], [-1, -21], [6, -19], [9, -10], [9, 0]]);                       // haunch + body
  P([[1, -19], [5, -31], [11, -36], [15, -31], [11, -21], [9, -10]]);                                // chest + neck
  P([[9, -34], [12, -39], [17, -45], [27, -52], [28, -49], [22, -42], [19, -37], [15, -31]]);        // head + muzzle pointing up
  P([[10, -38], [9, -45], [15, -41]]);                                                                // ear
  P([[3, -14], [8, -14], [8, 0], [3, 0]]); P([[3, -2], [12, -2], [12, 0], [3, 0]]);                   // front leg + paw
  P([[-12, -3], [-19, -2], [-23, -8], [-22, -14], [-20, -9], [-15, -6]]);                             // tail
  g.px(x + 20 * s, y - 43 * s, 0);                                                                   // eye
}
function sleepWolf() {}

export const ART = {
  title(g) {
    stars(g, 34, 26); fullMoon(g, 62, 15, 9);
    mountains(g, 40, 1.3);
    wolf(g, 30, 44, 0.62);
    ground(g, 44);
    tree(g, 8, 44, 1.3); tree(g, 86, 44, 1);
  },
  village(g) {
    stars(g, 22, 22); moon(g, 80, 11, 6);
    mountains(g, 34, 0.4);
    // castle on the far hill
    g.frame(8, 20, 10, 14); g.rect(8, 17, 2, 3); g.rect(12, 17, 2, 3); g.rect(16, 17, 2, 3); g.rect(11, 28, 4, 6);
    g.rect(26, 24, 2, 10); g.poly([[24, 24], [27, 19], [30, 24]]);
    ground(g, 44);
    house(g, 8, 34, 14, 10); house(g, 30, 32, 16, 12, false); house(g, 54, 35, 13, 9);
    lantern(g, 74, 38); g.rect(74, 43, 1, 1);
    tree(g, 88, 44, 1); tree(g, 2, 44, 1);
  },
  shop(g) {
    stars(g, 8, 6);
    g.frame(4, 4, 88, 46); g.rect(4, 36, 88, 1);
    // shelves with apples and jars
    for (const y of [16, 28]) { g.rect(10, y, 40, 1); for (let i = 0; i < 6; i++) { g.disc(15 + i * 6, y - 3, 2); g.px(15 + i * 6, y - 6); } }
    g.frame(56, 8, 14, 18); g.rect(58, 11, 10, 1); g.dither(58, 14, 10, 8, 0);
    // counter
    g.rect(0, 38, W, 12, 1); g.rect(2, 40, W - 4, 8, 0); g.dither(2, 40, W - 4, 8, 1);
    // hanging sign
    g.line(76, 4, 76, 9); g.frame(70, 9, 14, 10); g.rect(72, 12, 10, 1); g.rect(72, 15, 6, 1);
    // basket of apples
    g.frame(18, 30, 20, 8); for (let i = 0; i < 5; i++) g.disc(21 + i * 4, 30, 2);
    // coin
    g.ring(74, 33, 3); g.px(74, 33);
  },
  tavern(g) {
    stars(g, 10, 14);
    g.frame(10, 14, 76, 36); g.poly([[6, 14], [48, 2], [90, 14]]);
    g.rect(12, 16, 72, 1);
    // door
    g.frame(40, 30, 16, 20); g.rect(48, 30, 1, 20); g.px(46, 41); g.px(51, 41);
    // windows warm lit
    g.rect(16, 24, 12, 10); g.frame(15, 23, 14, 12); g.rect(21, 24, 1, 10, 0); g.rect(16, 29, 12, 1, 0);
    g.rect(68, 24, 12, 10); g.frame(67, 23, 14, 12); g.rect(73, 24, 1, 10, 0); g.rect(68, 29, 12, 1, 0);
    lantern(g, 34, 22); lantern(g, 62, 22);
    // mug sign
    g.line(48, 3, 48, 8); g.frame(44, 8, 8, 7); g.rect(52, 10, 2, 3); g.rect(45, 9, 6, 2, 1);
  },
  board(g) {
    stars(g, 16, 18); moon(g, 84, 9, 5);
    ground(g, 46);
    g.rect(14, 12, 2, 34); g.rect(80, 12, 2, 34);
    g.frame(10, 10, 76, 6); g.frame(18, 18, 60, 26);
    // notes
    g.rect(22, 22, 14, 16); g.rect(24, 25, 10, 1, 0); g.rect(24, 28, 10, 1, 0); g.rect(24, 31, 7, 1, 0);
    g.frame(42, 21, 12, 14); g.dither(44, 24, 8, 8, 0);
    g.rect(60, 24, 14, 16); g.rect(62, 27, 10, 1, 0); g.rect(62, 30, 10, 1, 0); g.rect(62, 33, 6, 1, 0);
    g.px(29, 21); g.px(48, 20); g.px(67, 23);
  },
  home(g) {
    g.frame(2, 2, 92, 50);
    // window with moon
    g.frame(60, 8, 22, 22); g.rect(70, 8, 1, 22); g.rect(60, 18, 22, 1);
    moon(g, 65, 14, 3); g.px(76, 12); g.px(78, 24); g.px(64, 25);
    // bed
    g.frame(8, 30, 40, 14); g.rect(8, 24, 4, 20); g.rect(44, 28, 4, 16);
    g.rect(14, 32, 12, 6); g.dither(28, 33, 18, 10, 0);
    g.rect(6, 44, 3, 6); g.rect(46, 44, 3, 6);
    // candle
    g.rect(56, 40, 6, 1); g.rect(58, 34, 2, 6); g.px(58, 32); g.px(59, 31); g.px(59, 33, 0);
    ground(g, 50);
  },
  wolf(g) {
    stars(g, 30, 20); fullMoon(g, 70, 14, 10);
    ground(g, 46); tree(g, 10, 46, 1.4); tree(g, 88, 46, 1);
    wolf(g, 40, 46, 0.78);
    g.rect(40, 5, 0, 0);
  },
  hunter(g) { this.tavern(g); },
};

export function drawArt(canvas, name) {
  const g = mk(canvas);
  (ART[name] || ART.village).call(ART, g);
}
