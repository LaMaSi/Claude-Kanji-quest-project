// Turns any picture into a GBA-style scene: crops to 3:2, scales to 240x160, softly limits brightness, reduces colours to
// 15-bit (5 bits per channel, like the GBA) with ordered dithering. The LCD grid/vignette is added at runtime (CSS).
// Usage: node tools/convert-scenes.mjs [inDir=art/incoming] [outDir=scenes] [--preview]
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, parse } from 'path';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const inDir = args[0] || 'art/incoming', outDir = args[1] || 'scenes', preview = process.argv.includes('--preview');
const W = 240, H = 160, BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

export async function gba(file) {
  const { data } = await sharp(file).rotate().resize(W, H, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .modulate({ saturation: 0.96 }).linear(1.07, -9).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = (BAYER[y & 3][x & 3] / 16 - 0.5) * 0.7;              // dither strength: 0.7 of one colour step
    for (let c = 0; c < 3; c++) {
      const i = (y * W + x) * 3 + c, v = Math.min(255, data[i] * 0.93);   // keep the brightest white a bit dim: night-friendly
      const q = Math.max(0, Math.min(31, Math.round(v / 255 * 31 + t)));
      out[i] = Math.round(q * 255 / 31);
    }
  }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } });
}

if (process.argv[1].endsWith('convert-scenes.mjs')) {
  if (!existsSync(inDir)) { console.log(`no input folder ${inDir}`); process.exit(0); }
  mkdirSync(outDir, { recursive: true }); if (preview) mkdirSync('art/preview', { recursive: true });
  const names = [];
  for (const f of readdirSync(inDir).filter(f => /\.(png|jpe?g|webp)$/i.test(f))) {
    const name = parse(f).name; const img = await gba(join(inDir, f));
    await img.clone().png({ compressionLevel: 9 }).toFile(join(outDir, name + '.png'));
    if (preview) await img.clone().resize(W * 3, H * 3, { kernel: 'nearest' }).png().toFile(join('art/preview', name + '.png'));
    names.push(name); console.log('converted', f, '->', join(outDir, name + '.png'));
  }
  // index.json lists every scene image present in outDir
  const all = readdirSync(outDir).filter(f => f.endsWith('.png')).map(f => parse(f).name).sort();
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(all));
}
