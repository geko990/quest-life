#!/usr/bin/env python3
"""Genera src/utils/emojiIndex.js: tutte le emoji con disegno Fluent (public/fluent/), divise per gruppo,
nell'ordine di Unicode, con i nomi per la ricerca in italiano e in inglese (selettore delle emoji, #56).

Fonti (tutte pubbliche):
  - Fluent Emoji di Microsoft (gruppo e parole chiave inglesi):
      git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/fluentui-emoji /tmp/fluent
      cd /tmp/fluent && git sparse-checkout set --no-cone '/assets/*/metadata.json' && cd -
  - CLDR (nomi e parole chiave italiani, licenza Unicode):
      git clone --depth 1 --filter=blob:none --sparse https://github.com/unicode-org/cldr-json /tmp/cldr
      cd /tmp/cldr && git sparse-checkout set --no-cone '/cldr-json/cldr-annotations-full/annotations/it/*' \
         '/cldr-json/cldr-annotations-derived-full/annotationsDerived/it/*' && cd -
  - gemoji di GitHub (ordine di Unicode e nomi inglesi, licenza MIT):
      git clone --depth 1 --filter=blob:none --sparse https://github.com/github/gemoji /tmp/gemoji
      cd /tmp/gemoji && git sparse-checkout set --no-cone /db/emoji.json && cd -

Uso: python3 scripts/make-emoji-index.py /tmp/fluent /tmp/cldr /tmp/gemoji
Il file generato si carica solo quando si apre il selettore (import dinamico), non all'avvio.
"""
import glob, json, os, re, sys, unicodedata

FLUENT, CLDR, GEMOJI = (sys.argv[1:4] + ['/tmp/fluent', '/tmp/cldr', '/tmp/gemoji'][len(sys.argv) - 1:])[:3]
ROOT = os.path.join(os.path.dirname(__file__), '..')
SKIN = {0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF}

def code(e):
    return '-'.join('%x' % ord(c) for c in e if ord(c) != 0xFE0F and ord(c) not in SKIN)

codes = set(re.search(r"new Set\('([^']*)'", open(f'{ROOT}/src/utils/fluentCodes.js').read()).group(1).split())

# Gruppi dell'app (id) per i gruppi di Unicode
GROUP = {
    'Smileys & Emotion': 'mood', 'People & Body': 'people', 'Animals & Nature': 'nature',
    'Food & Drink': 'food', 'Travel & Places': 'places', 'Activities': 'activities',
    'Objects': 'objects', 'Symbols': 'symbols', 'Flags': 'symbols',
}

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

it = {}
for f in glob.glob(f'{CLDR}/cldr-json/**/it/annotations.json', recursive=True):
    data = json.load(open(f))
    ann = next(iter(data.values()))  # {"annotations": {...}} o {"annotationsDerived": {...}}
    for k, v in (ann.get('annotations') or {}).items():
        if any(ord(ch) in SKIN for ch in k):
            continue  # varianti con il tono della pelle: aggiungerebbero solo "carnagione chiara" ecc.
        it.setdefault(code(k), []).extend((v.get('tts') or []) + (v.get('default') or []))

fl = {}
for meta in glob.glob(f'{FLUENT}/assets/*/metadata.json'):
    m = json.load(open(meta))
    c = code(m['glyph'])
    if c in codes:
        fl[c] = m

order = []
seen = set()
for g in json.load(open(f'{GEMOJI}/db/emoji.json')):
    c = code(g['emoji'])
    if c in fl and c not in seen:
        seen.add(c); order.append((c, g))
for c in sorted(fl):
    if c not in seen:
        seen.add(c); order.append((c, None))

groups = {}
search = []
for c, g in order:
    m = fl[c]
    glyph = g['emoji'] if g else m['glyph']
    gid = GROUP.get(m.get('group'), 'symbols')
    groups.setdefault(gid, []).append(glyph)
    words = it.get(c, []) + [m.get('cldr', '')] + (m.get('keywords') or [])
    if g:
        words += [g.get('description', '')] + g.get('aliases', []) + g.get('tags', [])
    terms = []
    for w in words:
        for t in norm(w).split():
            if t not in terms:
                terms.append(t)
    search.append(glyph + '\t' + ' '.join(terms))

out = [
    '// File generato da scripts/make-emoji-index.py: tutte le emoji con disegno Fluent, per gruppo e',
    "// nell'ordine di Unicode, con le parole per la ricerca (italiano e inglese, minuscole e senza accenti).",
    '// Si carica solo quando si apre il selettore delle emoji (import dinamico in EmojiPickerSheet).',
    'export const EMOJI_GROUPS = ' + json.dumps(groups, ensure_ascii=False, separators=(',', ':')) + ';',
    'export const EMOJI_SEARCH = ' + json.dumps('\n'.join(search), ensure_ascii=False) + ';',
    '',
]
open(f'{ROOT}/src/utils/emojiIndex.js', 'w').write('\n'.join(out))
print({k: len(v) for k, v in groups.items()}, 'tot', sum(len(v) for v in groups.values()),
      'senza italiano:', sum(1 for c, _ in order if c not in it))
