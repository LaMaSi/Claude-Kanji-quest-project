// German noun-phrase helpers. Deliberately small: only the forms the patterns need.
const DEF = { nom: { m: 'der', f: 'die', n: 'das' }, acc: { m: 'den', f: 'die', n: 'das' }, dat: { m: 'dem', f: 'der', n: 'dem' } };
const IND = { nom: { m: 'ein', f: 'eine', n: 'ein' }, acc: { m: 'einen', f: 'eine', n: 'ein' }, dat: { m: 'einem', f: 'einer', n: 'einem' } };
export const NUMBER_WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
export const KNOWN_WEAK = ['Bär', 'Mensch', 'Junge', 'Herr', 'Nachbar', 'Löwe', 'Affe', 'Hase', 'Kunde'];

/** noun with case ending (weak masculine nouns: Bär -> Bären in acc/dat/gen) */
function noun(w, kase) {
  if (w.weak && w.gender === 'm' && kase !== 'nom') return w.de.endsWith('e') ? w.de + 'n' : w.de + 'en';
  return w.de;
}
export function np(w, kase, definite) {
  if (!definite && w.mass) return noun(w, kase);
  return `${(definite ? DEF : IND)[kase][w.gender]} ${noun(w, kase)}`;
}
/** "im Dorf", "in der Burg" (in + dative with contraction) */
export function inDat(w) {
  const n = noun(w, 'dat');
  return w.gender === 'f' ? `in der ${n}` : `im ${n}`;
}
/** "ins Dorf", "in den Wald", "in die Taverne" (in + accusative, direction) */
export function inAcc(w) {
  const n = noun(w, 'acc');
  return w.gender === 'm' ? `in den ${n}` : w.gender === 'f' ? `in die ${n}` : `ins ${n}`;
}
export const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
