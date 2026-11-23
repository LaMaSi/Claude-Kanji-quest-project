// Picks the parts used by the game from art/parts (see tools/slice-sheets.mjs) and writes them, pre-scaled, to assets/people/.
// The scale factors put every sheet on the same scale as the face sprites (the AI sheets have different cell sizes).
import sharp from 'sharp';
import { mkdirSync, rmSync, readdirSync } from 'fs';

const OUT = 'assets/people', IN = 'art/parts', HALF = 0.5;
const ls = (sheet, n) => `${IN}/${sheet}/${String(n).padStart(2, '0')}.png`;
const jobs = [];
for (let n = 1; n <= 12; n++) jobs.push([ls('faces', n), `face_${Math.floor((n - 1) / 4)}${(n - 1) % 4}`, HALF]);
for (let n = 1; n <= 6; n++) { jobs.push([ls('hair_front', n), `hairF_${n}`, HALF * 0.62]); jobs.push([ls('hair_back', n), `hairB_${n}`, HALF * 0.62]); }
for (const [col, i] of [['brown', 1], ['blue', 3], ['green', 5]]) { jobs.push([ls('eyes_A', i), `eye_${col}_L`, HALF * 0.42]); jobs.push([ls('eyes_A', i + 1), `eye_${col}_R`, HALF * 0.42]); }
for (const [name, n, s] of [['nose_big', 5, 0.55], ['nose_small', 1, 0.55], ['nose_high', 4, 0.55], ['nose_low', 7, 0.55], ['mouth_big', 12, 0.6], ['mouth_small', 10, 0.6], ['brow_thick', 28, 0.55], ['brow_thin', 35, 0.55]]) jobs.push([ls('features', n), name, HALF * s]);

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
for (const [src, name, s] of jobs) {
  const m = await sharp(src).metadata();
  await sharp(src).resize(Math.max(1, Math.round(m.width * s)), Math.max(1, Math.round(m.height * s)), { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
}
console.log(jobs.length, 'parts ->', OUT, readdirSync(OUT).length, 'files');
