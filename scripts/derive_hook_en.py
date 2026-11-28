"""Fill links[].hook_en in data/genji_buckets.json from data/genji_glosses.json.

hook_en = content words both linked glosses share (after scripts/english_stopwords.txt
and a light plural strip). Same idea as the Japanese hook, but for English readers:
the echo check keeps these words out of unrelated poems in a round.
Links that already have hook_en are left alone, so hand edits survive re-runs.
Run from the repository root: python3 scripts/derive_hook_en.py
"""
import json, re

STOP = set(open('scripts/english_stopwords.txt').read().split())
MANUAL = {(206, 207): ['towline', 'rope'], (432, 433): ['blow'], (591, 593): ['scent', 'fragrant']}

def stem(w):
    if w.endswith('ies') and len(w) > 4: return w[:-3] + 'y'
    if w.endswith('es') and w[:-2].endswith(('sh', 'ch', 'ss', 'x')): return w[:-2]
    if w.endswith('s') and not w.endswith('ss') and len(w) > 3: return w[:-1]
    return w

def words(s):
    return {stem(x) for x in re.findall(r"[a-z]+", s.lower().replace("'s", "")) if x not in STOP and len(x) > 2}

gloss = {g['poem_id']: g['english'] for g in json.load(open('data/genji_glosses.json'))['glosses']}
data = json.load(open('data/genji_buckets.json'))
for bucket in data['buckets']:
    for link in bucket['links']:
        if 'hook_en' in link: continue
        a, b = link['poems']
        key = (min(a, b), max(a, b))
        link['hook_en'] = MANUAL.get(key) or sorted(words(gloss[a]) & words(gloss[b]))
with open('data/genji_buckets.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write('\n')
