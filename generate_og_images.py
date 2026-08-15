#!/usr/bin/env python3
"""Generate OG images for Project Firefly in the editorial style."""

from PIL import Image, ImageDraw, ImageFont
import os, sys

# ─── Palette ────────────────────────────────────────────────────────────────
PAPER   = (245, 244, 241)
INK     = (22,  21,  15)
INK_SOFT= (58,  56,  47)
GRAY    = (107, 105, 96)
ACCENT  = (166, 67,  31)   # rust red

W, H = 1200, 630
MARGIN = 32          # outer margin to border rect
PAD    = 36          # inner padding from border rect

# ─── Font helpers ────────────────────────────────────────────────────────────
def find_font(candidates, size):
    """Try each path in turn; fall back to Pillow's default."""
    for path in candidates:
        if path and os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

# Common sans-serif bold paths on Linux/NixOS
SANS_BOLD_PATHS = [
    "/run/current-system/sw/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/run/current-system/sw/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
]
SANS_REGULAR_PATHS = [
    "/run/current-system/sw/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/run/current-system/sw/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
]
MONO_PATHS = [
    "/run/current-system/sw/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    "/run/current-system/sw/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/liberation/LiberationMono-Regular.ttf",
    "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
]

def find_any_font():
    """Return the first font file found."""
    import glob
    for pat in [
        "/run/current-system/sw/share/fonts/**/*.ttf",
        "/usr/share/fonts/**/*.ttf",
        "/home/**/.fonts/**/*.ttf",
    ]:
        hits = glob.glob(pat, recursive=True)
        if hits:
            return hits[0]
    return None

# Discover available fonts
_fallback = find_any_font()
SANS_BOLD_PATHS.append(_fallback)
SANS_REGULAR_PATHS.append(_fallback)
MONO_PATHS.append(_fallback)


def draw_card(
    title_lines,       # list of strings for the big title
    subtitle,          # tagline below title
    header_left,       # small mono top-left
    header_right,      # small mono top-right
    footer_left,       # small mono bottom-left
    footer_right,      # small mono bottom-right (accent colour)
    out_path,
    title_size=88,     # font size for title; reduce for longer titles
):
    img  = Image.new("RGB", (W, H), PAPER)
    d    = ImageDraw.Draw(img)

    # ── Fonts ──────────────────────────────────────────────────────────────
    f_header  = find_font(MONO_PATHS,         15)
    f_title   = find_font(SANS_BOLD_PATHS,    title_size)
    f_sub     = find_font(SANS_REGULAR_PATHS, 28)
    f_footer  = find_font(MONO_PATHS,         15)

    line_h = int(title_size * 1.09)   # line height scales with font

    # ── Outer border rect ──────────────────────────────────────────────────
    bx0, by0 = MARGIN, MARGIN
    bx1, by1 = W - MARGIN, H - MARGIN
    d.rectangle([bx0, by0, bx1, by1], outline=INK, width=1)

    # ── Inner content bounds ───────────────────────────────────────────────
    cx = bx0 + PAD
    cy = by0 + PAD

    # ── Header row ─────────────────────────────────────────────────────────
    d.text((cx, cy), header_left,  font=f_header, fill=GRAY)
    rw = d.textlength(header_right, font=f_header)
    d.text((bx1 - PAD - rw, cy),  header_right, font=f_header, fill=GRAY)

    # thin rule below header
    hr_y = cy + 26
    d.line([(bx0 + PAD, hr_y), (bx1 - PAD, hr_y)], fill=(212, 209, 200), width=1)

    # ── Footer rule & row (fixed at bottom) ────────────────────────────────
    fr_y = by1 - PAD - 28
    d.line([(bx0 + PAD, fr_y), (bx1 - PAD, fr_y)], fill=(212, 209, 200), width=1)
    fy = fr_y + 8
    d.text((cx, fy),              footer_left,  font=f_footer, fill=GRAY)
    rfw = d.textlength(footer_right, font=f_footer)
    d.text((bx1 - PAD - rfw, fy), footer_right, font=f_footer, fill=ACCENT)

    # ── Vertically centre the title block + subtitle between header and footer ──
    # Available vertical zone: from hr_y+12 to fr_y-12
    zone_top = hr_y + 12
    zone_bot = fr_y - 12
    zone_h   = zone_bot - zone_top

    total_title_h = len(title_lines) * line_h
    sub_gap       = 18
    sub_h         = 34   # approx height of subtitle line
    block_h       = total_title_h + sub_gap + sub_h

    block_top = zone_top + (zone_h - block_h) // 2

    # ── Red dot ────────────────────────────────────────────────────────────
    dot_r  = 36
    dot_cx = cx + dot_r
    dot_cy = block_top + dot_r + 4   # aligned with first title line top

    d.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=ACCENT,
    )

    # ── Title ──────────────────────────────────────────────────────────────
    title_x = dot_cx + dot_r + 20
    for i, line in enumerate(title_lines):
        d.text((title_x, block_top + i * line_h), line, font=f_title, fill=INK)

    # ── Subtitle ───────────────────────────────────────────────────────────
    sub_y = block_top + total_title_h + sub_gap
    d.text((cx, sub_y), subtitle, font=f_sub, fill=INK_SOFT)

    img.save(out_path, "PNG")
    print(f"Saved {out_path}")


# ─── Card 1: Homepage ────────────────────────────────────────────────────────
draw_card(
    title_lines  = ["Project", "Firefly"],
    subtitle     = "Open Source Small Nuclear \u2014 perpetual energy for all",
    header_left  = "OPEN SOURCE NUCLEAR INITIATIVE",
    header_right = "EST. 2025",
    footer_left  = "2026 FOUNDING SERIES \u2014 DESIGN SELECTION IN PROGRESS",
    footer_right = "MIT LICENSED",
    out_path     = "og-image.png",
)

# ─── Card 2: Reading Circle ──────────────────────────────────────────────────
draw_card(
    title_lines  = ["Firefly", "Reading", "Circle"],
    subtitle     = "Monthly technical reading circle \u00b7 Bengaluru \u00b7 2026 Founding Series",
    header_left  = "PROJECT FIREFLY",
    header_right = "EST. 2025",
    footer_left  = "MONTHLY / 2 HOURS \u00b7 BENGALURU, INDIA",
    footer_right = "OPEN REGISTRATION",
    out_path     = "circle/og-image-circle.png",
    title_size   = 72,
)

print("Done.")
