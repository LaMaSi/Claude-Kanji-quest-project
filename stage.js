// The picture area: 240x160 like a GBA screen. Uses scenes/<name>.png when it exists (converted by tools/convert-scenes.mjs),
// otherwise falls back to the pixel art drawn in art.js.
import { drawArt } from './art.js';
const W = 240, H = 160;
const imgs = {};
export async function initScenes() {
  try {
    const list = await (await fetch('scenes/index.json')).json();
    await Promise.all(list.map(n => new Promise(res => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = res; i.src = `scenes/${n}.png`; })));
  } catch { /* no scene images yet */ }
}
export const hasScene = n => !!imgs[n];
export function drawScene(canvas, name) {
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.fillStyle = '#0b0d12'; c.fillRect(0, 0, W, H);
  if (imgs[name]) { c.drawImage(imgs[name], 0, 0, W, H); return; }
  const off = document.createElement('canvas'); drawArt(off, name);
  c.drawImage(off, 0, 0, off.width, off.height, 0, Math.round((H - W * off.height / off.width) / 2), W, Math.round(W * off.height / off.width));
}
