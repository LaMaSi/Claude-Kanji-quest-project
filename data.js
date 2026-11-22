// Content. m = markup {漢字|かな}, de = German. cat: group used for quiz distractors.
export const VOCAB = {
  // animals (enemies)
  okami:   { m: '{狼|おおかみ}', de: 'der Wolf', cat: 'animal' },
  inu:     { m: '{犬|いぬ}', de: 'der Hund', cat: 'animal' },
  neko:    { m: '{猫|ねこ}', de: 'die Katze', cat: 'animal' },
  tori:    { m: '{鳥|とり}', de: 'der Vogel', cat: 'animal' },
  uma:     { m: '{馬|うま}', de: 'das Pferd', cat: 'animal' },
  sakana:  { m: '{魚|さかな}', de: 'der Fisch', cat: 'animal' },
  kuma:    { m: '{熊|くま}', de: 'der Bär', cat: 'animal' },
  kitsune: { m: '{狐|きつね}', de: 'der Fuchs', cat: 'animal' },
  ushi:    { m: '{牛|うし}', de: 'die Kuh', cat: 'animal' },
  buta:    { m: '{豚|ぶた}', de: 'das Schwein', cat: 'animal' },
  // shop & tavern
  ringo:   { m: '{林檎|りんご}', de: 'der Apfel', cat: 'item' },
  pan:     { m: 'パン', de: 'das Brot', cat: 'item' },
  kusuri:  { m: '{薬|くすり}', de: 'die Medizin', cat: 'item' },
  ocha:    { m: 'お{茶|ちゃ}', de: 'der Tee', cat: 'item' },
  mizu:    { m: '{水|みず}', de: 'das Wasser', cat: 'item' },
  sake:    { m: 'お{酒|さけ}', de: 'der Sake', cat: 'item' },
  // places
  mura:    { m: '{村|むら}', de: 'das Dorf', cat: 'place' },
  mise:    { m: '{店|みせ}', de: 'der Laden', cat: 'place' },
  sakaba:  { m: '{酒場|さかば}', de: 'die Taverne', cat: 'place' },
  ie:      { m: '{家|いえ}', de: 'das Haus', cat: 'place' },
  shiro:   { m: '{城|しろ}', de: 'die Burg', cat: 'place' },
  // game UI
  mochimono: { m: '{持|も}ち{物|もの}', de: 'das Inventar', cat: 'ui' },
  status:    { m: 'ステータス', de: 'die Werte', cat: 'ui' },
  save:      { m: 'セーブ', de: 'speichern', cat: 'ui' },
  load:      { m: 'ロード', de: 'laden', cat: 'ui' },
  okane:     { m: 'お{金|かね}', de: 'das Geld', cat: 'ui' },
  kuesuto:   { m: 'クエスト', de: 'der Auftrag', cat: 'ui' },
  benkyo:    { m: '{勉強|べんきょう}', de: 'das Lernen', cat: 'ui' },
  // people
  ojiisan:   { m: 'おじいさん', de: 'der alte Mann', cat: 'person' },
  obaasan:   { m: 'おばあさん', de: 'die alte Frau', cat: 'person' },
  okami_san: { m: 'おかみさん', de: 'die Wirtin', cat: 'person' },
  tenshu:    { m: '{店主|てんしゅ}', de: 'der Ladenbesitzer', cat: 'person' },
  kariudo:   { m: '{狩人|かりうど}', de: 'der Jäger', cat: 'person' },
};
export const ANIMALS = Object.keys(VOCAB).filter(k => VOCAB[k].cat === 'animal');

export const SHOP = [
  { id: 'ringo', price: 50 },
  { id: 'pan', price: 80 },
  { id: 'kusuri', price: 150, heal: 12 },
];

export const KANJI = {
  '人': ['ひと', 'der Mensch'], '一': ['いち', 'eins'], '二': ['に', 'zwei'], '三': ['さん', 'drei'],
  '大': ['おおきい', 'groß'], '小': ['ちいさい', 'klein'], '日': ['ひ・にち', 'Tag, Sonne'], '月': ['つき', 'Mond, Monat'],
  '水': ['みず', 'Wasser'], '火': ['ひ', 'Feuer'], '木': ['き', 'Baum, Holz'], '山': ['やま', 'Berg'],
  '川': ['かわ', 'Fluss'], '口': ['くち', 'Mund'], '手': ['て', 'Hand'], '目': ['め', 'Auge'],
  '食': ['たべる', 'essen'], '飲': ['のむ', 'trinken'], '店': ['みせ', 'Laden'], '金': ['かね', 'Geld, Gold'],
  '犬': ['いぬ', 'Hund'], '村': ['むら', 'Dorf'], '王': ['おう', 'König'], '夜': ['よる', 'Nacht'],
};

export const LORE_WOLF =
  'Im alten Japan wurde der Wolf nicht nur gefürchtet, sondern auch verehrt: 狼 (おおかみ, „Ōkami“) klingt wie 大神 – ' +
  '„großer Gott“. Bauern stellten Reis und Sake für die Wölfe bereit, damit sie Wildschweine von den Feldern fernhielten. ' +
  'Manche Schreine, z. B. in den Bergen von Chichibu, haben bis heute Wolfsstatuen als Wächter.';
