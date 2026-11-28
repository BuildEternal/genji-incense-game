"""Rebuild the bundled font subsets from the full OFL fonts in google/fonts.

Usage:
  python3 scripts/subset_fonts.py DIR
where DIR holds NotoSerifJP[wght].ttf, Newsreader[opsz,wght].ttf and
Newsreader-Italic[opsz,wght].ttf (from ofl/notoserifjp and ofl/newsreader).
Needs: pip install fonttools brotli

Noto Serif JP keeps every character at or above U+3000 in the data and source
files plus all kana and CJK punctuation, as static 500 and 700 weights.
Newsreader keeps Latin, Latin-1 and Latin Extended-A (for ō, ū) with its weight
and optical-size axes.
"""
import pathlib, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
out = root / 'src/assets/fonts'

def save(font, name, unicodes):
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    sub = subset.Subsetter(opts); sub.populate(unicodes=unicodes); sub.subset(font)
    font.flavor = 'woff2'; font.save(out / name)
    print(name, (out / name).stat().st_size, 'bytes')

files = [root / 'data/genji_poems_v2.jsonl', root / 'data/genji_buckets.json', *sorted((root / 'src').glob('*.ts'))]
cjk = {ord(c) for f in files for c in f.read_text(encoding='utf8') if ord(c) >= 0x3000}
cjk |= set(range(0x3000, 0x3100)) | set(range(0xff01, 0xff5f))
for weight in (500, 700):
    font = instancer.instantiateVariableFont(TTFont(src / 'NotoSerifJP[wght].ttf'), {'wght': weight})
    save(font, f'noto-serif-jp-{weight}.woff2', cjk)

latin = [*range(0x20, 0x7f), *range(0xa0, 0x180), *range(0x2010, 0x2027), 0x2030, 0x2039, 0x203a, 0x20ac, 0x2122, 0x2190, 0x2192, 0x2212, 0x0304]
save(instancer.instantiateVariableFont(TTFont(src / 'Newsreader[opsz,wght].ttf'), {'wght': (400, 700)}), 'newsreader.woff2', latin)
save(instancer.instantiateVariableFont(TTFont(src / 'Newsreader-Italic[opsz,wght].ttf'), {'wght': (400, 500)}), 'newsreader-italic.woff2', latin)
