"""
Renders studio-style illustrations for the three catalogue products that have
no photograph (dog bowl stand, cat water fountain, Bluetooth speaker), so every
product card shows an image file rather than the inline SVG fallback.

    pip install cairosvg
    python scripts/make-product-art.py

Output: public/images/dog-bowls.jpg, cat-fountain.jpg, speaker.jpg (744x464).
"""

import io
import os

import cairosvg
from PIL import Image

W, H = 744, 464
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images")


def frame(body, bg1="#F4F5F7", bg2="#E3E6EA"):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{bg1}"/><stop offset="1" stop-color="{bg2}"/>
    </linearGradient>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B9BEC4"/><stop offset="0.5" stop-color="#F2F4F6"/><stop offset="1" stop-color="#A9AEB4"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8B5E3C"/><stop offset="0.5" stop-color="#B07A4F"/><stop offset="1" stop-color="#7E5335"/>
    </linearGradient>
    <linearGradient id="plastic" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#D9E4F0"/><stop offset="0.45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C5D2E0"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FC6EE"/><stop offset="1" stop-color="#4C97D2"/>
    </linearGradient>
    <linearGradient id="fabric" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1F2A38"/><stop offset="0.5" stop-color="#3A4A5E"/><stop offset="1" stop-color="#1B2430"/>
    </linearGradient>
    <pattern id="mesh" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.3" fill="#0D141C" opacity="0.55"/>
    </pattern>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  {body}
</svg>"""


def shadow(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#shadow)"/>'


# 1. Elevated dog bowl stand with two stainless bowls
bowls = shadow(372, 372, 250, 30) + """
  <rect x="150" y="300" width="444" height="34" rx="8" fill="url(#wood)"/>
  <rect x="150" y="300" width="444" height="6" rx="3" fill="#C8916A" opacity="0.6"/>
  <rect x="172" y="334" width="26" height="56" rx="5" fill="#6E4629"/>
  <rect x="546" y="334" width="26" height="56" rx="5" fill="#6E4629"/>
  <rect x="172" y="334" width="26" height="8" fill="#4F3119" opacity="0.5"/>
  <rect x="546" y="334" width="26" height="8" fill="#4F3119" opacity="0.5"/>
  <ellipse cx="262" cy="300" rx="86" ry="14" fill="#5A3A22" opacity="0.5"/>
  <ellipse cx="482" cy="300" rx="86" ry="14" fill="#5A3A22" opacity="0.5"/>
  <path d="M176 262 h172 c-4 30 -26 48 -86 48 s-82 -18 -86 -48z" fill="url(#steel)"/>
  <ellipse cx="262" cy="262" rx="86" ry="16" fill="#E8EBEE"/>
  <ellipse cx="262" cy="262" rx="72" ry="11" fill="#CBD1D7"/>
  <path d="M396 262 h172 c-4 30 -26 48 -86 48 s-82 -18 -86 -48z" fill="url(#steel)"/>
  <ellipse cx="482" cy="262" rx="86" ry="16" fill="#E8EBEE"/>
  <ellipse cx="482" cy="262" rx="72" ry="11" fill="#CBD1D7"/>
  <path d="M200 268 q20 28 62 34" stroke="#fff" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
  <path d="M420 268 q20 28 62 34" stroke="#fff" stroke-width="3" fill="none" opacity="0.7" stroke-linecap="round"/>
