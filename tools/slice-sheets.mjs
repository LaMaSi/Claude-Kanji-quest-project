// Cuts the magenta-background sprite sheets (made by the owner with ChatGPT, see docs/SPRITESHEET_BRIEF.md) into single transparent parts.
// Finds each part as a connected blob (the model does not keep the grid exactly), orders them in reading order and writes
//   art/parts/<sheet>/<nn>.png  +  art/parts/<sheet>/index.json (bbox in the sheet)  +  art/parts/<sheet>/_contact.png (numbered overview)
// Usage: node tools/slice-sheets.mjs [sheet ...]     (default: all PNGs in art/incoming/sheets)
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { parse } from 'path';

const IN = 'art/incoming/sheets', OUT = 'art/parts';
const DILATE = { eyes_A: 16, eyes_B: 16, features: 10, hair_front: 4, hair_back: 4, faces: 6, clothes_A: 6, clothes_B: 6 };

/** magenta -> transparent with a soft edge and magenta spill removed */
function key(data, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const d = Math.hypot(255 - r, g, 255 - b);                 // distance to #FF00FF
    const a = Math.max(0, Math.min(1, (d - 70) / 90));
    let R = r, G = g, B = b;
    if (a > 0 && a < 1) { R = Math.max(0, Math.min(255, (r - (1 - a) * 255) / a)); B = Math.max(0, Math.min(255, (b - (1 - a) * 255) / a)); G = g / a > 255 ? 255 : g / a; }
    let A = a < 0.5 ? 0 : 255;                                                        // crisp pixel-art edges
    if (A && R > G + 22 && B > G + 22) { if (R + G + B < 330) { R = 36; G = 24; B = 17; } else A = 0; }   // leftover magenta tint: dark -> outline colour, bright -> remove
    out[i * 4] = R; out[i * 4 + 1] = G; out[i * 4 + 2] = B; out[i * 4 + 3] = A;
  }
  return out;
}
function components(alpha, w, h, dil) {
  // dilate by `dil` (box) via two passes on a row/column running max, then label
  const m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = alpha[i * 4 + 3] ? 1 : 0;
  const tmp = new Uint8Array(w * h), d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { let last = -1e9; for (let x = 0; x < w; x++) { if (m[y * w + x]) last = x; if (x - last <= dil) tmp[y * w + x] = 1; } last = 1e9; for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) last = x; if (last - x <= dil) tmp[y * w + x] = 1; } }
  for (let x = 0; x < w; x++) { let last = -1e9; for (let y = 0; y < h; y++) { if (tmp[y * w + x]) last = y; if (y - last <= dil) d[y * w + x] = 1; } last = 1e9; for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) last = y; if (last - y <= dil) d[y * w + x] = 1; } }
  const lab = new Int32Array(w * h), boxes = []; let n = 0; const st = [];
  for (let i = 0; i < w * h; i++) {
    if (!d[i] || lab[i]) continue; n++; let x0 = w, y0 = h, x1 = 0, y1 = 0, px = 0; st.push(i); lab[i] = n;
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (m[p]) { px++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (const q of [p - 1, p + 1, p - w, p + w]) if (q >= 0 && q < w * h && d[q] && !lab[q] && !((q % w === 0 && p % w === w - 1) || (q % w === w - 1 && p % w === 0))) { lab[q] = n; st.push(q); } }
    if (px > 120) boxes.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, px });
  }
  return boxes;
}
const only = process.argv.slice(2);
for (const f of readdirSync(IN).filter(f => f.endsWith('.png') && (!only.length || only.includes(parse(f).name)))) {
  const name = parse(f).name, { data, info } = await sharp(`${IN}/${f}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = key(data, info.width, info.height);
  let boxes = components(rgba, info.width, info.height, DILATE[name] ?? 8);
  // reading order: group into rows by vertical centre
  boxes.sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2)); const rows = []; for (const b of boxes) { const r = rows.find(r => Math.abs(r.cy - (b.y + b.h / 2)) < Math.max(b.h, 60) * 0.6); if (r) { r.items.push(b); r.cy = r.items.reduce((s, x) => s + x.y + x.h / 2, 0) / r.items.length; } else rows.push({ cy: b.y + b.h / 2, items: [b] }); }
  boxes = rows.sort((a, b) => a.cy - b.cy).flatMap(r => r.items.sort((a, b) => a.x - b.x));
  const dir = `${OUT}/${name}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const full = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
  const meta = [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i], pad = 2, L = Math.max(0, b.x - pad), T = Math.max(0, b.y - pad), W = Math.min(info.width - L, b.w + 2 * pad), H = Math.min(info.height - T, b.h + 2 * pad);
    await full.clone().extract({ left: L, top: T, width: W, height: H }).png().toFile(`${dir}/${String(i + 1).padStart(2, '0')}.png`);
    meta.push({ n: i + 1, x: b.x, y: b.y, w: b.w, h: b.h });
  }
  writeFileSync(`${dir}/index.json`, JSON.stringify({ sheet: [info.width, info.height], parts: meta }));
  // numbered contact sheet on a dark checker so transparency is visible
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">${meta.map(m => `<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" fill="none" stroke="#0f0" stroke-width="2"/><text x="${m.x + 4}" y="${m.y + 18}" font-size="20" font-family="sans-serif" fill="#0f0" stroke="#000" stroke-width="3" paint-order="stroke">${m.n}</text>`).join('')}</svg>`;
  await sharp({ create: { width: info.width, height: info.height, channels: 4, background: '#1b1f2a' } }).composite([{ input: await full.clone().png().toBuffer() }, { input: Buffer.from(svg) }]).png().toFile(`${dir}/_contact.png`);
  console.log(name.padEnd(11), info.width + 'x' + info.height, boxes.length, 'parts');
}
