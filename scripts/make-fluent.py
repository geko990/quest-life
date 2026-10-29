#!/usr/bin/env python3
"""Genera public/fluent/ con i disegni Fluent Emoji di Microsoft (licenza MIT, public/fluent/LICENSE.txt).

  public/fluent/3d/<codice>.webp     3D, 128 px  — emoji grandi (radar, selettore, intestazioni, celebrazioni)
  public/fluent/color/<codice>.webp  Color, 64 px — emoji piccole (tessere, liste, testi, nav bar)

<codice> = punti di codice dell'emoji in esadecimale minuscolo uniti da "-", senza FE0F (es. 💪 → 1f4aa,
🧑‍🎨 → 1f9d1-200d-1f3a8). Per le emoji con i toni della pelle si usa la versione "Default".
L'app (src/utils/fluent.js) calcola lo stesso codice: non serve un elenco.

Uso (serve Playwright per Python e Pillow):
  git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/fluentui-emoji /tmp/fluent
  cd /tmp/fluent && git sparse-checkout set --no-cone '/assets/*/metadata.json' '/assets/*/3D/*' '/assets/*/Color/*' \
     '/assets/*/Default/3D/*' '/assets/*/Default/Color/*' /LICENSE && cd -
  python3 scripts/make-fluent.py /tmp/fluent
"""
import base64, glob, json, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fluent'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fluent')
os.makedirs(f'{OUT}/3d', exist_ok=True)
os.makedirs(f'{OUT}/color', exist_ok=True)

color = []
for meta in glob.glob(f'{SRC}/assets/*/metadata.json'):
    m = json.load(open(meta)); d = os.path.dirname(meta)
    code = '-'.join('%x' % ord(c) for c in m['glyph'] if c != '️')
    base = d + ('/Default' if os.path.isdir(d + '/Default') else '')
    if os.path.isdir(base + '/3D'):
        f = os.path.join(base + '/3D', os.listdir(base + '/3D')[0])
        im = Image.open(f).convert('RGBA'); im.thumbnail((128, 128), Image.LANCZOS)
        im.save(f'{OUT}/3d/{code}.webp', 'WEBP', quality=82, method=6)
    if os.path.isdir(base + '/Color'):
        color.append((code, os.path.join(base + '/Color', os.listdir(base + '/Color')[0])))

# Le Color sono SVG: si disegnano a 64 px nel browser (stesso risultato che si vedrebbe nell'app)
JS = """async (items) => { const res = [];
  for (const [code, svg] of items) {
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + svg; await img.decode();
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, 64, 64);
    res.push([code, c.toDataURL('image/webp', 0.86)]);
  } return res; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for i in range(0, len(color), 100):
        items = [(c, base64.b64encode(open(f, 'rb').read()).decode()) for c, f in color[i:i + 100]]
        for code, url in pg.evaluate(JS, items):
            open(f'{OUT}/color/{code}.webp', 'wb').write(base64.b64decode(url.split(',', 1)[1]))
    b.close()
codes = sorted(f[:-5] for f in os.listdir(f'{OUT}/color') if f.endswith('.webp'))
with open(os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'fluentCodes.js'), 'w') as f:
    f.write("// File generato da scripts/make-fluent.py: emoji per cui esiste il disegno Fluent (public/fluent/).\n")
    f.write("// Serve a non chiedere al sito disegni che non esistono (le altre restano emoji del telefono).\n")
    f.write("export const FLUENT_CODES = new Set('" + ' '.join(codes) + "'.split(' '));\n")
print('fatto:', len(os.listdir(f'{OUT}/3d')), '3D,', len(os.listdir(f'{OUT}/color')), 'Color')
