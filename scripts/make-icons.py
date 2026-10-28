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

ALL = ['linear', 'bold', 'bold-duotone']
DUO = ['bold-duotone']
ICONS = {
    # Barra di navigazione (linea vuota a riposo, piena sulla scheda attiva)
    **{n: ALL for n in ['notebook', 'rocket', 'cup-star', 'heart-pulse', 'cart-large-minimalistic', 'settings', 'wallet-money']},
    # Tessere (bicolore piena)
    **{n: ALL for n in ['target', 'stopwatch', 'chef-hat', 'fire', 'waterdrop', 'walking']},
    # Livello del personaggio nelle celebrazioni
    'medal-star': DUO,
}
# Attributi e abilità: l'elenco è in src/utils/statIcons.js (STAT_ICON_CHOICES), solo bicolore piena
import re
_stat = open('src/utils/statIcons.js').read()
_choices = re.search(r'STAT_ICON_CHOICES = \[(.*?)\];', _stat, re.S).group(1)
for n in re.findall(r"'([a-z0-9-]+)'", _choices):
    ICONS.setdefault(n, DUO)

# Disegni fatti a mano nello stile di Solar (24×24, tratto 1.5, angoli tondi): Solar non ha un dado
CUSTOM = {
    'dice-linear': '<g fill="none"><rect width="18" height="18" x="3" y="3" stroke="currentColor" stroke-width="1.5" rx="5"/><circle cx="8.5" cy="8.5" r="1.25" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.25" fill="currentColor"/><circle cx="12" cy="12" r="1.25" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.25" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.25" fill="currentColor"/></g>',
    'dice-bold': '<path fill="currentColor" fill-rule="evenodd" d="M8 2.25h8A5.75 5.75 0 0 1 21.75 8v8A5.75 5.75 0 0 1 16 21.75H8A5.75 5.75 0 0 1 2.25 16V8A5.75 5.75 0 0 1 8 2.25M8.5 7.25a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5m7 0a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5M12 10.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5m-3.5 3.5a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5m7 0a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5" clip-rule="evenodd"/>',
    'dice-bold-duotone': '<rect width="19.5" height="19.5" x="2.25" y="2.25" fill="currentColor" opacity=".5" rx="5.75"/><g fill="currentColor"><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="15.5" cy="8.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8.5" cy="15.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/></g>',
}

src = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/icon-sets/json/solar.json'))
out = {}
for name, variants in ICONS.items():
    for v in variants:
        key = f'{name}-{v}'
        icon = src['icons'].get(key)
        if icon is None:
            icon = src['icons'][src['aliases'][key]['parent']]
        out[key] = icon['body']
out.update(CUSTOM)

with open('src/utils/solarIcons.js', 'w') as f:
    f.write('// File generato da scripts/make-icons.py: non modificare a mano.\n')
    f.write('// Icone Solar di 480 Design (https://www.figma.com/community/file/1166831539721848736), licenza CC BY 4.0.\n')
    f.write('// Disegni 24×24 in SVG; il colore viene da currentColor.\n')
    f.write('export const SOLAR = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(out), 'disegni scritti')
