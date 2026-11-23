# Brief: sprite sheets for the character editor (for ChatGPT image generation)

Goal: layered character parts that Tanuki Sensei can combine freely (face shape × skin × hair × eyes × nose × mouth × clothes), so the character editor and the
"who is this?" quests can show many different people. You generate **8 sheets**, one per message; Claude slices, cleans and recolours them.

Files you need: `art/templates/T1…T8` (also in `art/spritesheet-templates.zip`). Each template is a grid with blue dashed guides that show where the head,
eyes, nose, mouth and body must be. **Upload the matching template with every request.**

## How to work
1. Open ONE new ChatGPT conversation for the whole project (keeps the style consistent).
2. Send the **master message** below first (no image yet).
3. Then send the sheets one by one: upload `Tn_….png` and paste the sheet prompt. Do not mix sheets in one message.
4. Check each result with the **checklist** at the end. If it fails, say what is wrong and ask for a new version of the same sheet.
5. Send the finished PNGs to Claude with the file names `faces.png`, `hair_back.png`, `hair_front.png`, `eyes.png`, `features.png`, `clothes_top.png`, `body_base.png`, `body_clothes.png`.

Plan B if alignment keeps failing: send only `hair_front`, `eyes`, `clothes_top` and `body_clothes` (the most valuable ones); Claude keeps drawing the rest in code.

---

## Master message (paste first)

```
I am making a cozy Japanese-learning game for adults. I need layered, mix-and-match character PARTS as sprite sheets. I will send one grid template
at a time. The template shows guides in blue dashes (head, eyes, nose, mouth, body) and a cell number in the top-left corner. Those guides and numbers are
only for positioning: DO NOT draw them in the result.

GLOBAL RULES FOR EVERY SHEET
- Output one PNG with exactly the same size and grid as the template (columns x rows of equal cells). No margins, no cell borders, no text, no numbers.
- Background: flat, pure magenta (#FF00FF) everywhere that is not part of the drawing, including inside every cell. No shadows on the background, no gradients.
- Every part must be drawn in exactly the position the guides show, at exactly the same scale in every cell. Do not move, rotate, crop or rescale anything.
  Leave at least 8 px of magenta between the drawing and the cell edge. Nothing may cross into a neighbouring cell.
- Style: chunky pixel-art look, as if drawn on a 48x48 pixel grid and enlarged; hard square pixel edges, NO anti-aliasing, NO blur, NO gradients, NO textures,
  NO soft glow. Limited palette. A 1-pixel dark outline (#241811) around shapes. Light comes from the top left. Friendly, slightly cartoonish proportions.
- Faces must look friendly and calm. Eyes always have a white of the eye, a coloured iris, a darker pupil and one tiny white highlight - never plain black squares or dots.
- "Tintable" parts (hair, eyebrows, clothes) must be drawn in NEUTRAL GREY only, with exactly three tones: light #b4b4b4, base #808080, dark #505050, plus the dark
  outline. They will be recoloured by the game. No colour at all on tintable parts.
- Adult, family-friendly, no nudity, no logos, no text.
Reply only with the image. Do not explain.
```

---

## Sheet 1 – `faces.png` (upload `T1_faces.png`, 4 columns × 3 rows, cell 256×256, sheet 1024×768)
```
Sheet 1: bare heads. Draw a plain, blank face base: head, both ears, neck, and the shoulders as a plain skin-coloured shape ending at the dashed shoulder line.
NO hair, NO eyes, NO eyebrows, NO nose, NO mouth, NO clothes - a completely blank face (only a very subtle cheek shade is allowed).
Rows = face shape. Row 1 (cells 1-4): ROUND face. Row 2 (cells 5-8): SQUARE face with a softly squared jaw. Row 3 (cells 9-12): LONG, oval face.
Columns = skin tone, the same in every row: column 1 very light #f4d2b4, column 2 light tan #e6b68c, column 3 tan #c78f60, column 4 dark brown #8c5b3c.
Use two shades per skin tone (base and a slightly darker shade for the neck and under the chin).
```

