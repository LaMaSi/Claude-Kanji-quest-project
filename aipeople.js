// Portraits assembled from the AI-generated sheets (owner's ChatGPT sheets, see docs/SPRITESHEET_BRIEF.md and docs/ASSETS.md).
// Parts live in assets/people (built by tools/build-parts.mjs). Hair, eyebrows, nose, iris and shirt are recoloured here.
// If the parts cannot be loaded the game falls back to the code-drawn portraits in people.js.
import { SKIN, HAIR, CLOTH, setAIPortrait } from './people.js';

const NAMES = [
  ...[0, 1, 2].flatMap(r => [0, 1, 2, 3].map(s => `face_${r}${s}`)),
  ...[1, 2, 3, 4, 5, 6].flatMap(n => [`hairF_${n}`, `hairB_${n}`]),
  ...['brown', 'blue', 'green'].flatMap(c => [`eye_${c}_L`, `eye_${c}_R`]),
  'nose_big', 'nose_small', 'nose_high', 'nose_low', 'mouth_big', 'mouth_small', 'brow_thick', 'brow_thin',
];
const IMG = {};
const W = 150, H = 160, FX = 8, FY = 6;           // canvas and where the 134x148 face sprite sits
const CX = FX + 67;                               // head centre x

export async function loadPeopleParts(base = 'assets/people/') {
  try {
    await Promise.all(NAMES.map(n => new Promise((res, rej) => { const i = new Image(); i.onload = () => { IMG[n] = i; res(); }; i.onerror = () => rej(new Error(n)); i.src = `${base}${n}.png`; })));
    setAIPortrait(aiPortrait); return true;
  } catch { setAIPortrait(null); return false; }
}

const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lumOf = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
const cache = new Map();
/** per-pixel recolour of a part; fn(r,g,b,x,y) returns [r,g,b] or null (keep) */
function recolor(img, key, fn) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (!p[i + 3]) continue; const o = fn(p[i], p[i + 1], p[i + 2], x, y); if (o) { p[i] = o[0]; p[i + 1] = o[1]; p[i + 2] = o[2]; } }
  g.putImageData(d, 0, 0); cache.set(key, c); return c;
}
const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
const tint = (hex, f) => { const [r, g, b] = hexRGB(hex); if (f <= 1) return [clamp(r * f), clamp(g * f), clamp(b * f)]; const t = Math.min(0.55, (f - 1) * 0.8); return [clamp(r + (255 - r) * t), clamp(g + (255 - g) * t), clamp(b + (255 - b) * t)]; };

const hairImg = (kind, n, color) => recolor(IMG[`hair${kind}_${n}`], `h${kind}${n}${color}`, (r, g, b) => { const l = lumOf(r, g, b); return l < 52 ? null : tint(HAIR[color], l / 120); });
const browImg = (name, color) => recolor(IMG[name], `b${name}${color}`, (r, g, b) => { const l = lumOf(r, g, b); return l < 40 ? null : tint(HAIR[color], 0.8 * (l / 70)); });
const noseImg = (name, skin) => recolor(IMG[name], `n${name}${skin}`, (r, g, b) => { const l = lumOf(r, g, b); return l > 110 && r > g ? tint(SKIN[skin], l / 205) : null; });
const eyeImg = (name, black) => black ? recolor(IMG[name], `e${name}k`, (r, g, b) => (r >= g && g >= b - 4 && r - b > 18 && lumOf(r, g, b) < 170 ? [clamp(r * 0.42), clamp(g * 0.4), clamp(b * 0.4)] : null)) : IMG[name];
const faceImg = (r, s, shirt) => recolor(IMG[`face_${r}${s}`], `f${r}${s}${shirt}`, (pr, pg, pb, x, y) => {
  const l = lumOf(pr, pg, pb); if (y < 126 || l < 52) return null;                      // only the shoulder area below the neck, never the outline
  const open = 15 - (y - 126) * 0.75;                                                  // V-neck: skin stays visible in a small triangle
  if (Math.abs(x - 67) < open) return null;
  return tint(CLOTH[shirt] || CLOTH.blue, l / lumOf(...hexRGB(SKIN[s])));
});

export function aiPortrait(look) {
  const L = look, skin = L.skin | 0, row = { round: 0, square: 1, long: 2 }[L.face] ?? 0, hairN = (L.hairLen === 'long' ? 3 : 0) + ({ straight: 1, curly: 2, wavy: 3 }[L.hairType] ?? 1);
  const hair = HAIR[L.hair] ? L.hair : 'brown';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const at = (img, cx, cy, sx = 1, sy = sx) => g.drawImage(img, Math.round(cx - img.width * sx / 2), Math.round(cy - img.height * sy / 2), Math.round(img.width * sx), Math.round(img.height * sy));
  at(hairImg('B', hairN, hair), CX, FY + 57);
  g.drawImage(faceImg(row, skin, L.shirt || 'blue'), FX, FY);
  at(noseImg(`nose_${L.nose}`, skin), CX, FY + 79);
  at(IMG[`mouth_${L.mouth === 'big' ? 'big' : 'small'}`], CX, FY + 95);
  const eyeCol = L.eyeColor === 'black' ? 'brown' : L.eyeColor, black = L.eyeColor === 'black';
  const [sx, sy] = L.eyeSize === 'small' ? [0.72, 0.72] : L.eyeSize === 'narrow' ? [1.05, 0.62] : [1, 1];
  at(eyeImg(`eye_${eyeCol}_L`, black), CX - 23.5, FY + 60, sx, sy); at(eyeImg(`eye_${eyeCol}_R`, black), CX + 23.5, FY + 60, sx, sy);
  at(browImg(`brow_${L.brows === 'thick' ? 'thick' : 'thin'}`, hair), CX, FY + 44);
  at(hairImg('F', hairN, hair), CX, FY + 56);
  if (L.hat) {                                                                       // simple cap drawn in code
    const col = CLOTH[L.hat], dark = tint(CLOTH[L.hat], 0.7);
    g.fillStyle = '#241811'; g.beginPath(); g.ellipse(CX, FY + 22, 40, 24, 0, Math.PI, 0); g.fill(); g.fillRect(CX - 48, FY + 20, 96, 12);
    g.fillStyle = col; g.beginPath(); g.ellipse(CX, FY + 22, 38, 22, 0, Math.PI, 0); g.fill();
    g.fillStyle = `rgb(${dark})`; g.fillRect(CX - 46, FY + 22, 92, 8);
  }
  return cv;
}