"""

# 2. Cat water fountain, 2.5 L, with a running stream
fountain = shadow(372, 400, 180, 26) + """
  <path d="M232 250 h280 l-18 128 q-4 18 -24 18 h-196 q-20 0 -24 -18z" fill="url(#plastic)"/>
  <ellipse cx="372" cy="250" rx="140" ry="24" fill="#EAF1F8"/>
  <ellipse cx="372" cy="252" rx="124" ry="17" fill="url(#water)"/>
  <ellipse cx="372" cy="250" rx="124" ry="17" fill="none" stroke="#BBD6EE" stroke-width="2"/>
  <ellipse cx="372" cy="248" rx="70" ry="8" fill="#B7DBF7" opacity="0.6"/>
  <ellipse cx="372" cy="246" rx="34" ry="4" fill="#DFF0FD" opacity="0.8"/>
  <rect x="330" y="118" width="84" height="130" rx="16" fill="url(#plastic)"/>
  <rect x="330" y="118" width="84" height="130" rx="16" fill="none" stroke="#C9D5E2" stroke-width="2"/>
  <ellipse cx="372" cy="118" rx="42" ry="10" fill="#F6F9FC"/>
  <ellipse cx="372" cy="118" rx="30" ry="6" fill="#DCE6F0"/>
  <path d="M360 128 c-4 26 -2 52 12 84" stroke="#fff" stroke-width="4" fill="none" opacity="0.8" stroke-linecap="round"/>
  <path d="M372 112 c-22 20 -34 46 -34 70 q0 22 14 30" stroke="url(#water)" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M372 112 c22 20 34 46 34 70 q0 22 -14 30" stroke="url(#water)" stroke-width="9" fill="none" stroke-linecap="round"/>
  <circle cx="336" cy="220" r="5" fill="#8FC6EE"/><circle cx="410" cy="226" r="4" fill="#8FC6EE"/>
  <rect x="300" y="360" width="144" height="14" rx="7" fill="#C9D5E2"/>
  <text x="372" y="341" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" fill="#7C8A99" text-anchor="middle" letter-spacing="3">2.5 L</text>
"""

# 3. Waterproof Bluetooth speaker, cylindrical, on its side
speaker = shadow(372, 350, 230, 26) + """
  <rect x="150" y="190" width="444" height="130" rx="65" fill="url(#fabric)"/>
  <rect x="200" y="196" width="344" height="118" rx="59" fill="url(#mesh)"/>
  <rect x="150" y="190" width="444" height="130" rx="65" fill="none" stroke="#0F161E" stroke-width="2"/>
  <ellipse cx="150" cy="255" rx="26" ry="65" fill="#2C3A4C"/>
  <ellipse cx="150" cy="255" rx="16" ry="48" fill="#111820"/>
  <ellipse cx="594" cy="255" rx="26" ry="65" fill="#2C3A4C"/>
  <ellipse cx="594" cy="255" rx="16" ry="48" fill="#111820"/>
  <rect x="330" y="204" width="84" height="102" rx="14" fill="#1A2330" opacity="0.9"/>
  <circle cx="372" cy="238" r="9" fill="none" stroke="#DDE3EA" stroke-width="3"/>
  <line x1="372" y1="226" x2="372" y2="238" stroke="#DDE3EA" stroke-width="3" stroke-linecap="round"/>
  <line x1="352" y1="274" x2="392" y2="274" stroke="#DDE3EA" stroke-width="3" stroke-linecap="round"/>
  <line x1="372" y1="262" x2="372" y2="286" stroke="#DDE3EA" stroke-width="3" stroke-linecap="round"/>
  <circle cx="372" cy="296" r="3" fill="#F5A623"/>
  <path d="M175 210 q200 -18 396 0" stroke="#fff" stroke-width="4" fill="none" opacity="0.18" stroke-linecap="round"/>
  <path d="M600 300 c40 -6 44 -60 8 -92" stroke="#3A4A5E" stroke-width="8" fill="none" stroke-linecap="round"/>
"""

for name, body in [("dog-bowls", bowls), ("cat-fountain", fountain), ("speaker", speaker)]:
    png = cairosvg.svg2png(bytestring=frame(body).encode(), output_width=W * 2, output_height=H * 2)
    im = Image.open(io.BytesIO(png)).convert("RGB").resize((W, H), Image.LANCZOS)
    path = os.path.join(OUT, f"{name}.jpg")
    im.save(path, quality=88, optimize=True, progressive=True)
    print("wrote", os.path.relpath(path))