## Sheet 2 – `hair_back.png` (upload `T2_hair_back.png`, 3 × 2, sheet 768×512)
```
Sheet 2: the part of the hair that is BEHIND the head and shoulders (it will be drawn first, the head goes on top). Tintable neutral grey only.
Columns = hair texture: column 1 STRAIGHT, column 2 CURLY (round curls), column 3 WAVY (soft S-waves).
Row 1 (cells 1-3): SHORT hair - only the little bit that peeks out behind the ears and neck. If almost nothing would be visible, draw very little.
Row 2 (cells 4-6): LONG hair - falls behind the shoulders down to the bottom of the shoulder line.
The silhouettes in each column must match across both rows and match the front-hair sheet that I will send next.
```

## Sheet 3 – `hair_front.png` (upload `T3_hair_front.png`, 3 × 2, sheet 768×512)
```
Sheet 3: the FRONT of the hair: top of the head, fringe/bangs, and the side locks that frame the face. The forehead below the fringe and the face stay free
(transparent magenta) so that the face shows through. Tintable neutral grey only (three tones + outline).
Same grid as the previous hair sheet: columns = STRAIGHT (1), CURLY (2), WAVY (3). Row 1 = SHORT hair (ends at the ears), Row 2 = LONG hair (side locks
continue down over the shoulders). The head guide is the ellipse: hair must sit exactly on it and match the back-hair sheet.
```

## Sheet 4 – `eyes.png` (upload `T4_eyes.png`, 4 × 3, sheet 1024×768)
```
Sheet 4: eyes only, both eyes together, placed exactly on the two blue "+" marks at eye height. Do NOT draw skin, eyebrows or anything else - only the two eyes.
Each eye: dark upper lash line (outline colour), white of the eye, coloured iris, darker pupil, one tiny white highlight.
Rows = eye size: Row 1 (cells 1-4) BIG round eyes (about 22 px wide each in this 256 px cell). Row 2 (cells 5-8) SMALL eyes (about 14 px wide).
Row 3 (cells 9-12) NARROW eyes - wide but thin, half-closed look, the iris partly hidden.
Columns = iris colour, the same in every row: column 1 BLACK-BROWN #2a211c, column 2 BROWN #6e4527, column 3 BLUE #3f84d6, column 4 GREEN #3f9b5c.
```

## Sheet 5 – `features.png` (upload `T5_features.png`, 4 × 2, sheet 1024×512)
```
Sheet 5: nose, mouth and eyebrows, each on the blue marks of its own position (nose mark, mouth mark, eyebrows above the eye marks). Draw only the feature itself
on magenta, no face.
Row 1 = NOSES, drawn only as soft shading marks and nostrils in a mid brown #9a6a45 with a lighter highlight #f4d2b4 (so they work on every skin tone):
 cell 1 BIG nose, cell 2 SMALL nose, cell 3 HIGH nose (long bridge, prominent), cell 4 LOW nose (flat, only nostrils).
Row 2:
 cell 5 BIG mouth (wide smile, lips red #b9564c, darker top lip #8c3a33), cell 6 SMALL mouth (little closed smile),
 cell 7 THICK EYEBROWS (both brows, thick), cell 8 THIN EYEBROWS (both brows, thin). Eyebrows in tintable neutral grey.
```

## Sheet 6 – `clothes_top.png` (upload `T6_clothes_top.png`, 4 × 1, sheet 1024×256)
```
Sheet 6: upper-body clothes and hats for the portrait view. Tintable neutral grey only (three tones + outline).
Cell 1: a simple CREW-NECK T-SHIRT: covers the shoulder shape from the neck base down to the bottom of the cell, short sleeves ending at the cell edges.
Cell 2: a V-NECK shirt, same size.
Cell 3: a CAP/beanie sitting on top of the head guide (covers the upper head only).
Cell 4: a BRIMMED HAT sitting on top of the head guide, brim wider than the head.
Leave the neck, face and ears free (magenta). Cells 3-4 must not draw any body.
```

