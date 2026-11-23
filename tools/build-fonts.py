"""Subsets the handwriting font (Klee One, SIL OFL 1.1, Fontworks) to the characters the game uses -> assets/fonts/KleeOne-subset.woff2
Run again whenever new kanji appear in content or in the app text:  python3 tools/build-fonts.py   (needs: pip install fonttools brotli)
Source font: art/fonts-src/KleeOne-Regular.ttf (from https://github.com/google/fonts/tree/main/ofl/kleeone). License text: assets/fonts/OFL-KleeOne.txt"""
import glob, re, subprocess, sys
CJK = re.compile(r'[　-ヿ㐀-鿿＀-￯]')
text = set()
for f in glob.glob('content/*.json') + glob.glob('content/generated/*.json') + glob.glob('*.js'):
    text |= set(CJK.findall(open(f, encoding='utf8').read()))
kana = ''.join(chr(c) for c in list(range(0x3040, 0x30FF + 1)))                   # all hiragana + katakana
latin = ''.join(chr(c) for c in range(0x20, 0x7F)) + 'äöüÄÖÜßéèàçñ–—„“”‚‘’…·×→←▸✔✘'    # romaji, German, punctuation
chars = ''.join(sorted(text)) + kana + latin + '。、！？「」・ー〜…'
open('/tmp/font-chars.txt', 'w', encoding='utf8').write(chars)
subprocess.check_call([sys.executable, '-m', 'fontTools.subset', 'art/fonts-src/KleeOne-Regular.ttf', '--text-file=/tmp/font-chars.txt', '--flavor=woff2',
                       '--output-file=assets/fonts/KleeOne-subset.woff2', '--layout-features=*', '--no-hinting'])
print(len(set(chars)), 'characters ->', 'assets/fonts/KleeOne-subset.woff2')
