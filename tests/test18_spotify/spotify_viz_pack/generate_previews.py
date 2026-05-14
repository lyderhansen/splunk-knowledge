#!/usr/bin/env python3
"""
Generate preview.png files for all 8 Spotify viz pack visualizations
plus the appIcon.png. Uses Pillow (PIL).
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Brand palette
# ---------------------------------------------------------------------------
BG        = (30,  30,  30)        # #1E1E1E
CARD_BG   = (40,  40,  40)        # panel cards
GREEN     = (29, 185, 84)         # #1DB954 Spotify green
BLACK     = (25,  20,  20)        # #191414
DARK_GREY = (40,  40,  40)        # #282828
LIGHT_GREY= (179, 179, 179)       # #B3B3B3
MID_GREY  = (100, 100, 100)
PURPLE    = (139,  92, 246)       # #8B5CF6
PINK      = (233,  30, 138)       # #E91E8A
WHITE     = (255, 255, 255)

W, H = 300, 200   # preview size

BASE = "/Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge/test18_spotify/spotify_viz_pack"
VIZ_BASE = os.path.join(BASE, "appserver", "static", "visualizations")
IMG_BASE  = os.path.join(BASE, "appserver", "static", "images")

os.makedirs(IMG_BASE, exist_ok=True)

# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------
SF  = "/System/Library/Fonts/SFNS.ttf"
SFMONO = "/System/Library/Fonts/SFNSMono.ttf"

def font(size, mono=False):
    path = SFMONO if mono else SF
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------
def new_canvas(w=W, h=H, bg=BG):
    img = Image.new("RGBA", (w, h), bg + (255,))
    d   = ImageDraw.Draw(img)
    return img, d

def rounded_rect(d, x0, y0, x1, y1, r, fill, outline=None, outline_width=1):
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill,
                        outline=outline, width=outline_width)

def pill(d, x, y, w, h, fill):
    r = h // 2
    rounded_rect(d, x, y, x + w, y + h, r, fill)

def sparkline(d, x, y, w, h, values, color, line_w=2):
    """Draw a simple sparkline polyline."""
    if len(values) < 2:
        return
    mn, mx = min(values), max(values)
    rng = mx - mn if mx != mn else 1
    pts = []
    for i, v in enumerate(values):
        px = x + i * w // (len(values) - 1)
        py = y + h - int((v - mn) / rng * h)
        pts.append((px, py))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=color, width=line_w)

def text_center(d, text, cx, cy, fnt, fill=WHITE):
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.text((cx - tw // 2, cy - th // 2), text, font=fnt, fill=fill)

def alpha_color(color, alpha_frac):
    """Return color with alpha channel."""
    return color + (int(255 * alpha_frac),)

# ---------------------------------------------------------------------------
# 1. stream_kpi  — Hero KPI: big number, trend delta, sparkline
# ---------------------------------------------------------------------------
def draw_stream_kpi():
    img, d = new_canvas()

    # subtle card background
    rounded_rect(d, 12, 12, W - 12, H - 12, 10, DARK_GREY)

    # label
    d.text((24, 24), "STREAMS TODAY", font=font(10), fill=LIGHT_GREY)

    # big number
    d.text((24, 42), "2.4M", font=font(48), fill=WHITE)

    # delta badge
    rounded_rect(d, 24, 100, 90, 118, 6, (29, 185, 84, 60))
    d.text((30, 101), "▲ +12.3%", font=font(11), fill=GREEN)

    # secondary metric
    d.text((24, 128), "vs yesterday  1.97M", font=font(10), fill=MID_GREY)

    # sparkline area
    spark_vals = [40, 55, 48, 70, 65, 88, 76, 95, 82, 110, 102, 120]
    sparkline(d, 24, 148, 252, 36, spark_vals, GREEN, line_w=2)

    # dot at last point
    lx = 24 + 252
    ly = 148 + 36 - int((spark_vals[-1] - min(spark_vals)) /
                         (max(spark_vals) - min(spark_vals)) * 36)
    d.ellipse([lx - 4, ly - 4, lx + 4, ly + 4], fill=GREEN)

    img.save(os.path.join(VIZ_BASE, "stream_kpi", "preview.png"))
    print("  stream_kpi done")

# ---------------------------------------------------------------------------
# 2. listening_heatmap  — 24h×7d activity grid
# ---------------------------------------------------------------------------
def draw_listening_heatmap():
    img, d = new_canvas()

    days  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    hours = list(range(0, 24, 2))   # every 2h labels

    cell_w = 11
    cell_h = 22
    pad_l  = 30
    pad_t  = 30

    d.text((W // 2 - 50, 8), "Listening Heatmap", font=font(11), fill=LIGHT_GREY)

    # day labels (rows)
    for r, day in enumerate(days):
        y = pad_t + r * cell_h + cell_h // 2 - 5
        d.text((2, y), day[:2], font=font(9), fill=MID_GREY)

    # draw 7×12 grid  (rows=days, cols=12 two-hour buckets)
    import random
    random.seed(42)
    for r in range(7):
        for c in range(12):
            # more activity in evening / weekends
            weight = random.random()
            if c >= 8:  weight += 0.4
            if r >= 5:  weight += 0.3
            weight = min(weight, 1.0)

            # interpolate BG → GREEN
            gr = int(BG[0] + (GREEN[0] - BG[0]) * weight)
            gg = int(BG[1] + (GREEN[1] - BG[1]) * weight)
            gb = int(BG[2] + (GREEN[2] - BG[2]) * weight)

            x0 = pad_l + c * (cell_w + 1)
            y0 = pad_t + r * (cell_h - 2)
            rounded_rect(d, x0, y0, x0 + cell_w - 1, y0 + cell_h - 4,
                         2, (gr, gg, gb))

    # hour labels along bottom
    for i, h in enumerate(hours):
        x = pad_l + i * (cell_w + 1)
        d.text((x, pad_t + 7 * (cell_h - 2) + 4),
               f"{h:02d}", font=font(7), fill=MID_GREY)

    img.save(os.path.join(VIZ_BASE, "listening_heatmap", "preview.png"))
    print("  listening_heatmap done")

# ---------------------------------------------------------------------------
# 3. genre_bars  — Horizontal pill bars
# ---------------------------------------------------------------------------
def draw_genre_bars():
    img, d = new_canvas()

    d.text((W // 2 - 42, 10), "Genre Distribution", font=font(11), fill=LIGHT_GREY)

    genres = [
        ("Pop",         0.82, GREEN),
        ("Hip-Hop",     0.67, PURPLE),
        ("Electronic",  0.55, PINK),
        ("R&B",         0.43, (29, 185, 84)),
        ("Rock",        0.31, (100, 200, 150)),
        ("Latin",       0.24, (233, 150, 50)),
    ]

    bar_h   = 20
    max_bar = 195
    start_y = 32

    for i, (label, pct, color) in enumerate(genres):
        y = start_y + i * (bar_h + 6)
        # label
        d.text((8, y + 3), label, font=font(10), fill=LIGHT_GREY)
        # track (background)
        pill(d, 80, y, max_bar, bar_h, DARK_GREY)
        # fill
        bar_w = int(max_bar * pct)
        if bar_w > bar_h:
            pill(d, 80, y, bar_w, bar_h, color)
        # pct label
        d.text((80 + bar_w + 4, y + 3),
               f"{int(pct * 100)}%", font=font(10), fill=LIGHT_GREY)

    img.save(os.path.join(VIZ_BASE, "genre_bars", "preview.png"))
    print("  genre_bars done")

# ---------------------------------------------------------------------------
# 4. track_ranking  — Leaderboard bars with rank numbers
# ---------------------------------------------------------------------------
def draw_track_ranking():
    img, d = new_canvas()

    d.text((W // 2 - 38, 10), "Top Tracks", font=font(11), fill=LIGHT_GREY)

    tracks = [
        (1, "Blinding Lights",   0.94),
        (2, "As It Was",         0.88),
        (3, "Stay",              0.74),
        (4, "Heat Waves",        0.61),
        (5, "Levitating",        0.53),
        (6, "Watermelon Sugar",  0.42),
    ]

    row_h   = 26
    bar_max = 150
    start_y = 30

    for rank, title, pct in tracks:
        y = start_y + (rank - 1) * row_h

        # rank badge
        badge_color = GREEN if rank == 1 else (PURPLE if rank == 2 else DARK_GREY)
        rounded_rect(d, 8, y + 2, 26, y + 20, 4, badge_color)
        text_center(d, str(rank), 17, y + 11, font(10))

        # title (truncated)
        t = title[:15] + ("…" if len(title) > 15 else "")
        d.text((32, y + 4), t, font=font(10), fill=WHITE)

        # bar
        bar_w = int(bar_max * pct)
        rounded_rect(d, 30, y + 17, 30 + bar_max, y + 23, 2, DARK_GREY)
        rounded_rect(d, 30, y + 17, 30 + bar_w, y + 23, 2, GREEN)

        # streams label
        streams = f"{int(pct * 9.4 * 100) / 10}M"
        d.text((W - 42, y + 4), streams, font=font(9), fill=LIGHT_GREY)

    img.save(os.path.join(VIZ_BASE, "track_ranking", "preview.png"))
    print("  track_ranking done")

# ---------------------------------------------------------------------------
# 5. artist_cards  — Grid of artist growth cards
# ---------------------------------------------------------------------------
def draw_artist_cards():
    img, d = new_canvas()

    d.text((W // 2 - 38, 8), "Artist Growth", font=font(11), fill=LIGHT_GREY)

    artists = [
        ("The Weeknd",  "+24%",  GREEN,  [30,45,40,55,60,70,65,80]),
        ("Dua Lipa",    "+18%",  PURPLE, [50,48,55,52,60,65,70,75]),
        ("Bad Bunny",   "+31%",  PINK,   [20,35,30,50,45,65,60,85]),
        ("Taylor Swift","+15%",  GREEN,  [60,65,62,70,68,72,75,78]),
    ]

    card_w = 130
    card_h = 70
    gap    = 10
    cols   = 2
    start_x= 10
    start_y= 26

    for i, (name, delta, color, spark) in enumerate(artists):
        col = i % cols
        row = i // cols
        x = start_x + col * (card_w + gap)
        y = start_y + row * (card_h + gap)

        # card bg
        rounded_rect(d, x, y, x + card_w, y + card_h, 8, DARK_GREY)

        # artist name
        short = name.split()[0]
        d.text((x + 8, y + 8), short, font=font(12), fill=WHITE)

        # delta
        d.text((x + 8, y + 26), delta, font=font(11), fill=color)

        # mini sparkline
        sparkline(d, x + 8, y + 42, card_w - 20, 20, spark, color, line_w=2)

    img.save(os.path.join(VIZ_BASE, "artist_cards", "preview.png"))
    print("  artist_cards done")

# ---------------------------------------------------------------------------
# 6. playlist_table  — Sortable table with inline skip-rate bars
# ---------------------------------------------------------------------------
def draw_playlist_table():
    img, d = new_canvas()

    # header row
    rounded_rect(d, 0, 0, W, H, 0, BG)
    rounded_rect(d, 0, 0, W, 24, 0, DARK_GREY)

    headers = ["#", "Track", "Plays", "Skip %"]
    col_x   = [6, 26, 175, 228]
    for hdr, cx in zip(headers, col_x):
        d.text((cx, 6), hdr, font=font(10), fill=LIGHT_GREY)

    # sort indicator on Plays
    d.text((205, 6), "▼", font=font(9), fill=GREEN)

    rows = [
        (1, "Blinding Lights",  "4.2M", 0.08),
        (2, "As It Was",        "3.8M", 0.12),
        (3, "Stay",             "3.1M", 0.21),
        (4, "Heat Waves",       "2.9M", 0.19),
        (5, "Levitating",       "2.5M", 0.31),
        (6, "Watermelon Sugar", "2.1M", 0.15),
    ]

    row_h = 26
    for i, (rank, title, plays, skip) in enumerate(rows):
        y = 26 + i * row_h
        # alternating row bg
        if i % 2 == 0:
            d.rectangle([0, y, W, y + row_h], fill=(35, 35, 35))

        d.text((col_x[0], y + 6), str(rank), font=font(10), fill=MID_GREY)
        t = title[:16] + ("…" if len(title) > 16 else "")
        d.text((col_x[1], y + 6), t, font=font(10), fill=WHITE)
        d.text((col_x[2], y + 6), plays, font=font(10), fill=GREEN)

        # inline skip-rate bar
        bar_w_max = 58
        bar_w = int(bar_w_max * skip)
        rounded_rect(d, col_x[3], y + 8, col_x[3] + bar_w_max, y + 18, 3, (60, 60, 60))
        bar_color = PINK if skip > 0.25 else (233, 150, 50) if skip > 0.15 else GREEN
        rounded_rect(d, col_x[3], y + 8, col_x[3] + bar_w, y + 18, 3, bar_color)

    img.save(os.path.join(VIZ_BASE, "playlist_table", "preview.png"))
    print("  playlist_table done")

# ---------------------------------------------------------------------------
# 7. audio_wave  — Animated equalizer bars
# ---------------------------------------------------------------------------
def draw_audio_wave():
    img, d = new_canvas()

    d.text((W // 2 - 38, 10), "Audio Wave", font=font(11), fill=LIGHT_GREY)

    n_bars  = 28
    bar_w   = 7
    gap     = 3
    total_w = n_bars * (bar_w + gap) - gap
    start_x = (W - total_w) // 2
    floor_y = H - 28
    max_h   = 110

    # heights simulate a music equalizer wave (sine-based)
    import math as _math
    for i in range(n_bars):
        phase = i / n_bars * 2 * _math.pi
        h_bar = int(max_h * (0.3 + 0.7 * abs(_math.sin(phase + 0.5))
                             * abs(_math.sin(phase * 2.3 + 1.2))))
        h_bar = max(h_bar, 8)
        x = start_x + i * (bar_w + gap)

        # gradient: green at top, darker at base
        for py in range(h_bar):
            frac = py / h_bar
            r = int(GREEN[0] * (1 - frac * 0.5))
            g = int(GREEN[1] * (1 - frac * 0.6))
            b = int(GREEN[2] * (1 - frac * 0.3))
            d.rectangle([x, floor_y - h_bar + py,
                         x + bar_w - 1, floor_y - h_bar + py], fill=(r, g, b))

        # round top cap
        rounded_rect(d, x, floor_y - h_bar,
                     x + bar_w - 1, floor_y - h_bar + 6, 3, GREEN)

    # Spotify-style play dot
    d.ellipse([W // 2 - 5, floor_y + 6, W // 2 + 5, floor_y + 16], fill=GREEN)
    d.text((W // 2 - 22, floor_y + 6), "◀◀", font=font(8), fill=LIGHT_GREY)
    d.text((W // 2 + 10, floor_y + 6), "▶▶", font=font(8), fill=LIGHT_GREY)

    img.save(os.path.join(VIZ_BASE, "audio_wave", "preview.png"))
    print("  audio_wave done")

# ---------------------------------------------------------------------------
# 8. trend_spark  — Stacked sparkline strips
# ---------------------------------------------------------------------------
def draw_trend_spark():
    img, d = new_canvas()

    d.text((W // 2 - 44, 8), "Trending Tracks", font=font(11), fill=LIGHT_GREY)

    tracks = [
        ("Blinding Lights",  [30,45,40,58,52,70,65,82,90,88,95,100], GREEN),
        ("As It Was",        [20,22,28,25,35,40,38,50,55,60,58,65],  PURPLE),
        ("Stay",             [50,48,42,55,52,60,65,58,70,68,75,72],  PINK),
        ("Heat Waves",       [10,15,20,18,25,30,28,38,35,45,50,55],  (100,200,150)),
        ("Levitating",       [40,38,45,43,50,48,55,52,58,60,65,62],  (233,150,50)),
    ]

    strip_h = 28
    pad_l   = 88
    pad_t   = 26
    spark_w = W - pad_l - 12

    for i, (name, vals, color) in enumerate(tracks):
        y = pad_t + i * (strip_h + 4)

        # strip bg
        rounded_rect(d, 6, y, W - 6, y + strip_h, 4, DARK_GREY)

        # track name
        short = name[:12]
        d.text((12, y + 8), short, font=font(10), fill=WHITE)

        # change label
        delta = int((vals[-1] - vals[0]) / max(vals[0], 1) * 100)
        dcolor = GREEN if delta >= 0 else PINK
        d.text((pad_l - 32, y + 8),
               f"{'+'if delta>=0 else ''}{delta}%", font=font(9), fill=dcolor)

        # sparkline
        sparkline(d, pad_l, y + 4, spark_w, strip_h - 8, vals, color, line_w=2)

        # end dot
        mx = max(vals)
        mn = min(vals)
        rng = mx - mn if mx != mn else 1
        last_y = y + 4 + (strip_h - 8) - int((vals[-1] - mn) / rng * (strip_h - 8))
        d.ellipse([pad_l + spark_w - 4, last_y - 3,
                   pad_l + spark_w + 4, last_y + 3], fill=color)

    img.save(os.path.join(VIZ_BASE, "trend_spark", "preview.png"))
    print("  trend_spark done")

# ---------------------------------------------------------------------------
# 9. appIcon.png  — 72×72 Spotify-style icon
# ---------------------------------------------------------------------------
def draw_app_icon():
    SIZE = 72
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)

    # green circle background
    d.ellipse([0, 0, SIZE - 1, SIZE - 1], fill=GREEN)

    # three equalizer bars (Spotify audio logo style)
    bar_w = 10
    gap   = 5
    total = 3 * bar_w + 2 * gap
    sx    = (SIZE - total) // 2
    heights = [20, 34, 24]
    base_y  = SIZE - 18

    for i, bh in enumerate(heights):
        x = sx + i * (bar_w + gap)
        rounded_rect(d, x, base_y - bh, x + bar_w, base_y, 4, BLACK)

    img.save(os.path.join(IMG_BASE, "appIcon.png"))
    print("  appIcon done")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Generating Spotify viz pack previews...")
    draw_stream_kpi()
    draw_listening_heatmap()
    draw_genre_bars()
    draw_track_ranking()
    draw_artist_cards()
    draw_playlist_table()
    draw_audio_wave()
    draw_trend_spark()
    draw_app_icon()
    print("All done.")
