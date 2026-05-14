#!/usr/bin/env python3
"""Generate real PNG preview images for each viz (200x100)."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 200, 100
BG = (18, 18, 18)
PAPAYA = (255, 128, 0)
BLUE = (71, 199, 252)
PURPLE = (168, 85, 247)
RED = (255, 51, 51)
YELLOW = (255, 215, 0)
WHITE = (232, 232, 232)
DIM = (100, 100, 100)
CARD = (30, 30, 30)

BASE = os.path.join(os.path.dirname(__file__), "appserver", "static", "visualizations")

def get_font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/SFMono-Regular.otf", size)
    except (OSError, IOError):
        try:
            return ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", size)
        except (OSError, IOError):
            return ImageFont.load_default()

def kpi_tile():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 3, H], fill=PAPAYA)
    f_big = get_font(32)
    f_sm = get_font(9)
    d.text((16, 22), "P1", fill=WHITE, font=f_big)
    d.text((16, 62), "POSITION", fill=DIM, font=f_sm)
    d.text((16, 78), "+0.2", fill=(0, 210, 106), font=f_sm)
    return img

def timing_tower():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = get_font(9)
    drivers = [("P1", "NOR", "+0.0", YELLOW), ("P2", "VER", "+0.2", WHITE),
               ("P3", "PIA", "+0.4", YELLOW), ("P4", "LEC", "+0.8", WHITE),
               ("P5", "SAI", "+1.0", WHITE)]
    for i, (pos, name, gap, comp) in enumerate(drivers):
        y = 8 + i * 18
        row_bg = CARD if i % 2 == 0 else BG
        d.rectangle([4, y, W - 4, y + 16], fill=row_bg)
        if i == 0:
            d.rectangle([4, y, 7, y + 16], fill=PAPAYA)
        c = PAPAYA if i < 3 else DIM
        d.text((12, y + 3), pos, fill=c, font=f)
        d.text((42, y + 3), name, fill=WHITE, font=f)
        d.ellipse([120, y + 5, 128, y + 13], fill=comp)
        d.text((140, y + 3), gap, fill=DIM, font=f)
    return img

def sector_bars():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = get_font(8)
    names = ["NOR", "VER", "PIA", "LEC"]
    widths = [(48, 40, 46), (50, 41, 47), (49, 42, 47), (52, 43, 48)]
    colors = [PAPAYA, BLUE, PURPLE]
    for i, (name, ws) in enumerate(zip(names, widths)):
        y = 10 + i * 22
        d.text((4, y + 3), name, fill=DIM, font=f)
        x = 36
        for j, (ww, col) in enumerate(zip(ws, colors)):
            sw = int(ww * 0.72)
            d.rectangle([x, y, x + sw, y + 16], fill=col + (200,))
            x += sw + 2
    return img

def stint_chart():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = get_font(8)
    d.line([(36, 6), (190, 6)], fill=DIM, width=1)
    for lx in range(36, 191, 30):
        d.line([(lx, 4), (lx, 8)], fill=DIM, width=1)
    stints = [
        ("NOR", [(0, 24, RED), (25, 62, YELLOW), (63, 100, WHITE)]),
        ("VER", [(0, 38, YELLOW), (39, 100, WHITE)]),
        ("PIA", [(0, 20, RED), (22, 58, YELLOW), (59, 100, WHITE)]),
        ("HAM", [(0, 17, RED), (18, 52, YELLOW), (53, 100, YELLOW)]),
    ]
    for i, (name, segs) in enumerate(stints):
        y = 16 + i * 20
        d.text((4, y + 2), name, fill=DIM, font=f)
        for s, e, col in segs:
            x1 = 36 + int(s * 1.54)
            x2 = 36 + int(e * 1.54)
            d.rectangle([x1, y, x2, y + 14], fill=col + (220,))
    return img

def pit_gauge():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = get_font(8)
    stops = [("NOR", 2.4, 0), ("VER", 2.8, 0), ("STR", 4.1, 3)]
    max_t = 5.0
    for i, (name, t, lost) in enumerate(stops):
        y = 10 + i * 30
        d.text((4, y), name, fill=DIM, font=f)
        track_x, track_w = 36, 140
        d.rectangle([track_x, y + 12, track_x + track_w, y + 22], fill=(30, 30, 30))
        tz1 = int(2.0 / max_t * track_w)
        tz2 = int(2.8 / max_t * track_w)
        d.rectangle([track_x + tz1, y + 12, track_x + tz2, y + 22], fill=(0, 80, 40))
        fill_w = int(t / max_t * track_w)
        col = PAPAYA if t <= 2.8 else RED
        d.rectangle([track_x, y + 12, track_x + fill_w, y + 22], fill=col)
        d.text((track_x + fill_w + 4, y + 12), f"{t:.1f}s", fill=WHITE, font=f)
        if lost > 0:
            d.text((182, y + 12), f"-{lost}", fill=RED, font=f)
    return img

def radio_feed():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f = get_font(8)
    msgs = [
        (RED, "NOR", "Box box box"),
        (PAPAYA, "VER", "Losing rear grip"),
        (BLUE, "PIA", "DRS enabled"),
        (RED, "SAI", "Plan B this lap"),
    ]
    for i, (col, drv, msg) in enumerate(msgs):
        y = 6 + i * 23
        d.rectangle([4, y, 7, y + 19], fill=col)
        d.rectangle([8, y, W - 4, y + 19], fill=CARD)
        d.text((12, y + 2), "15:4" + str(i), fill=DIM, font=f)
        d.text((48, y + 2), drv, fill=PAPAYA, font=f)
        d.text((12, y + 11), msg[:22], fill=WHITE, font=f)
    return img

generators = {
    "kpi_tile": kpi_tile,
    "timing_tower": timing_tower,
    "sector_bars": sector_bars,
    "stint_chart": stint_chart,
    "pit_gauge": pit_gauge,
    "radio_feed": radio_feed,
}

for name, gen in generators.items():
    path = os.path.join(BASE, name, "preview.png")
    img = gen()
    img.save(path, "PNG")
    print(f"  PNG {name}/preview.png ({os.path.getsize(path)} bytes)")

print(f"\n{len(generators)} previews generated")
