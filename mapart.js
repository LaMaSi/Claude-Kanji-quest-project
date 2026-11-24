// Placeholder overworld map, drawn in code (240x160). Replace with a painted map.png later (docs/SCENES.md).
const W = 240, H = 160;
export function drawMapArt(canvas, places = []) {
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const px = (x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
  const dither = (x, y, w, h, col, ph = 0) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j + ph) % 2 === 0) px(x + i, y + j, col); };
  c.fillStyle = '#0b0d12'; c.fillRect(0, 0, W, H);
  // sea (east) with waves
  poly([[196, 0], [W, 0], [W, H], [210, H], [200, 120], [206, 80], [194, 40]], '#14304e');
  for (let i = 0; i < 40; i++) { const x = 205 + rnd() * 34, y = rnd() * H; if (x > 198 + Math.sin(y / 9) * 4) { px(x, y, '#2c5a86'); px(x + 1, y, '#2c5a86'); } }
  // land with a lighter texture
  poly([[0, 0], [196, 0], [194, 40], [206, 80], [200, 120], [210, H], [0, H]], '#17261f');
  dither(0, 0, 196, H, '#1c2f26');
  // beach strip
  for (let y = 36; y < 126; y++) { const edge = 194 + Math.sin(y / 9) * 4 + (y > 80 ? 6 : 0); for (let x = edge - 5; x < edge; x++) px(x, y, (x + y) % 2 ? '#6d5d3b' : '#85734a'); }
  // lake (west)
  c.fillStyle = '#1d4a6b'; c.beginPath(); c.ellipse(58, 64, 24, 15, 0, 0, 7); c.fill(); dither(36, 52, 44, 26, '#2a6389'); px(46, 60, '#a8c8e0'); px(70, 68, '#a8c8e0');
  // mountains (north)
  const peak = (x, y, w, h) => { poly([[x - w, y + h], [x, y], [x + w, y + h]], '#363e55'); poly([[x - w * 0.35, y + h * 0.38], [x, y], [x + w * 0.35, y + h * 0.38], [x, y + h * 0.28]], '#cbc1af'); };
  peak(98, 14, 22, 28); peak(122, 8, 26, 34); peak(150, 16, 20, 26); peak(76, 22, 16, 20);
  // forest (south-west)
  for (let i = 0; i < 26; i++) { const x = 52 + rnd() * 52, y = 96 + rnd() * 50; poly([[x - 4, y], [x, y - 11], [x + 4, y]], '#1f4a35'); px(x, y + 1, '#4a3626'); }
  // fields (south-centre)
  for (let r = 0; r < 5; r++) { const y = 98 + r * 6; c.fillStyle = r % 2 ? '#3d4f2c' : '#4a5d33'; c.fillRect(124, y, 50, 4); }
  // small town and city blocks
  const bld = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); px(x + 1, y + 1, '#d29a3e'); };
  bld(168, 62, 7, 6, '#7b6a50'); bld(177, 60, 6, 8, '#7b6a50'); bld(184, 64, 6, 5, '#7b6a50');
  bld(186, 22, 6, 12, '#8d7b5e'); bld(194, 18, 7, 16, '#8d7b5e'); bld(178, 26, 6, 8, '#8d7b5e');
  // roads: dotted lines between the places (from world.json positions)
  const pos = Object.fromEntries(places.map(p => [p.id, [p.x * W / 100, p.y * H / 100]]));
  for (const [a, b] of [['village', 'field'], ['village', 'woods'], ['village', 'lake'], ['village', 'town'], ['town', 'city'], ['town', 'shore'], ['village', 'mountains']]) {
    if (!pos[a] || !pos[b]) continue; const [x0, y0] = pos[a], [x1, y1] = pos[b], n = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < n; t += 3) px(x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n, '#b59b5a');
  }
  // stars in the sky corner and a little boat
  for (let i = 0; i < 14; i++) px(rnd() * 190, rnd() * 10, '#cbc1af');
  poly([[226, 100], [234, 100], [232, 104], [228, 104]], '#cbc1af'); c.fillStyle = '#cbc1af'; c.fillRect(229, 93, 1, 7); poly([[230, 93], [230, 99], [235, 99]], '#cbc1af');
}
