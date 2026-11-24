# Battle system – design (v1 built in 0.13: Kampf with Angriff/Zauber/Gegenstand/Fliehen, typed romaji→kana input, Kanji-Zauber spells, Zauberschule; Gespräch (C) lives in the yokai request loop)

Decisions so far: **C (talk to the creature) is a must**, **A (classic command battle)** next to it, **B (kanji spells) = the expert mode**. Calm, turn-based, bedtime-friendly.

## 1. Two kinds of encounters
Rule: **animal = fight, yokai = talk.** Yokai are never beaten, only calmed (see `docs/WORLD_DESIGN.md` for the request loop).
| | Kampf (A) | Gespräch (C) |
|---|---|---|
| Typical enemies | wolf, bear, boar, bandit | yokai (kappa, fox, tengu …), frightened animals |
| Goal | bring HP to 0 | bring **Unruhe** (agitation) to 0 |
| Your commands | Angriff · Zauber · Item · Fliehen | Antworten · Item anbieten · Zuhören |
| Ending | victory, EXP, gold | **Freundschaft**: the creature joins the *Yokai-Buch* (lore card in German), gift item, bigger EXP |
| Some enemies offer both | the player chooses 戦う (kämpfen) or 話す (sprechen) at the start |

**Gespräch (C) in detail:** each turn the creature says one short Japanese line that shows its need or mood ("Ich habe Hunger", "Wo ist …?"). You answer by choosing a reply or offering an item (picture + word).
Right answer: Unruhe sinks. Wrong answer: Unruhe rises a little and the creature repeats it more simply (never punished harshly). Three types of turns: understand (what does it want?), answer (a polite phrase or item),
cultural moment (a yokai custom, e.g. the kappa bows back – the right polite reply calms it). After a friendly ending a German lore card unlocks.

## 2. Input levels (the same task, harder input) – "Eingabestufe"
1. **Tippen** – choose one of 2–4 answers (pictures/words, similarity grows with your level).
2. **Bauen** – put word chips in the right order (sentence structure, particles).
3. **Tippen mit Tastatur** – type the answer. Two ways: the phone's Japanese keyboard, or our own **Romaji → Kana** field (works without installing a Japanese keyboard).
4. **Schreiben (Experte)** – write the kana/kanji with the finger. We check stroke order, direction and shape per character (same engine as the kanji practice; KanjiVG also has kana).
Damage/effect multiplier: ×1 · ×1.3 · ×1.6 · ×2. The adaptive engine **suggests** a level (confident words → higher); the player can always switch down in one tap. Default: Tippen.
**Time limit (generous, optional):** about 15 s + 5 s per character, shown as a slow bar; running out only costs the turn. Setting "Ohne Zeitlimit" (default for bedtime).

## 3. B as a game mode: Kanji-Zauber
- Spells are kanji: 火 Feuer · 水 Wasser · 木 Holz · 金 Metall/Gold · 土 Erde · 日/月 Licht … They unlock when you have *seen the stroke order* and written the kanji correctly once.
- A spell is **written** (level 4) or picked (levels 1–2, weaker). Elements give weaknesses (kappa: weak to 木? yokai lore decides) → a light puzzle layer.
- Also available as a stand-alone **Zauberschule** (no enemy): write the kanji you learned, with stars for quality. Good for 3-minute sessions.

## 4. How learning plugs in (the adaptive engine decides the content)
- Every command asks the engine for an item: Angriff = vocabulary of the enemy's group (animals, things); Item = nouns with pictures; Zauber = kanji; Antwort (C) = sentence patterns that are due.
- Words you know well appear in the higher input levels; shaky words stay at Tippen with obviously different wrong answers.
- Wrong answers are saved as "to review" and come back in the next Tagesrunde.
- Losing never deletes progress: you wake up at home with a short recap of the three words that mattered.

## 5. JRPG frame
HP/MP, level-ups (existing), equipment from the shop, a battle screen in GBA style (enemy picture on top, status, text box, commands as 2×2 big buttons in the thumb zone), hit flash, short text-box messages. Party members later.

## 6. Content needed (all through the review pipeline, status `draft` until reviewed)
- Battle words in kana: こうげき, まほう, どうぐ, にげる, たたかう, はなす, HP, MP …
- For each yokai: 6–10 lines + replies + lore card (German). First three: **Kappa** (river), **Kitsune** (shrine), **Wolf** (the village quest, can be calmed).
- Pictures: enemy illustrations (for the image tool) in `docs/SCENES.md`; sprites for small icons are mine.
- New kana stroke data (KanjiVG) for the writing level.

## 7. Proposed build order
1. Battle screen + Kampf (A) with levels 1–2, Items, Fliehen, win/lose, the wolf as test.
2. Gespräch (C) with the kappa, Unruhe meter, Yokai-Buch.
3. Input levels 3–4 (Romaji-Kana typing, writing) + time limit option.
4. Kanji-Zauber and the Zauberschule.
5. Review sheets for all new Japanese/German.

## 8. Open questions
1. ~~Wolf~~ **Decided:** an ordinary animal is always a *Kampf*; a **yokai** version of the same creature (e.g. the great wolf spirit 大神) is always a *Gespräch*. Type is shown by a badge on the enemy.
2. Is "Freundschaft" (collecting creatures in the Yokai-Buch) a good reward?
3. Time limit default OFF – ok?
4. Hero: your own avatar from the editor in the battle screen?
