# Brand Guidelines — proposed v2.1 amendments

**Status:** proposed, not yet incorporated. Raised during the website build, 2026-09-10.

Three places where the prose in `brand_guidelines.md` (v2.0) disagrees with the approved artwork in
this folder. In each case **the artwork is correct and the prose should be amended to match it** —
the PNGs are the signed-off rendering, and both lockups agree with each other.

Measurements were taken from the 1600px-wide Set 1 renders by isolating ink pixels against the
`#0A0A0A` ground and measuring bounding boxes. Where a "unit" is quoted, it is the reference unit of
§2.2, derived from the symbol's ink bounding box (see amendment 1).

The website implements the **artwork** values. `src/lib/logo-geometry.ts` is the single source of
truth in code and carries a pointer to this file.

---

## What v2.0 gets right

§2.2's geometry specification reproduces the artwork exactly, and is worth stating explicitly
because it lets the symbol be rebuilt as vector from the document alone:

- Left (human) arc: circle centre `(-54, 0)`, radius 54, from `(-54, -54)` to `(-54, 54)`, bulging right.
- Right (system) arc: the same mirrored about the y-axis, centre `(54, 0)`, bulging left.
- Both arcs pass through the origin — this is the shared touch point of §6.
- Stroke 8, round caps. Connector stroke 6 from `x = -46` to `x = +46`. Terminal dots radius 7 at `(±46, 0)`.

Verified: symbol ink bounding box measures 948 × 948 px at 8.172 px/unit, and the leftmost cyan
pixel (the left terminal dot's outer edge) sits at −52.8 units against a predicted −53. ✓

---

## Amendment 1 — §2.2 / §2.4: state which height the 1.5× ratio applies to

**Current text (§2.4):** "The **symbol** is rendered **50% taller** than the wordmark cap height […]
The symbol then renders at 162 reference units total height."

**Problem:** "total height" is ambiguous. The symbol has two heights: the centre-line height of the
arcs (108 units, per §2.2) and the ink height including the round stroke caps (116 units). The ratio
only holds for the first.

**Measured:**

| Lockup | Symbol ink height | Wordmark cap height | Ratio vs ink | Ratio vs drawn (×108/116) |
|---|---|---|---|---|
| `set1-dark__that-ai.png` | 271 px | 170 px | 1.594 | **1.485** |
| `set1-dark__that-ai-consultancy.png` | 132 px | 83 px | 1.590 | **1.489** |

**Proposed wording:** "The symbol's *drawn* height — 108 reference units, measured along the arc
centre-lines and excluding the round stroke caps — is 50% greater than the wordmark cap height.
Note that the symbol's *ink* height is 116 units once the caps are included; the 1.5× ratio does not
apply to that figure."

---

## Amendment 2 — §2.4: clearspace is ≈40 units, not 54

**Current text:** "**Clearspace:** a horizontal gap of one full symbol radius (54 reference units)
between the symbol's rightmost edge and the wordmark's leftmost glyph."

**Measured:** ≈40 units in both lockups, not 54.

| Lockup | Gap | Scale | Gap in units | Gap ÷ cap height |
|---|---|---|---|---|
| `set1-dark__that-ai.png` | 93 px | 2.336 px/unit | 39.8 | 0.547 |
| `set1-dark__that-ai-consultancy.png` | 44 px | 1.138 px/unit | 38.7 | 0.530 |

**Note on why these may not be strictly comparable:** the measurement is ink-edge to ink-edge. The
spec's "leftmost glyph" may intend the glyph's *advance origin* rather than its ink, and DM Sans
Bold's "T" carries a small left side bearing. Similarly "the symbol's rightmost edge" may mean the
arc endpoint centre-line (`x = +54`) rather than the outer edge of its round cap (`x = +58`).
Together these account for part but **not all** of the 14-unit discrepancy.

**Proposed:** re-specify as a ratio of cap height, which is scale-independent and matches both
renders: "a horizontal gap of 0.55 × wordmark cap height between the symbol's rightmost ink edge and
the wordmark's leftmost ink." If the 54-unit figure is the intended design and the renders are
wrong, the artwork needs regenerating — please confirm which.

---

## Amendment 3 — §4 vs §4.1: the document contradicts itself on wordmark tracking, and neither figure is right

**§4 (Typography table), Wordmark row:** "Wide tracking (+80), sentence case, never uppercase"
**§4.1 (Wordmark Typography in Lockups):** "Letter-spacing: **−2** (slightly tight)."

These cannot both be true. **Measured, the artwork is wide-tracked at ≈ +57/1000 em** — so §4 has
the right direction and §4.1 is simply wrong, but §4's magnitude is also off by about a third.

**Method.** DM Sans' cap height is exactly 0.700 em (`OS/2.sCapHeight` 700 ÷ `head.unitsPerEm` 1000),
so the artwork's 170 px cap height fixes the font size at 242.86 px with no free parameter left.
Rendering "That AI" in DM Sans Bold at that size in Chrome and matching the ink bounding box against
the artwork's:

| Tracking | Rendered ink box | Artwork ink box | Match |
|---|---|---|---|
| −2/1000 em (§4.1) | 812 × 179 px | 898 × 180 px | no — 86 px too narrow |
| **+57/1000 em (measured)** | **899 × 179 px** | **898 × 180 px** | **yes, within 1 px** |
| +80/1000 em (§4) | 931 × 179 px | 898 × 180 px | no — 33 px too wide |

Letterforms were also compared side by side at matched cap height and are identical, confirming the
face is DM Sans Bold (700) and not the ExtraBold (800) used for display headlines.

**Proposed wording (§4.1):** "Letter-spacing: **+57/1000 em** (0.057em). Wide, not tight."
And in the §4 table, replace "Wide tracking (+80)" with "Wide tracking — see §4.1 for the exact value."

**Correction note:** an earlier draft of this document asserted the artwork was tightly tracked and
that §4.1 should win. That was judged by eye and was wrong; the measurements above supersede it. The
website implements +0.057em.

---

## Separate issue — asset inventory is incomplete

§8 states the document is accompanied by **nine** source files (three sets × three lockups). Eight
were supplied. Missing:

- `set2-light__that-ai-consultancy.png`

Three Set 1 files also arrived under working names rather than the inventory's names. They have been
renamed in this folder to match §8:

| Supplied as | Renamed to |
|---|---|
| `that-ai-logo.png` | `set1-dark__that-ai.png` |
| `that-ai-logo-no-text.png` | `set1-dark__symbol.png` |
| `that-ai-logo copy.png` | *(deleted — byte-identical duplicate of the symbol, md5 `16e0cd42…`)* |

**Also outstanding:** §8 notes that "final brand applications should always be served from vector
source", but only PNGs were supplied. The website currently rebuilds the symbol as inline SVG from
the §2.2 geometry, which is verified against the artwork but is a reconstruction. **Official SVG
sources are still needed.**

One practical note: every Set 1 PNG has an opaque `#0A0A0A` background rather than transparency, so
they cannot be placed on the Void Grey `#1A1A1A` secondary surface. Transparent backgrounds on the
Set 1 exports would make them usable in more contexts.
