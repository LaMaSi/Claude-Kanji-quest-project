// Colour pixel people: layered, parametric portraits (40x40) and full-body figures (32x56).
// A "look" describes the features; the same renderer draws the NPC portraits, the character editor and the "who is this?" quest.
//
// look = { skin 0-3, face 'round'|'long'|'square', hairLen 'short'|'long', hairType 'straight'|'curly'|'wavy', hair color key,
//          eyeSize 'big'|'small'|'narrow', eyeColor key, brows 'thick'|'thin', nose 'big'|'small'|'high'|'low', mouth 'big'|'small',
//          shirt color key, bottom 'trousers'|'skirt', bottomColor key, hat color key | null, shoes color key }

export const SKIN = ['#f4d2b4', '#e6b68c', '#c78f60', '#8c5b3c'];
export const HAIR = { black: '#2b2623', brown: '#6a4630', blond: '#dfb85e', white: '#e6e3dc', red: '#b0482c', gray: '#8f8f98' };
export const EYE = { black: '#2a211c', brown: '#6e4527', blue: '#3f84d6', green: '#3f9b5c' };
export const CLOTH = { red: '#c04545', blue: '#4373c7', green: '#3f9158', yellow: '#dbb53c', white: '#e8e5de', black: '#3b3b45', brown: '#7b5333' };
const OUT = '#241811', WHITE = '#fbf8ef', LIP = '#b9564c', LIPD = '#8c3a33';

const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f)))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };

function canvas(w, h) {
  const px = new Array(w * h).fill(null);
  const api = {
    w, h,
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; },
    get(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? null : px[y * w + x]; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) api.set(x + i, y + j, c); },
    ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / (rx + 0.3), dy = (y - cy) / (ry + 0.3); if (dx * dx + dy * dy <= 1) api.set(x, y, c); } },
    poly(pts, c) {
      let mn = 1e9, mx = -1e9; for (const p of pts) { mn = Math.min(mn, p[1]); mx = Math.max(mx, p[1]); }
      for (let y = Math.ceil(mn); y <= mx; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) api.set(x, y, c);
      }
    },
    /** 1px outline around everything drawn so far (only on empty pixels) */
    outline(c) { const add = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!px[y * w + x] && (api.get(x - 1, y) || api.get(x + 1, y) || api.get(x, y - 1) || api.get(x, y + 1))) add.push([x, y]); for (const [x, y] of add) px[y * w + x] = c; },
    toCanvas() {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = px[y * w + x]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }
      return cv;
    },
  };
  return api;
}

export const DEFAULT_LOOK = { skin: 0, face: 'round', hairLen: 'short', hairType: 'straight', hair: 'brown', eyeSize: 'big', eyeColor: 'brown', brows: 'thin', nose: 'small', mouth: 'small',
  shirt: 'blue', bottom: 'trousers', bottomColor: 'black', hat: null, shoes: 'brown' };

// ---------------------------------------------------------------- portrait 40x40
function hairShape(c, look, col, layer) {
  const { hairLen, hairType } = look, long = hairLen === 'long';
  const hi = shade(col, 1.25);
  if (layer === 'back') {
    if (long) { c.poly([[8, 12], [32, 12], [34, 36], [6, 36]], col); }
    return;
  }
  // front: cap with bangs
  const bangs = hairType === 'straight' ? [[12, 13], [17, 11], [23, 11], [28, 13]] : [[12, 12], [16, 10], [24, 10], [28, 12]];
  c.poly([[8, 19], [8, 10], [11, 5], [20, 2], [29, 5], [32, 10], [32, 19], [29, 14], ...bangs.slice().reverse(), [11, 14]], col);
  const sideEnd = long ? 35 : 19;
  for (const side of [0, 1]) {
    for (let y = 11; y <= sideEnd; y++) {
      const wave = hairType === 'wavy' ? Math.round(Math.sin(y * 0.75) * 1.6) : 0;
      const x0 = side ? 29 + wave : 7 - wave, w = hairType === 'curly' ? 4 : 4;
      c.rect(x0, y, w, 1, col);
    }
    if (hairType === 'curly') for (let y = 12; y <= sideEnd; y += 3) c.ell(side ? 31.5 : 8.5, y, 3, 2.2, col);
    if (long && hairType !== 'curly') { c.rect(side ? 29 : 7, sideEnd, 4, 1, col); }
  }
  if (hairType === 'curly') for (let a = 195; a <= 345; a += 22) { const r = a * Math.PI / 180; c.ell(20 + 11.5 * Math.cos(r), 12 + 10.5 * Math.sin(r), 3, 2.6, col); }
  // soft highlight on top
  for (let x = 15; x <= 21; x++) c.set(x, 5 + (x > 18 ? 0 : 1), hi);
}

