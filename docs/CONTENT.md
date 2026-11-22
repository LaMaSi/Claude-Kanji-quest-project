# Content pipeline (correctness first)

Nothing reaches learners unless it passed the checks below. All learner-facing text lives in `content/`, never in code.

## Files
- `content/words.json` – one record per word/expression. `jp` is markup `{漢字|かんじ}` with words separated by spaces.
  Fields: `id`, `pos` (noun/verb/adj/expr/pron/dem/q), `jp`, `de`, `ch` (chapter), `status` (`draft` → `checked` → `reviewed`).
  Nouns: `gender` (m/f/n), `pl`, `mass` (uncountable), `weak` (Bär→Bären), `tags` (food, drink, item, animal, animate, place, person, money).
  Verbs: `masu`, `de1` (ich-form), `objects` (tags of nouns the verb may take). `kanjiCommon:false` = show kana instead of rare kanji in the game.
- `content/patterns.json` – sentence patterns with curated `fills`. Sentences are generated from them, so a pattern is checked once and all its sentences follow. German is built with real case/article rules (`tools/lib/german.mjs`).
- `content/generated/sentences.json` – output of the generator (do not edit).

## Checks – `node tools/validate.mjs` (needs `npm install` once)
- Markup, kana, ids, required fields, German capitalisation, weak nouns, plurals.
- Pattern slots (word type/tags), verb–object compatibility, no unresolved tokens, punctuation, 何+です must be なん.
- Number words (300 さんびゃく, 600 ろっぴゃく, 800 はっぴゃく, 3000 さんぜん, 8000 はっせん, …) and romaji unit tests.
- Independent cross-check of kanji readings against the kuromoji dictionary (warnings only: a human decides).
These checks cannot prove grammar or naturalness – that is what the external review is for.

## External review – `node tools/make-review.mjs` → `review/*.md`
Paste one sheet at a time into ChatGPT, paste the answer table back to Claude, who fixes every flagged row and sets `status` to `reviewed`.
Unreviewed (`draft`) content must not be used by the adaptive engine in a release.

## Learning engine (`engine.js`, UI in `learn.js`)
- Per word: confidence 1–5 (`neu … sehr sicher`), optional lock (🔒 = never changed automatically), streak, recent answers, next due date.
- Up: 2–3 correct in a row; down: 2 misses within the last 3. Wrong answers come back immediately, sure words after 8–21 days.
- New words per session depend on accuracy of the last 20 answers and the number of wobbly words (0–3). Never more than 2 sessions without a new word unless accuracy < 70 %.
- Chapters unlock when ≥70 % of the previous chapter was met and the average confidence is ≥ 2.5.
- Sentences enter once all their words are solid (avg conf ≥ 3). Questions: pick the translation, pick the Japanese, or build the sentence from word chips.
- Wrong answers are chosen by similarity: far apart at confidence 1 (different type/sound), close at confidence 5. Furigana disappears from prompts at confidence ≥ 4.
- Content with status `draft` is never shown. `node tools/test-engine.mjs` simulates fast / medium / slow learners and checks these rules.
