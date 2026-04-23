"""Design tokens for Aurora — ground-truth constants.

Every hex value is verified against Splunk's official design language:
splunkui.splunk.com/Packages/visualizations/VisualizationsGallery and
docs.splunk.com Dashboard Studio reference.

Spacing and type scale follow Splunk UI's @splunk/themes conventions
(see splunkui.splunk.com/Packages/themes/Variables).
"""
from __future__ import annotations


# ----- Spacing scale (px) -----
S_0_5 = 4
S_1 = 8
S_1_5 = 12
S_2 = 16
S_2_5 = 20  # canonical gutter / panel margin
S_3 = 24
S_4 = 32
S_6 = 48
S_8 = 64


# ----- Border radius (px) -----
R_SHARP = 0
R_SUBTLE = 4
R_CARD = 8
R_HERO = 12
R_PILL = 999


# ----- Typography scale (px) -----
FS_TICK = 11
FS_AXIS = 12
FS_BODY = 14
FS_LARGE = 18
FS_XLARGE = 24
FS_KPI_MINOR = 28
FS_KPI_MAJOR = 48
FS_KPI_HERO = 72


# ----- Semantic status colors (dark theme default) -----
STATUS_CRITICAL = "#DC4E41"
STATUS_HIGH = "#F1813F"
STATUS_WARNING = "#F8BE34"
STATUS_OK = "#53A051"
STATUS_INFO = "#006D9C"
STATUS_UNKNOWN = "#B0B0BE"


# ----- Light-theme semantic overrides (for exec theme) -----
STATUS_CRITICAL_LIGHT = "#C0392B"
STATUS_HIGH_LIGHT = "#C05C00"
STATUS_WARNING_LIGHT = "#D4820A"
STATUS_OK_LIGHT = "#2B9E44"
STATUS_INFO_LIGHT = "#2066C0"


# ----- Canvas tokens -----
CANVAS_DARK = "#0b0c0e"          # Prisma Dark
CANVAS_DARK_PURE = "#000000"     # NOC pure black
CANVAS_LIGHT = "#FAFAF7"         # warm off-white for exec
PANEL_DARK = "#15161a"
PANEL_DARK_NOC = "#0F1117"
PANEL_LIGHT = "#ffffff"
PANEL_STROKE_DARK = "#2C2C3A"
PANEL_STROKE_LIGHT = "#E5E5E0"

# ----- Text tokens -----
TEXT_PRIMARY_DARK = "#FFFFFF"
TEXT_SECONDARY_DARK = "#B0B0BE"
TEXT_PRIMARY_LIGHT = "#1A1A1A"
TEXT_SECONDARY_LIGHT = "#6B7C85"


# ----- Series palettes -----
# Splunk CustomVizDesign official 10-color categorical palette.
SERIES_CATEGORICAL_10 = [
    "#006D9C", "#4FA484", "#EC9960", "#AF575A", "#B6C75A",
    "#62B3B2", "#294E70", "#738795", "#EDD051", "#BD9872",
]

# Light-theme override of categorical-10 (higher contrast on white).
SERIES_CATEGORICAL_10_LIGHT = [
    "#2066C0", "#2B9E44", "#C05C00", "#C0392B", "#7A873D",
    "#3D8B8B", "#294E70", "#4A5A64", "#B39A1F", "#8A6B4A",
]

# Splunk Dashboard Studio default 20-color seriesColors (dark theme).
SERIES_STUDIO_20 = [
    "#7B56DB", "#009CEB", "#00CDAF", "#DD9900", "#FF677B",
    "#CB2196", "#813193", "#0051B5", "#008C80", "#99B100",
    "#FFA476", "#FF6ACE", "#AE8CFF", "#00689D", "#00490A",
    "#465D00", "#9D6300", "#F6540B", "#FF969E", "#E47BFE",
]

# SOC semantic-ordered 8-color palette (red/amber/green priority + accents).
SERIES_SOC_8 = [
    "#DC4E41", "#F1813F", "#F8BE34", "#53A051",
    "#006D9C", "#1FBAD6", "#826AF9", "#9B59B6",
]


# ----- Chart chrome -----
GRIDLINE_DARK = "#23262b"
GRIDLINE_LIGHT = "#ebedef"
AXISLINE_DARK = "#2c3036"
AXISLINE_LIGHT = "#d9dce0"
