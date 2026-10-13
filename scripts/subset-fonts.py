"""
Builds the self-hosted web fonts in src/app/fonts/ from the Google Fonts sources.

Why: next/font/google declares every Unicode subset, so a single Naira sign (U+20A6, which lives
in latin-ext) made the browser fetch an extra ~100 KB of fonts that blocked the first paint.
These files contain exactly what the site uses: Basic Latin, Latin-1, common punctuation and the
Naira sign, in the real brand fonts.

Both fonts are SIL OFL 1.1 licensed. Sources:
  https://github.com/google/fonts/raw/main/ofl/inter/Inter[opsz,wght].ttf
  https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans[wght].ttf

Usage (needs `pip install fonttools brotli`):
  python scripts/subset-fonts.py path/to/Inter[opsz,wght].ttf path/to/PlusJakartaSans[wght].ttf

If the site starts using another script or symbol, add its code point to UNICODES and re-run.
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

UNICODES = "U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+20A6"
OUT = Path(__file__).resolve().parent.parent / "src" / "app" / "fonts"


def build(source: str, name: str, limits: dict) -> None:
    font = TTFont(source)
    # Pin the optical-size axis and clip the weight range to what the stylesheets use.
    font = instancer.instantiateVariableFont(font, limits)
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = [1, 2, 3, 4, 6]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    font.flavor = "woff2"
    target = OUT / name
    font.save(target)
    print(f"{name}: {target.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    build(sys.argv[1], "inter-latin.woff2", {"opsz": 14, "wght": (400, 800)})
    build(sys.argv[2], "plus-jakarta-sans-latin.woff2", {"wght": (400, 800)})