## Sheet 7 – `body_base.png` (upload `T7_body_base.png`, 4 × 1, cell 192×336, sheet 768×336)
```
Sheet 7: a full-body base figure standing straight, front view, arms hanging down, feet together. Draw it like a smooth artist's MANNEQUIN in skin colour:
simple body shape, a plain round head with a BLANK face (no eyes, nose, mouth, hair), hands as simple mitten shapes, plain feet. No anatomy details, no clothes.
Follow the guides: head ellipse, torso box, two arm boxes, two leg boxes. Four skin tones in the four cells: 1 #f4d2b4, 2 #e6b68c, 3 #c78f60, 4 #8c5b3c
(base colour + one darker shade).
```

## Sheet 8 – `body_clothes.png` (upload `T8_body_clothes.png`, 6 × 1, sheet 1152×336)
```
Sheet 8: full-body clothing pieces, drawn on the same body guides as the previous sheet, tintable neutral grey only (three tones + outline).
Cell 1: short-sleeve SHIRT covering the torso box and the upper part of the arms.
Cell 2: long TROUSERS covering both leg boxes from the waist to the ankles.
Cell 3: knee-length SKIRT starting at the waist, covering the top of the legs.
Cell 4: a pair of SHOES (sneakers) at the bottom of the legs.
Cell 5: a CAP on top of the head guide.
Cell 6: a wide-BRIMMED HAT on top of the head guide.
Nothing else: no body, no skin, only the clothing piece on magenta.
```

---

## Checklist for every result (before sending it to Claude)
- [ ] Same grid and proportions as the template (not stretched), 4/3/6 columns as stated.
- [ ] Background is flat magenta everywhere; no blue guides, numbers, text or cell borders.
- [ ] The drawing sits on the guides; the same part is in the same place in every cell of the same sheet.
- [ ] Pixel look with hard edges (no blur / anti-aliasing / gradients).
- [ ] Tintable parts are neutral grey only. Eyes are not plain black squares.
- [ ] Friendly faces, no nudity, no text.

## What Claude does with the sheets
Chroma-keys the magenta, slices the grid, snaps the colours to a small palette, scales to the in-game size with nearest-neighbour (portraits 40×40, bodies 32×56),
recolours the grey parts (hair colours, shirt/trousers/skirt/hat colours), assembles the layers in the character editor and the quests, and keeps the current
code-drawn characters as a fallback. The origin of the sheets (your ChatGPT session, date) is recorded in `docs/ASSETS.md`.

---

## Round 2 (after the first sheets, 2026-11-23)
**Received and used:** `faces`, `hair_front`, `hair_back`, `eyes` (one sheet), `features` – they work very well together (see `docs/ASSETS.md`).
**Still needed:** `body_base` (sheet 7), `body_clothes` (sheet 8), and plain `clothes_top` (sheet 6). The two clothes sheets that came back were fantasy costumes with capes, belts, armour and baked-in
colours – they cannot be recoloured, so they are not used. Use the stricter wording below (send the template again; one sheet per message):

```
Redo this sheet. Last time you drew fantasy costumes. I need PLAIN, SIMPLE EVERYDAY clothes only, drawn in neutral grey (three greys + dark outline), nothing else:
NO capes, NO belts, NO buckles, NO armour, NO gold trim, NO straps, NO patterns, NO colours at all. Each item is one flat, plain garment so that I can tint it.
Same grid, same magenta background, same rules as before. Draw exactly what is listed for each cell and nothing more.
```
For sheet 8 (full body) add: *"Each garment must fit the guide boxes of the body template exactly: shirt over the torso and upper arms, trousers over the legs, skirt from the waist to the knees,
shoes at the bottom of the legs. Plain t-shirt, plain trousers, plain skirt, plain sneakers, plain cap, plain wide-brim hat."*
Tip: if the model keeps adding details, ask for ONE garment per image (6 small requests) on a magenta background, same size, and send all six.