function eyes(c, look, skinD) {
  const iris = EYE[look.eyeColor], pupil = shade(iris, 0.45);
  for (const cx of [15, 25]) {
    if (look.eyeSize === 'big') {
      for (let i = 0; i < 5; i++) c.set(cx - 2 + i, 17, OUT);
      c.set(cx - 2, 18, WHITE); c.set(cx - 1, 18, iris); c.set(cx, 18, iris); c.set(cx + 1, 18, WHITE); c.set(cx + 2, 18, WHITE);
      c.set(cx - 2, 19, WHITE); c.set(cx - 1, 19, iris); c.set(cx, 19, pupil); c.set(cx + 1, 19, iris); c.set(cx + 2, 19, WHITE);
      c.set(cx - 1, 18, WHITE); c.set(cx, 18, iris); c.set(cx + 1, 18, iris);
      for (let i = 1; i < 4; i++) c.set(cx - 2 + i, 20, skinD);
    } else if (look.eyeSize === 'small') {
      for (let i = 0; i < 3; i++) c.set(cx - 1 + i, 18, OUT);
      c.set(cx - 1, 19, WHITE); c.set(cx, 19, pupil); c.set(cx + 1, 19, WHITE);
    } else { // narrow
      for (let i = 0; i < 5; i++) c.set(cx - 2 + i, 18, OUT);
      c.set(cx - 2, 19, skinD); c.set(cx - 1, 19, iris); c.set(cx, 19, pupil); c.set(cx + 1, 19, iris); c.set(cx + 2, 19, skinD);
    }
  }
}
function brows(c, look) {
  const col = shade(HAIR[look.hair] || HAIR.brown, 0.8);
  for (const [x0, dir] of [[12, 1], [23, -1]]) {
    for (let i = 0; i < 5; i++) {
      const y = 14 + (look.brows === 'thick' ? 0 : 0) + ((dir === 1 ? 4 - i : i) > 3 ? 1 : 0);
      c.set(x0 + i, y, col); if (look.brows === 'thick') c.set(x0 + i, y + 1, col);
    }
  }
}
function nose(c, look, skinD) {
  const d = shade(skinD, 0.85), l = shade(SKIN[look.skin], 1.04);
  if (look.nose === 'small') { c.set(19, 23, d); c.set(20, 23, d); }
  else if (look.nose === 'big') { for (let y = 20; y <= 22; y++) { c.set(19, y, d); c.set(20, y, l); } for (let x = 17; x <= 22; x++) c.set(x, 23, d); c.set(17, 22, d); c.set(22, 22, d); }
  else if (look.nose === 'high') { for (let y = 18; y <= 22; y++) { c.set(20, y, d); c.set(19, y, l); } c.set(18, 23, d); c.set(21, 23, d); c.set(19, 23, d); c.set(20, 23, d); }
  else { c.set(18, 23, d); c.set(21, 23, d); c.set(19, 24, d); c.set(20, 24, d); } // low
}
function mouth(c, look) {
  if (look.mouth === 'big') { for (let x = 16; x <= 23; x++) c.set(x, 27, LIPD); for (let x = 17; x <= 22; x++) c.set(x, 28, LIP); for (let x = 18; x <= 21; x++) c.set(x, 29, LIP); }
  else { for (let x = 18; x <= 21; x++) c.set(x, 28, LIP); c.set(17, 27, LIPD); c.set(22, 27, LIPD); }
}

