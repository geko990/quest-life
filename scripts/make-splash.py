#!/usr/bin/env python3
"""Genera le immagini di avvio di iOS (apple-touch-startup-image) e i relativi <link> in index.html.

Ogni immagine è identica al primo fotogramma dell'apertura animata di index.html (#40):
sfondo notte, anello vuoto e medaglione rotondo con l'icona, nella stessa posizione.
Va rilanciato solo se cambiano l'icona o la geometria dell'apertura.

Uso: python3 scripts/make-splash.py   (richiede Pillow: pip install pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'splash'
ICON = ROOT / 'public' / 'icon.png'
INDEX = ROOT / 'index.html'

NIGHT = (15, 15, 26)
TRACK = (167, 139, 250, int(0.14 * 255))
EDGE = (167, 139, 250, int(0.14 * 255))

# Schermi degli iPhone in verticale: larghezza e altezza in punti, densità
DEVICES = [
    (440, 956, 3),  # 16 Pro Max, 17 Pro Max
    (430, 932, 3),  # 14 Pro Max, 15 Plus / Pro Max, 16 Plus
    (428, 926, 3),  # 12/13 Pro Max, 14 Plus
    (420, 912, 3),  # Air
    (414, 896, 3),  # XS Max, 11 Pro Max
    (414, 896, 2),  # XR, 11
    (402, 874, 3),  # 16 Pro, 17, 17 Pro
    (393, 852, 3),  # 14 Pro, 15, 15 Pro, 16
    (390, 844, 3),  # 12/13/14, 12/13 Pro
    (375, 812, 3),  # X, XS, 11 Pro, 12/13 mini
    (375, 667, 2),  # SE 2/3, 8
]


def render(w_pt, h_pt, dpr, icon):
    W, H = w_pt * dpr, h_pt * dpr
    # Stessa geometria del CSS di #ql-boot: --u = min(1vw, 0.6vh)
    u = min(W / 100, 0.6 * H / 100)
    emblem = 44 * u
    cx = W / 2
    cy = H / 2 - 2 * u - (emblem + 7 * u + 5.4 * u) / 2 + emblem / 2

    ss = 3  # disegno in alta risoluzione e poi riduco, per bordi morbidi
    size = int(round(emblem * ss))
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # anello vuoto: raggio 47 su 100, spessore 3,2 su 100
    r = 0.47 * size
    stroke = 0.032 * size
    c = size / 2
    d.ellipse([c - r - stroke / 2, c - r - stroke / 2, c + r + stroke / 2, c + r + stroke / 2], outline=TRACK, width=max(1, int(round(stroke))))
    # medaglione: 84% dell'emblema, icona ritagliata a cerchio
    tile = int(round(0.84 * size))
    ic = icon.resize((tile, tile), Image.LANCZOS)
    mask = Image.new('L', (tile, tile), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, tile - 1, tile - 1], fill=255)
    off = (size - tile) // 2
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([off, off + 10 * ss * dpr, off + tile, off + tile + 10 * ss * dpr], fill=(0, 0, 0, 115))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14 * ss * dpr))
    layer = Image.alpha_composite(shadow, layer)
    layer.paste(ic, (off, off), mask)
    ImageDraw.Draw(layer).ellipse([off, off, off + tile - 1, off + tile - 1], outline=EDGE, width=max(1, ss * dpr // 2))
    layer = layer.resize((int(round(emblem)), int(round(emblem))), Image.LANCZOS)

    img = Image.new('RGBA', (W, H), NIGHT + (255,))
    img.alpha_composite(layer, (int(round(cx - emblem / 2)), int(round(cy - emblem / 2))))
    return img.convert('RGB')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    icon = Image.open(ICON).convert('RGB')
    links = []
    for w, h, dpr in DEVICES:
        name = f'splash-{w * dpr}x{h * dpr}.png'
        render(w, h, dpr, icon).save(OUT / name, optimize=True)
        links.append(
            f'  <link rel="apple-touch-startup-image" media="screen and (device-width: {w}px) and (device-height: {h}px) '
            f'and (-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)" href="./splash/{name}">'
        )
    block = '<!-- SPLASH-LINKS -->\n' + '\n'.join(links) + '\n  <!-- /SPLASH-LINKS -->'
    html = INDEX.read_text(encoding='utf-8')
    start = html.index('<!-- SPLASH-LINKS -->')
    end = html.find('<!-- /SPLASH-LINKS -->')
    end = end + len('<!-- /SPLASH-LINKS -->') if end != -1 else start + len('<!-- SPLASH-LINKS -->')
    INDEX.write_text(html[:start] + block + html[end:], encoding='utf-8')
    print(f'{len(DEVICES)} immagini in {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
