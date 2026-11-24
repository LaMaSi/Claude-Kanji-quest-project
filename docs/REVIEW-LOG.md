# Review log

## Round 1 (22 Nov 2026) – external review of sheets 1–5 (80 words, 14 patterns, 78 sentences)
Result: 73 words and 13 patterns OK, 65 sentences OK as seen by the reviewer. Findings and how they were handled:

| Finding | Real error? | Action |
|---|---|---|
| 円 gender „die Yen“ | yes | `der Yen`, plural `Yen` (word `en`) |
| お酒 glossed „Sake“ (word + 2 sentences) | yes | now `Alkohol` (id renamed `osake`); the reiswine is 日本酒 |
| „ein Brot“ too specific (3 sentences) | style | パン is now used without article (`mass`): „Ich esse Brot.“; count sentences use Eier/Äpfel instead of Brote |
| おじいさん „der alter Mann“ | latent bug in the generator | adjective declension implemented (`adj` field); self-tests added; now „der alte Mann“ |
| 人 / 熊 „unrelated note (schwach: Bär→Bären)“ | no – artifact of my review sheet | sheet template fixed; data unchanged (Mensch/Bär really are weak nouns); kept open for a quick re-check |
| ある / いる „ich gibt“ | no – artifact of my review sheet (printed a placeholder) | placeholder field removed from those verbs |
| 酒場 „Taverne“ vs „Kneipe“ | style | **decision: keep „Taverne“** (fantasy setting), used consistently |
| つ counter explanation needs a qualifier | yes | sentence added to the pattern note |

Status rules: `reviewed` = a reviewer saw exactly this text and found it OK. Anything changed afterwards falls back to `checked` (words/patterns) or `draft` (sentences) and goes into the next review sheet (`node tools/make-review.mjs` only lists open items).

## Backlog from the reviewer (not for chapter 1–3 yet)
- Add a short note on は vs が (狼は怖い vs 狼が怖い) once learners are ready.
- Japanese has no articles: German „ein/der“ in translations is context-based; keep translations as natural German.

## Style decisions
- German addresses the player with „du“.
- 酒場 = „Taverne“, お酒 = „Alkohol“.

## Editor feedback round (2026-11-24) – wording changes, translations changed with them
| Change | Japanese | German |
|---|---|---|
| Mouth options | 口は 開いて います / 閉じて います (new words 開いて います, 閉じて います; replaces 大きい/小さい for the mouth) | offen / geschlossen |
| Nose "high" | 鼻は 高いです (unchanged) – button now shows the meaning for this body part | markant (wörtlich „hoch“); 低い at the nose: flach (wörtlich „niedrig“) |
| New hair colours | 紫, ピンク, 青い, 緑 | lila, pink, blau, grün |
| Editor buttons | 説明 / おわり | Beschreibung / Fertig |
| Clothes chips | – | Hemd → Oberkörper, Hose oder Rock → Beine (the options themselves stay Hose / Rock) |
All new or changed Japanese/German is `draft` and listed in the review sheets.

## Claude's own review pass (2026-11-24, replaces the external review for now)
Applied rules: word-for-word labels, bare nouns when standing alone, no locative titles (see CLAUDE.md).
| Finding | Action |
|---|---|
| 地図を みる translated "Die Karte: Orte kennenlernen" | → "Karte ansehen". All other button/title hints checked and made literal (Heutige Wiederholung, Schwarzes Brett ansehen, Personensuche: Gesicht …). |
| Titles "Kleinstadt – in der Kleinstadt" | → "Kleinstadt" (same for shops, yokai places) |
| "Das Fleisch" / "der Apfel" in lists, quizzes, cards | → bare nouns; sentences use proper articles ("eine Gurke dabei") |
| 金色 for blond hair | → 金髪 (きんぱつ), the natural word |
| 魚は 湖に あります (live fish) | → 魚は 湖に います (new pattern p_ani_place); fish in shops stay あります |
| Yokai wishes are game ideas, not folklore | Dex entry now says so |
| Yokai-Dex name | → "Yokai-Lexikon" (図鑑 = illustrated reference book) |
Status now `checked`: 59 words, 7 patterns, the yokai except Iso-onna, Shōjō, Chōchin-obake (the research document itself asks for a source check).
Still `draft` (unsure, please check when an external review is possible): ウェーブ (weibu), 口は 開いています / 閉じています (aiteimasu, tojite), the three yokai above.

## Kanji-Zauber (runes), 2026-11-24
New `content/runes.json`: 10 lessons × 5 kanji (all with KanjiVG stroke data). Each rune has a bare German meaning and the reading as used in the game's own words (e.g. 食 = {食|た}べる). Checked by Claude against `words.json`; status `checked`.
Unsure / simplified: 高 = "teuer" and 安 = "billig" (the kanji also mean "hoch" / "ruhig"; the game words only use the price meaning), 町 = "Kleinstadt" as in the word list, 緑 = "grün".