export function drawPortrait(look = DEFAULT_LOOK) {
  const L = { ...DEFAULT_LOOK, ...look }, c = canvas(40, 40), skin = SKIN[L.skin], skinD = shade(skin, 0.86), hair = HAIR[L.hair] || HAIR.brown, shirt = CLOTH[L.shirt];
  hairShape(c, L, hair, 'back');
  c.rect(17, 26, 6, 6, skinD);                                                   // neck
  c.poly([[3, 40], [6, 34], [14, 31], [26, 31], [34, 34], [37, 40]], shirt);       // shoulders
  c.poly([[15, 31], [25, 31], [20, 37]], skinD);                                 // collar opening
  const face = { round: () => c.ell(20, 17, 10, 11, skin), long: () => c.ell(20, 18, 9, 13, skin), square: () => c.poly([[11, 6], [29, 6], [31, 9], [31, 24], [27, 28], [13, 28], [9, 24], [9, 9]], skin) };
  (face[L.face] || face.round)();
  c.ell(9.5, 19, 1.6, 2.6, skin); c.ell(30.5, 19, 1.6, 2.6, skin);               // ears
  hairShape(c, L, hair, 'front');
  eyes(c, L, skinD); brows(c, L); nose(c, L, skinD); mouth(c, L);
  if (L.hat) { c.poly([[8, 9], [10, 3], [20, 1], [30, 3], [32, 9]], CLOTH[L.hat]); c.rect(6, 9, 28, 3, shade(CLOTH[L.hat], 0.8)); }
  c.outline(OUT);
  return c.toCanvas();
}

// ---------------------------------------------------------------- full body 32x56
export function drawBody(look = DEFAULT_LOOK) {
  const L = { ...DEFAULT_LOOK, ...look }, c = canvas(32, 56), skin = SKIN[L.skin], skinD = shade(skin, 0.86), hair = HAIR[L.hair] || HAIR.brown;
  const shirt = CLOTH[L.shirt], bottom = CLOTH[L.bottomColor], shoes = CLOTH[L.shoes] || CLOTH.brown, long = L.hairLen === 'long';
  if (long) c.rect(9, 6, 14, 15, hair);                                              // long hair falls behind the body
  // legs / skirt
  if (L.bottom === 'skirt') { c.poly([[9, 31], [23, 31], [26, 44], [6, 44]], bottom); c.rect(11, 44, 4, 7, skin); c.rect(17, 44, 4, 7, skin); }
  else { c.rect(9, 31, 6, 20, bottom); c.rect(17, 31, 6, 20, bottom); c.rect(15, 31, 2, 6, bottom); }
  c.rect(9, 51, 6, 3, shoes); c.rect(17, 51, 6, 3, shoes);
  // torso + arms
  c.rect(9, 18, 14, 14, shirt); c.rect(6, 19, 3, 11, shirt); c.rect(23, 19, 3, 11, shirt); c.rect(6, 30, 3, 3, skin); c.rect(23, 30, 3, 3, skin);
  c.rect(14, 16, 4, 3, skinD);
  // head
  c.ell(16, 10, 6, 7, skin);
  c.poly([[9, 11], [9, 6], [12, 2], [16, 1], [20, 2], [23, 6], [23, 11], [21, 8], [18, 6], [14, 6], [11, 8]], hair);
  c.rect(9, 8, 2, long ? 9 : 4, hair); c.rect(21, 8, 2, long ? 9 : 4, hair);
  if (L.hairType === 'curly') { for (let a = 200; a <= 340; a += 28) { const r = a * Math.PI / 180; c.ell(16 + 7 * Math.cos(r), 7 + 6 * Math.sin(r), 2, 2, hair); } }
  if (L.hairType === 'wavy') { for (let y = 9; y <= (long ? 19 : 12); y += 2) { c.set(8 + (y % 4 ? 0 : 1), y, hair); c.set(23 - (y % 4 ? 0 : 1), y, hair); } }
  // face
  const iris = EYE[L.eyeColor];
  for (const cx of [13, 19]) { c.set(cx, 10, WHITE); c.set(cx + 1, 10, iris); c.set(cx + 1, 11, shade(iris, 0.6)); c.set(cx, 11, WHITE); }
  c.set(16, 13, shade(skinD, 0.85)); c.set(15, 15, LIP); c.set(16, 15, LIP); c.set(17, 15, LIP);
  if (L.hat) { c.rect(9, 1, 14, 4, CLOTH[L.hat]); c.rect(7, 4, 18, 2, shade(CLOTH[L.hat], 0.8)); }
  c.outline(OUT);
  return c.toCanvas();
}

