# Scene images for Wolfsdorf – brief for the image generator

The game shows one picture per location in a **240×160 px GBA-style window** (3:2). You generate large pictures, send them to Claude,
and `node tools/convert-scenes.mjs` scales them down to 240×160, reduces them to GBA colours (15-bit, dithered) and the app adds an LCD grid.
Characters (portraits), items and animals are drawn separately by Claude as small sprites, so **the scenes should contain no foreground characters**.

## How to deliver
- Generate at **1536×1024 px (3:2), PNG** or JPG. Wide landscape, nothing important in the outer 5 %.
- Name the file exactly like the **file name** in the table (e.g. `village.png`) and send it to Claude (or put it in `art/incoming/`).
- Claude converts, adds it to `scenes/` and the app picks it up automatically. Missing scenes keep using the built-in pixel art.

## Style (use this block in every prompt so the pictures match)
> 16-bit JRPG scene, Game Boy Advance era pixel art look, hand-painted feeling, limited colour palette, soft dithering. Japanese-inspired
> medieval fantasy village at night: wooden houses with tiled roofs, paper lanterns, stone lanterns, rice-straw details, a castle far away.
> Deep indigo and blue-black darkness with warm amber lantern light and a pale moon. Cozy, calm, bedtime mood. Low contrast, no bright white,
> no harsh light. Wide composition, clear readable shapes that still work at 240×160 pixels. No text, no letters, no UI, no characters,
> no modern objects, no watermark.

**Negative / avoid:** people, faces in the foreground, text or signs with writing, logos, UI, photo-realism, 3D render look, bright daylight, neon, gore.

**Consistency tips:** generate `village` first; use it as the style reference (image prompt / style reference) for all others. Keep the same palette:
indigo `#1b2140`, night blue `#2d3a6b`, moon cream `#e8e0c0`, lantern amber `#d29a3e`, grass `#1f3d33`, roof red `#8a3a3a`.

## Required scenes (used by chapters 1–3)
| File name | Where it is used | Picture |
|---|---|---|
| `village.png` | Hub: the village square, start of every session | Small village square at night, 3–4 wooden houses, warm lit windows, a stone lantern and a well, dirt road leading away, castle on a far hill, full moon, stars. |
| `shop.png` | Shop (buying, number practice) | Inside a cozy general store: shelves with apples, loaves of bread, bottles, jars; a wooden counter in the front; a hanging lantern; a banner/curtain with no text. Nobody visible. |
| `tavern.png` | Tavern (ordering, hunter quest) | Inside a medieval-Japanese tavern: wooden beams, a fireplace glowing amber, round tables, mugs and teapots, paper lanterns, a bar counter on the left. |
| `board.png` | Quest board | Wooden notice board under a small roof in the square, several paper notes pinned (no readable text), a lantern, moonlight, the road behind. |
| `home.png` | Home: sleep, save, study | A tiny bedroom: futon-style bed with a blanket, a candle on a small table, a window with the moon, a wooden chest, soft warm light. |
| `wolf.png` | Wolf encounter / battle | Edge of the forest at night, dark pine trees, mist, a large flat rock in the middle, full moon behind; **no wolf in the picture** (Claude overlays the animal). Slightly eerie but not scary. |
| `title.png` | Title / start screen | Wide hill with one lone tree, the village in the valley with tiny lit windows, huge full moon, stars, a few clouds. Peaceful and a little mysterious. |

## Next scenes (chapters 4–6, send when ready)
| File name | Picture |
|---|---|
| `forest_path.png` | A winding path through a dark forest, fireflies, moonlight through leaves. |
| `river.png` | A river at night with a small wooden bridge, reeds, lily pads, stones; a yokai (kappa) place. |
| `shrine.png` | A small forest shrine with a red torii gate, stone fox statues and stone lanterns, soft mist. |
| `farm.png` | Moonlit farm field with an apple orchard, a wooden fence, a barn, a scarecrow; used for the apple quest and farm animals. |
| `castle_gate.png` | The castle gate at the end of a road: big wooden gate, stone walls, two torch-lit lanterns, banners without symbols. |
| `mountain.png` | A mountain trail with a view over the valley, snowy peak in moonlight, a small wooden sign without text. |
| `bakery.png` | Inside a small bakery: oven glow, loaves on racks, flour sacks, a counter (nobody visible). |
| `night_end.png` | "Good night" screen after the daily round: the village asleep, only one lit window, shooting star, very calm. |

## Optional later: battle pictures
Transparent PNGs (1024×1024, centered creature, soft rim light, same style) named `enemy_wolf.png`, `enemy_fox.png`, `enemy_bear.png`, `enemy_kappa.png`, `enemy_tengu.png`.
These are not needed yet – the sprites drawn by Claude are used for now.

## What Claude draws (not needed from you)
Item icons (apple, bread, water, tea, alcohol, medicine, egg, fish, meat, coins, money bag), nine animals, nine place icons, and portraits of the shopkeeper,
innkeeper, old woman, old man, hunter, child and villager (sprites.js).
