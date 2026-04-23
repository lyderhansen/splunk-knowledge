"""Tests for design tokens module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards import tokens


def test_spacing_scale_matches_splunk_ui():
    # Splunk CustomVizDesign documents 5/10/15/20 as canonical distances; we extend.
    assert tokens.S_0_5 == 4
    assert tokens.S_1 == 8
    assert tokens.S_1_5 == 12
    assert tokens.S_2 == 16
    assert tokens.S_2_5 == 20
    assert tokens.S_3 == 24
    assert tokens.S_4 == 32
    assert tokens.S_6 == 48
    assert tokens.S_8 == 64


def test_radii_scale():
    assert tokens.R_SHARP == 0
    assert tokens.R_SUBTLE == 4
    assert tokens.R_CARD == 8
    assert tokens.R_HERO == 12
    assert tokens.R_PILL == 999


def test_type_scale_font_sizes():
    assert tokens.FS_TICK == 11
    assert tokens.FS_AXIS == 12
    assert tokens.FS_BODY == 14
    assert tokens.FS_LARGE == 18
    assert tokens.FS_XLARGE == 24
    assert tokens.FS_KPI_MINOR == 28
    assert tokens.FS_KPI_MAJOR == 48
    assert tokens.FS_KPI_HERO == 72


def test_splunk_categorical_10_palette_matches_official():
    # From https://splunkui.splunk.com CustomVizDesign official categorical palette.
    expected = [
        "#006D9C", "#4FA484", "#EC9960", "#AF575A", "#B6C75A",
        "#62B3B2", "#294E70", "#738795", "#EDD051", "#BD9872",
    ]
    assert tokens.SERIES_CATEGORICAL_10 == expected
    assert len(tokens.SERIES_CATEGORICAL_10) == 10


def test_soc_semantic_palette_red_first():
    # SOC priority order: critical/high/warn/ok/info/accent
    assert tokens.SERIES_SOC_8[0] == "#DC4E41"  # critical first
    assert tokens.SERIES_SOC_8[3] == "#53A051"  # ok
    assert len(tokens.SERIES_SOC_8) == 8


def test_ds_default_20_palette_length():
    # Splunk Dashboard Studio default seriesColors — full 20.
    assert len(tokens.SERIES_STUDIO_20) == 20
    assert tokens.SERIES_STUDIO_20[0] == "#7B56DB"  # DS default first color


def test_status_hex_values():
    assert tokens.STATUS_CRITICAL == "#DC4E41"
    assert tokens.STATUS_HIGH == "#F1813F"
    assert tokens.STATUS_WARNING == "#F8BE34"
    assert tokens.STATUS_OK == "#53A051"
    assert tokens.STATUS_INFO == "#006D9C"
    assert tokens.STATUS_UNKNOWN == "#B0B0BE"


def test_light_status_overrides():
    # Light-theme semantic overrides (for `exec` theme).
    assert tokens.STATUS_CRITICAL_LIGHT == "#C0392B"
    assert tokens.STATUS_OK_LIGHT == "#2B9E44"
    assert tokens.STATUS_INFO_LIGHT == "#2066C0"
