// German noun-phrase helpers. Deliberately small: only the forms the patterns need.
const DEF = { nom: { m: 'der', f: 'die', n: 'das' }, acc: { m: 'den', f: 'die', n: 'das' }, dat: { m: 'dem', f: 'der', n: 'dem' } };
const IND = { nom: { m: 'ein', f: 'eine', n: 'ein' }, acc: { m: 'einen', f: 'eine', n: 'ein' }, dat: { m: 'einem', f: 'einer', n: 'einem' } };
export const NUMBER_WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
export const KNOWN_WEAK = ['Bär', 'Mensch', 'Junge', 'Herr', 'Nachbar', 'Löwe', 'Affe', 'Hase', 'Kunde'];

// adjective endings (nominative/accusative/dative; m f n)
const ADJ_WEAK = { nom: { m: 'e', f: 'e', n: 'e' }, acc: { m: 'en', f: 'e', n: 'e' }, dat: { m: 'en', f: 'en', n: 'en' } }; // after der/die/das
const ADJ_STRONG = { nom: { m: 'er', f: 'e', n: 'es' }, acc: { m: 'en', f: 'e', n: 'es' }, dat: { m: 'em', f: 'er', n: 'em' } }; // after ein / no article

/** noun (+ optional adjective "adj") with case endings; weak masculine nouns: Bär -> Bären */
function noun(w, kase, definite = false) {
  let n = w.de;
  if (w.weak && w.gender === 'm' && kase !== 'nom') n = n.endsWith('e') ? n + 'n' : n + 'en';
  if (w.adj) n = `${w.adj}${(definite ? ADJ_WEAK : ADJ_STRONG)[kase][w.gender]} ${n}`;
  return n;
}
/** dictionary form, e.g. "alter Mann", "Apfel" */
export const lemma = w => noun(w, 'nom', false);
export function np(w, kase, definite) {
  if (!definite && w.mass) return noun(w, kase, false);
  return `${(definite ? DEF : IND)[kase][w.gender]} ${noun(w, kase, definite)}`;
}
/** "im Dorf", "in der Burg" (in + dative with contraction) */
export function inDat(w) {
  const n = noun(w, 'dat', true);
  return w.gender === 'f' ? `in der ${n}` : `im ${n}`;
}
/** "ins Dorf", "in den Wald", "in die Taverne" (in + accusative, direction) */
export function inAcc(w) {
  const n = noun(w, 'acc', true);
  return w.gender === 'm' ? `in den ${n}` : w.gender === 'f' ? `in die ${n}` : `ins ${n}`;
}
export const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

/** German text shown for a word in lists/quizzes: nouns with definite article, everything else as is */
export const displayDe = w => (w.pos === 'noun' ? np(w, 'nom', true) : w.de);

/** one description sentence: part ("kami") + predicate ("nagai") -> { jp, de } e.g. 髪は 長いです。 / "Die Haare sind lang." */
export function describe(part, pred) {
  const predDe = pred.deBy?.[part.id] ?? pred.deAdj ?? pred.de;
  const sub = part.subjPl ? `die ${part.pl}` : np(part, 'nom', true);
  return { jp: `${part.jp} は ${pred.jp} です。`, de: capFirst(`${sub} ${part.subjPl ? 'sind' : 'ist'} ${predDe}.`) };
}