// ---------------------------------------------------------------- options (used by the editor and the quest)
export const OPTIONS = {
  hairLen: ['short', 'long'],
  hairType: ['straight', 'curly', 'wavy'],
  hair: ['black', 'brown', 'blond', 'white', 'red'],
  eyeSize: ['big', 'small', 'narrow'],
  eyeColor: ['black', 'brown', 'blue', 'green'],
  brows: ['thick', 'thin'],
  nose: ['big', 'small', 'high', 'low'],
  mouth: ['big', 'small'],
  face: ['round', 'square', 'long'],
  shirt: ['red', 'blue', 'green', 'yellow', 'white', 'black'],
  bottom: ['trousers', 'skirt'],
  bottomColor: ['red', 'blue', 'green', 'yellow', 'white', 'black'],
  hat: [null, 'red', 'blue', 'green', 'yellow', 'white', 'black'],
  shoes: ['black', 'brown', 'white'],
};
export function randomLook(rng = Math.random, keys = Object.keys(OPTIONS)) {
  const look = { ...DEFAULT_LOOK, skin: Math.floor(rng() * 4) };
  for (const k of keys) { const o = OPTIONS[k]; look[k] = o[Math.floor(rng() * o.length)]; }
  return look;
}

// NPC presets (replace the old black-square portraits)
export const NPC_LOOKS = {
  tenshu:   { skin: 1, face: 'square', hairLen: 'short', hairType: 'straight', hair: 'gray', eyeSize: 'small', eyeColor: 'brown', brows: 'thick', nose: 'big', mouth: 'big', shirt: 'brown' },
  okamisan: { skin: 0, face: 'round', hairLen: 'long', hairType: 'wavy', hair: 'brown', eyeSize: 'big', eyeColor: 'brown', brows: 'thin', nose: 'small', mouth: 'small', shirt: 'red' },
  obaasan:  { skin: 0, face: 'round', hairLen: 'short', hairType: 'curly', hair: 'white', eyeSize: 'narrow', eyeColor: 'brown', brows: 'thin', nose: 'small', mouth: 'small', shirt: 'green' },
  ojiisan:  { skin: 1, face: 'long', hairLen: 'short', hairType: 'straight', hair: 'white', eyeSize: 'small', eyeColor: 'black', brows: 'thick', nose: 'high', mouth: 'small', shirt: 'brown' },
  kariudo:  { skin: 2, face: 'square', hairLen: 'short', hairType: 'straight', hair: 'black', eyeSize: 'narrow', eyeColor: 'black', brows: 'thick', nose: 'high', mouth: 'small', shirt: 'green', hat: 'brown' },
  kodomo:   { skin: 0, face: 'round', hairLen: 'short', hairType: 'curly', hair: 'brown', eyeSize: 'big', eyeColor: 'blue', brows: 'thin', nose: 'small', mouth: 'big', shirt: 'yellow' },
  hito:     { skin: 1, face: 'round', hairLen: 'short', hairType: 'wavy', hair: 'black', eyeSize: 'big', eyeColor: 'black', brows: 'thin', nose: 'low', mouth: 'small', shirt: 'blue' },
};
