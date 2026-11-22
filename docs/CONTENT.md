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
