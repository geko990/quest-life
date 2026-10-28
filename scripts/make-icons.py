#!/usr/bin/env python3
"""Genera src/utils/solarIcons.js con le sole icone Solar usate dall'app (#53).

Solar di 480 Design, licenza CC BY 4.0 (citata in Opzioni → Guida e info).
I disegni si prendono dal pacchetto Iconify, repository pubblico iconify/icon-sets:
  git clone --depth 1 --filter=blob:none --sparse https://github.com/iconify/icon-sets /tmp/icon-sets
  git -C /tmp/icon-sets sparse-checkout set --no-cone /json/solar.json
  python3 scripts/make-icons.py /tmp/icon-sets/json/solar.json
Per aggiungere un'icona: metti il nome (senza variante) in ICONS e rilancia lo script.
Varianti salvate per ogni icona: linear (vuota), bold (piena), bold-duotone (bicolore piena).
"""
import json, sys

ICONS = [
    # Barra di navigazione (linea vuota a riposo, piena sulla scheda attiva)
    'notebook', 'rocket', 'cup-star', 'heart-pulse', 'cart-large-minimalistic', 'settings', 'wallet-money',
    # Home (bicolore piena)
    'target', 'stopwatch', 'chef-hat', 'fire', 'waterdrop', 'walking',
]
VARIANTS = ['linear', 'bold', 'bold-duotone']

src = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/icon-sets/json/solar.json'))
out = {}
for name in ICONS:
    for v in VARIANTS:
        key = f'{name}-{v}'
        icon = src['icons'].get(key)
        if icon is None:
            icon = src['icons'][src['aliases'][key]['parent']]
        out[key] = icon['body']

with open('src/utils/solarIcons.js', 'w') as f:
    f.write('// File generato da scripts/make-icons.py: non modificare a mano.\n')
    f.write('// Icone Solar di 480 Design (https://www.figma.com/community/file/1166831539721848736), licenza CC BY 4.0.\n')
    f.write('// Disegni 24×24 in SVG; il colore viene da currentColor.\n')
    f.write('export const SOLAR = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print(len(out), 'disegni scritti')
