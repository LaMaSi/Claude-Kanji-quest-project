# World, map, yokai dex and progression – design (v1 proposal, nothing built yet)

## 1. The map = a landscape lesson
A map screen with **7 places**: Dorf (村), Stadt (city), Kleinstadt (町), See (湖), Berge (山), Küste/Strand (浜辺), Wald (森). Plus an optional "Obstgarten"/Felder as a sub-place.
- Each place shows its **picture (GBA scene)**, its Japanese name in the current script (Schriftwahl), and the German name on request. Tap a place = word card + picture + 🔊.
- Map exercises: "Wo ist der See?" (tap it), an NPC describes where something is and you travel there, matching pictures to words. New places unlock chapter by chapter.
- Candidate words (all to be checked by the reviewer): 村, 町, 湖(みずうみ), 山, 海/海岸, 浜辺(はまべ), 森, 川, 道, 畑(はたけ), 都市/街 for the city (exact word to be decided with the reviewer).
- Style options for the map: (a) one overworld picture with tappable markers (needs one map image, see `docs/SCENES.md` → `map.png`), (b) a simple node graph drawn in code. Start with (b) so it works today, swap in (a) later.

## 2. Every place has things to find and things to do
| Place | Things (found/bought) | Activities |
|---|---|---|
| Dorf | cucumbers (きゅうり), bread, tea, medicine | talk to people, home, quest board |
| Stadt / Kleinstadt | fried tofu (油揚げ), sake, clothes, cosmetics | shopping, information from NPCs |
| See | fish, reeds | fishing (catch the right word) |
| Küste | fish, shells, seaweed | fishing, collecting |
| Wald | mushrooms, herbs, berries | gathering, animals |
| Berge | herbs, stones | climbing, wind and snow yokai |
| Obstgarten (Feld) | **peaches (桃)**, apples | picking and counting (numbers!) |
Each item has **sources**: a place where it exists, and sometimes an NPC who sells it. You do *not* see the sources on the map from the start: you learn them from NPCs (below).

## 3. The yokai request loop (the heart of the game)
1. **Meet** a yokai at its habitat (a Gespräch encounter): it says in Japanese that it wants something.
2. **Understand**: what does it want? (listening/reading task; wrong guess = Unruhe rises a little).
3. **Ask around**: NPCs give short hints in Japanese ("Pfirsiche gibt es im Obstgarten bei den Bergen"). The player must understand them to know **where to travel**; the hint goes into the *Notizbuch* (German + Japanese, tap to translate).
4. **Travel and gather**: go to the place, do the activity (fishing, picking, buying).
5. **Offer** the item: pick it (picture + word) and say the polite phrase. The yokai calms down.
6. **Friendship**: Dex entry, lore card, rewards.
Example (all text draft until reviewed): Kappa at the lake wants cucumbers → a villager says where they grow → you pick them in the fields → you bow and offer them (the kappa bows back: a lore moment about politeness).
Examples of requests: kappa – cucumber (village field) · kitsune – fried tofu (town shop) · tanuki – sake (town tavern) · a mountain spirit – warm tea · a shore spirit – fish.

## 4. Yokai-Dex (妖怪図鑑 ようかいずかん) and animal book
- One page per creature: picture (silhouette until met), Japanese name (all scripts), German name, **habitat** (map place), **request**, German **lore card**, words you learned from it, status: *unbekannt → begegnet → befreundet*.
- Ordinary animals have their own **Tierbuch** (pictures + words): good vocabulary revision.
- Completion % per place and in total.

## 5. Progression and rewards
- **Every friendship**: EXP, gold (円) and sometimes a gift item. **Every 3rd entry / each place completed**: a milestone reward and a **title** (e.g. "Freund der Kappa").
- **Gold buys cosmetics** for your character in the town shop: hats, hair, clothes in colours, glasses, shoes. They are described in Japanese with the words from the character editor (color + garment) and show on your portrait and in battle. A **Kleiderschrank** at home keeps what you own.
- Level-ups raise HP/MP and unlock spells (kanji) and higher battle input levels.

## 6. Data and checks (so correctness stays first)
- New file `content/world.json`: places, items (with sources), NPC hint lines, yokai (habitat, request, lines, lore). All Japanese/German goes through the same review sheets.
- The validator checks that every yokai request can be fulfilled (item exists and has a reachable source), that every hint names the right place, and that every place and item has a picture.

## 7. Build slices (each ends with a new APK you can try)
1. **Map + places + landscape vocabulary** (node map, place cards, "Wo ist …?" tasks, notizbuch).
2. **Battle screen + Kampf (animals)**; tiers of input levels 1–2.
3. **First yokai (kappa)**: Gespräch + request loop + fields/lake activities + Dex entry.
4. **Dex, rewards, cosmetics shop, Kleiderschrank**.
5. **More places/yokai**, then input levels 3–4 and Kanji-Zauber.
