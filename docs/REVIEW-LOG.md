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
