// Script handling: one source text -> kanji / hiragana / romaji. Numbers. No dependencies.
//
// Source format: words separated by spaces, kanji marked inline as {漢字|かんじ}.
//   "{林檎|りんご}を {三|み}つ {下|くだ}さい。"

const R = {
  あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',
  た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',
  ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'o',ん:'n',
  が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',
  ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',ゔ:'vu',
  ぁ:'a',ぃ:'i',ぅ:'u',ぇ:'e',ぉ:'o',
};
const SMALL = { ゃ:'ya', ゅ:'yu', ょ:'yo' };
const PUNCT = { '。':'.', '、':',', '！':'!', '？':'?', '「':'"', '」':'"', '…':'…', '・':' ' };

export const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

export function romanize(word) {
  const s = toHira(word);
  // particles at the end of a chunk: は→wa へ→e を→o (を is already o)
  let out = '', i = 0, geminate = false;
  while (i < s.length) {
    const c = s[i], nx = s[i + 1];
    if (PUNCT[c] !== undefined) { out += PUNCT[c]; i++; continue; }
    if (c === 'っ') { geminate = true; i++; continue; }
    if (c === 'ー') { out += out.slice(-1); i++; continue; }
    let r = R[c];
    if (r === undefined) { out += c; i++; continue; }
    if (nx && SMALL[nx]) {
      const y = SMALL[nx];
      if (c === 'し' || c === 'ち' || c === 'じ' || c === 'ぢ') r = r.slice(0, -1) + y.slice(1);
      else r = r.slice(0, -1) + y;
      if (c === 'し') r = 'sh' + y.slice(1); if (c === 'ち') r = 'ch' + y.slice(1); if (c === 'じ' || c === 'ぢ') r = 'j' + y.slice(1);
      i++;
    }
    if (geminate) { r = (r.startsWith('ch') ? 't' : r[0]) + r; geminate = false; }
    if (c === 'ん' && nx && /[あいうえおやゆよ]/.test(nx)) r = "n'";
    out += r; i++;
  }
  return out;
}

const isParticleChunk = w => /[はへ]$/.test(w);
export function romanizeChunk(kana) {
  const m = kana.match(/^(.*?)([はへ])([。、！？]*)$/);
  if (m && (m[1].length > 0 || true)) {
    const base = romanize(m[1]);
    return base + (m[2] === 'は' ? 'wa' : 'e') + romanize(m[3]);
  }
  return romanize(kana);
}

/** parse "{漢字|かな}" markup into segments */
export function parse(src) {
  return src.split(' ').map(word => {
    const segs = [];
    word.replace(/\{([^|}]+)\|([^}]+)\}|([^{]+)/g, (_, k, r, plain) => {
      if (plain !== undefined) segs.push({ k: plain, r: plain });
      else segs.push({ k, r, kanji: true });
    });
    return segs;
  });
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** render markup to HTML for the given mode: 'kanji' | 'kana' | 'romaji'.
 *  gloss(wordMarkup) -> string|null: when given, every word becomes a tappable span carrying its translation (data-g). */
export function render(src, mode, furi, gloss) {
  const raw = src.split(' '), words = parse(src);
  const parts = words.map((segs, i) => {
    let html;
    if (mode === 'kanji') {
      html = segs.map(s => s.kanji
        ? (furi ? `<ruby>${s.k}<rt>${s.r}</rt></ruby>` : s.k)
        : s.k).join('');
    } else {
      const kana = segs.map(s => s.r).join('');
      html = mode === 'kana' ? kana : romanizeChunk(kana);
    }
    if (!gloss || !html) return html;
    const g = gloss(raw[i]);
    return `<span class="tok"${g ? ` data-g="${esc(g)}"` : ''}>${html}</span>`;
  });
  return parts.join(mode === 'kanji' ? '' : ' ');
}

/** plain text for speech synthesis (kana so the voice reads kanji correctly) */
export const speakText = src => parse(src).map(w => w.map(s => s.r).join('')).join('');

// ---------- numbers ----------
const D = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const K = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function numKana(n) {
  if (n === 0) return 'ぜろ';
  let s = '';
  const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
  if (th) s += th === 1 ? 'せん' : th === 3 ? 'さんぜん' : th === 8 ? 'はっせん' : D[th] + 'せん';
  if (h) s += h === 1 ? 'ひゃく' : h === 3 ? 'さんびゃく' : h === 6 ? 'ろっぴゃく' : h === 8 ? 'はっぴゃく' : D[h] + 'ひゃく';
  if (t) s += (t === 1 ? '' : D[t]) + 'じゅう';
  if (o) s += D[o];
  return s;
}
export function numKanji(n) {
  if (n === 0) return '〇';
  let s = '';
  const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
  if (th) s += (th === 1 ? '' : K[th]) + '千';
  if (h) s += (h === 1 ? '' : K[h]) + '百';
  if (t) s += (t === 1 ? '' : K[t]) + '十';
  if (o) s += K[o];
  return s;
}
/** markup for a number, e.g. 150 -> {百五十|ひゃくごじゅう} */
export const num = n => `{${numKanji(n)}|${numKana(n)}}`;

// native counting 1–10 (ひとつ…とお)
const TSU = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];
const TSUK = ['', '一つ', '二つ', '三つ', '四つ', '五つ', '六つ', '七つ', '八つ', '九つ', '十'];
export const count = n => `{${TSUK[n]}|${TSU[n]}}`;
