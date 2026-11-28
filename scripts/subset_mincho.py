"""Rebuild the Shippori Mincho subsets from the full OFL fonts (google/fonts, ofl/shipporimincho).

Usage: python3 scripts/subset_mincho.py PATH/ShipporiMincho-Medium.ttf PATH/ShipporiMincho-Bold.ttf
Keeps every character at or above U+3000 in the data and source files, plus all kana.
Needs: pip install fonttools brotli
"""
import pathlib, sys
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
files = [root / 'data/genji_poems_v2.jsonl', root / 'data/genji_buckets.json', *sorted((root / 'src').glob('*.ts'))]
chars = {c for f in files for c in f.read_text(encoding='utf8') if ord(c) >= 0x3000}
chars |= {chr(c) for c in range(0x3040, 0x3100)}  # hiragana and katakana
chars |= {chr(c) for c in range(0x3000, 0x3040)}  # CJK punctuation, including 〱
for src, weight in zip(sys.argv[1:3], (500, 700)):
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(font)
    out = root / f'src/assets/fonts/shippori-mincho-{weight}-subset.woff2'
    subset.save_font(font, str(out), opts)
    print(out.name, out.stat().st_size, 'bytes,', len(chars), 'characters requested')
