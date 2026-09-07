"""
Renders the home-page hero slides and the promo strip as original artwork, so
the store ships no third-party marketing images.

    pip install cairosvg
    python scripts/make-banners.py

Output (public/images):
  hero-deals.jpg, hero-gifts.jpg, hero-home.jpg   2400x900, content in the top 45%
  *-phone.jpg variants of each                     1200x800, text above the objects
  promo-delivery.jpg                               2400x420

The hero slides keep their text and objects between x=480 and x=1920 and above
y=420, because the tile grid overlaps the bottom of the slide on desktop and the
sides are cropped on a phone.
"""

import io
import os

import cairosvg
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images")
FONT = "DejaVu Sans, Arial, Helvetica, sans-serif"


def svg(w, h, defs, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs>{defs}</defs>{body}</svg>'


def save(name, markup, w, h, quality=86):
    png = cairosvg.svg2png(bytestring=markup.encode(), output_width=w, output_height=h)
    im = Image.open(io.BytesIO(png)).convert("RGB")
    path = os.path.join(OUT, name)
    im.save(path, quality=quality, optimize=True, progressive=True)
    print("wrote", os.path.relpath(path), f"{os.path.getsize(path) // 1024} kB")


def grad(gid, c1, c2, x2="0", y2="1"):
    return f'<linearGradient id="{gid}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'


SHADOW = '<radialGradient id="sh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'


def shadow(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#sh)"/>'


def heading(lines, sub, x=480, y=150, size=88, color="#fff", subcolor="#FFFFFF", subsize=36):
    out = ""
    for i, line in enumerate(lines):
        out += f'<text x="{x}" y="{y + i * (size + 10)}" font-family="{FONT}" font-weight="bold" font-size="{size}" fill="{color}">{line}</text>'
    if sub:
        out += f'<text x="{x}" y="{y + len(lines) * (size + 10) + 14}" font-family="{FONT}" font-size="{subsize}" fill="{subcolor}" opacity="0.92">{sub}</text>'
    return out


def slide(name, defs, glow, objects, lines, sub, cta):
    """Writes the desktop slide (2400x900, content top-left and right) and a
    phone slide (1200x800, text on top, objects underneath) from one set of
    parts. `objects` uses the desktop coordinates; the phone version scales
    and moves the whole group."""
    desktop = (
        '<rect width="2400" height="900" fill="url(#bg)"/>' + glow + objects
        + heading(lines, sub) + pill(cta, 480, 150 + len(lines) * 98 + 60)
    )
    save(f"{name}.jpg", svg(2400, 900, defs, desktop), 2400, 900)
    ty = 150 + len(lines) * 98
    phone = (
        '<rect width="1200" height="800" fill="url(#bg)"/>'
        + '<g transform="translate(-760 215) scale(0.8)">' + objects + '</g>'
        + heading(lines, sub, x=150, y=120, size=74, subsize=34) + pill(cta, 150, 120 + len(lines) * 84 + 40)
    )
    save(f"{name}-phone.jpg", svg(1200, 800, defs, phone), 1200, 800)


def pill(text, x, y, fill="#FFD814", color="#0F1111"):
    w = 40 + len(text) * 19
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="64" rx="32" fill="{fill}"/>'
        f'<text x="{x + w / 2}" y="{y + 42}" font-family="{FONT}" font-weight="bold" font-size="30" fill="{color}" text-anchor="middle">{text}</text>'
    )


def gift(x, y, w, h, box, ribbon):
    lid = h * 0.22
    return (
        f'<rect x="{x}" y="{y + lid}" width="{w}" height="{h - lid}" rx="10" fill="{box}"/>'
        f'<rect x="{x - 8}" y="{y}" width="{w + 16}" height="{lid + 8}" rx="8" fill="{box}" filter="brightness(1.08)"/>'
        f'<rect x="{x + w / 2 - w * 0.07}" y="{y}" width="{w * 0.14}" height="{h}" fill="{ribbon}"/>'
        f'<rect x="{x - 8}" y="{y + lid * 0.4}" width="{w + 16}" height="{lid * 0.34}" fill="{ribbon}"/>'
        f'<path d="M{x + w / 2} {y} c-40 -40 -80 -60 -60 -8 c-20 -50 40 -30 60 8 c20 -38 80 -42 60 8 c20 -52 -20 -32 -60 -8z" fill="{ribbon}"/>'
    )


# 1. Deals slide
deals = (
    grad("bg", "#F97316", "#EA580C", "1", "1")
    + SHADOW
    + grad("boxA", "#FFF7ED", "#FDE1C7")
    + grad("boxB", "#7C2D12", "#9A3412")
    + grad("boxC", "#FDBA74", "#FB923C")
)
deals_objects = (
    '<g transform="translate(180 0)">'
    + '<circle cx="1620" cy="240" r="330" fill="#fff" opacity="0.08"/>'
    + '<circle cx="1620" cy="240" r="250" fill="#fff" opacity="0.06"/>'
    + shadow(1620, 440, 330, 40)
    + gift(1330, 250, 210, 190, "url(#boxA)", "#EA580C")
    + gift(1560, 200, 260, 240, "url(#boxB)", "#FDE68A")
    + gift(1720, 300, 170, 140, "url(#boxC)", "#7C2D12")
    + '<circle cx="1480" cy="380" r="58" fill="#0EA5E9"/><circle cx="1462" cy="360" r="18" fill="#fff" opacity="0.55"/>'
    + '<rect x="1900" y="330" width="60" height="110" rx="10" fill="#FEF3C7"/><rect x="1888" y="318" width="84" height="26" rx="8" fill="#FDE68A"/>'
    + '</g>'
)
slide("hero-deals", deals, "", deals_objects, ["Shop epic deals"], "Up to 50% off, today only", "See all deals")

# 2. Gifts slide
gifts = (
    grad("bg", "#1E3A5F", "#0F1F35", "1", "1")
    + SHADOW
    + grad("cam", "#F97316", "#C2410C")
    + grad("cup", "#F8FAFC", "#CBD5E1")
    + grad("hp", "#334155", "#0F172A")
)
gifts_objects = (
    '<circle cx="1640" cy="230" r="320" fill="#fff" opacity="0.05"/>'
    + shadow(1640, 430, 360, 40)
    # headphones
    + '<path d="M1300 380 v-120 a140 140 0 0 1 280 0 v120" stroke="url(#hp)" stroke-width="26" fill="none" stroke-linecap="round"/>'
    + '<rect x="1272" y="330" width="60" height="110" rx="24" fill="url(#hp)"/><rect x="1548" y="330" width="60" height="110" rx="24" fill="url(#hp)"/>'
    + '<rect x="1284" y="345" width="36" height="80" rx="14" fill="#64748B"/><rect x="1560" y="345" width="36" height="80" rx="14" fill="#64748B"/>'
    # camera
    + '<rect x="1640" y="250" width="250" height="190" rx="22" fill="url(#cam)"/>'
    + '<rect x="1660" y="226" width="90" height="34" rx="8" fill="#9A3412"/>'
    + '<circle cx="1765" cy="345" r="62" fill="#0F172A"/><circle cx="1765" cy="345" r="42" fill="#1E293B"/><circle cx="1765" cy="345" r="20" fill="#0EA5E9" opacity="0.8"/><circle cx="1750" cy="330" r="7" fill="#fff" opacity="0.8"/>'
    + '<circle cx="1855" cy="290" r="10" fill="#FDE68A"/>'
    # mug
    + '<path d="M1930 300 h120 v110 a30 30 0 0 1 -30 30 h-60 a30 30 0 0 1 -30 -30z" fill="url(#cup)"/>'
    + '<path d="M2050 320 h26 a26 26 0 0 1 0 52 h-26" stroke="#CBD5E1" stroke-width="16" fill="none"/>'
    + '<ellipse cx="1990" cy="300" rx="60" ry="14" fill="#E2E8F0"/><ellipse cx="1990" cy="302" rx="48" ry="9" fill="#78350F"/>'
    # watch
    + '<rect x="1478" y="380" width="60" height="120" rx="12" fill="#1E293B"/><rect x="1466" y="410" width="84" height="64" rx="16" fill="#0F172A"/><rect x="1476" y="420" width="64" height="44" rx="10" fill="#0EA5E9" opacity="0.85"/>'
)
slide("hero-gifts", gifts, "", gifts_objects, ["Gifts for everyone", "on your list"], "Curated picks under $50, delivered free", "Find a gift")

# 3. Home slide
home = (
    grad("bg", "#2F6B5B", "#1C4A3E", "1", "1")
    + SHADOW
    + grad("chair", "#D97706", "#B45309")
    + grad("pot", "#F5F5F4", "#D6D3D1")
)
home_objects = (
    '<circle cx="1640" cy="230" r="320" fill="#fff" opacity="0.06"/>'
    + shadow(1640, 440, 360, 40)
    # armchair
    + '<rect x="1300" y="230" width="260" height="150" rx="34" fill="url(#chair)"/>'
    + '<rect x="1280" y="300" width="60" height="110" rx="20" fill="#92400E"/><rect x="1520" y="300" width="60" height="110" rx="20" fill="#92400E"/>'
    + '<rect x="1320" y="340" width="220" height="70" rx="16" fill="#F59E0B"/>'
    + '<rect x="1310" y="410" width="18" height="34" fill="#1F2937"/><rect x="1532" y="410" width="18" height="34" fill="#1F2937"/>'
    # floor lamp
    + '<rect x="1636" y="180" width="10" height="260" fill="#111827"/><path d="M1580 200 l60 -110 h2 l60 110z" fill="#FDE68A"/><ellipse cx="1641" cy="440" rx="44" ry="10" fill="#111827"/>'
    + '<ellipse cx="1641" cy="130" rx="46" ry="12" fill="#FEF3C7" opacity="0.5"/>'
    # plant
    + '<path d="M1760 330 h120 l-14 110 h-92z" fill="url(#pot)"/><rect x="1752" y="318" width="136" height="24" rx="6" fill="#E7E5E4"/>'
    + '<path d="M1820 320 c-60 -20 -110 -80 -80 -140 c50 30 70 90 80 140z" fill="#16A34A"/>'
    + '<path d="M1820 320 c60 -20 110 -80 80 -140 c-50 30 -70 90 -80 140z" fill="#22C55E"/>'
    + '<path d="M1820 320 c-10 -60 0 -120 40 -170 c20 60 0 130 -40 170z" fill="#4ADE80"/>'
    # side table with books
    + '<rect x="1920" y="350" width="150" height="14" rx="4" fill="#E7E5E4"/><rect x="1935" y="364" width="12" height="80" fill="#A8A29E"/><rect x="2043" y="364" width="12" height="80" fill="#A8A29E"/>'
    + '<rect x="1950" y="318" width="90" height="16" rx="3" fill="#0EA5E9"/><rect x="1958" y="302" width="76" height="16" rx="3" fill="#F97316"/>'
)
slide("hero-home", home, "", home_objects, ["Refresh your space"], "New in home and kitchen, from $19", "Shop home")

# 4. Promo strip: free delivery
promo = grad("bg", "#EEF2F5", "#DFE6EC", "1", "0") + SHADOW + grad("box", "#D6A776", "#B9814E")
promo_body = (
    '<rect width="2400" height="420" fill="url(#bg)"/>'
    '<rect width="1150" height="420" fill="#232F3E"/>'
    '<path d="M1150 0 l60 0 l-60 420z" fill="#232F3E"/>'
    + heading(["Free delivery on every order"], "No minimum spend. Most items arrive in two days.", x=120, y=170, size=64)
    + shadow(1760, 350, 380, 30)
    + '<rect x="1420" y="150" width="230" height="180" rx="10" fill="url(#box)"/><rect x="1420" y="150" width="230" height="22" fill="#8B5E3C" opacity="0.5"/><rect x="1522" y="150" width="26" height="180" fill="#F5F5F4" opacity="0.6"/>'
    + '<rect x="1680" y="110" width="300" height="220" rx="10" fill="url(#box)"/><rect x="1680" y="110" width="300" height="24" fill="#8B5E3C" opacity="0.5"/><rect x="1816" y="110" width="28" height="220" fill="#F5F5F4" opacity="0.6"/>'
    + '<rect x="2010" y="190" width="170" height="140" rx="10" fill="url(#box)"/><rect x="2010" y="190" width="170" height="20" fill="#8B5E3C" opacity="0.5"/><rect x="2083" y="190" width="24" height="140" fill="#F5F5F4" opacity="0.6"/>'
)
save("promo-delivery.jpg", svg(2400, 420, promo, promo_body), 2400, 420)
