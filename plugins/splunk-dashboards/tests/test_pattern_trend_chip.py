"""Tests for trend-chip pattern — adds colored delta chip to time-series singlevalues."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(
    spl="index=main | timechart count",
    title="Events",
    viz_type="splunk.singlevalue",
    major_value="> primary | seriesByName('count') | lastPoint()",
):
    viz = {
        "type": viz_type,
        "title": title,
        "dataSources": {"primary": "ds_1"},
        "options": {},
    }
    if major_value is not None:
        viz["options"]["majorValue"] = major_value
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": spl}},
        },
        "visualizations": {"viz_p1": viz},
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_trend_chip_adds_delta_binding_to_timeseries_singlevalue():
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    # trendValue uses the same series name as majorValue, with delta(-2)
    assert opts["trendValue"] == "> primary | seriesByName('count') | delta(-2)"
    assert opts["trendDisplay"] == "percent"
    # trendColor references the context config
    assert opts["trendColor"] == "> trendValue | rangeValue(trendColorConfig)"


def test_trend_chip_default_polarity_up_is_good():
    """For untagged metrics, positive delta is green, negative is red."""
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    ctx = d["visualizations"]["viz_p1"]["context"]
    cfg = ctx["trendColorConfig"]
    # two ranges: negative (red) and positive (green)
    reds = [r for r in cfg if r["value"] == "#DC4E41"]
    greens = [r for r in cfg if r["value"] == "#53A051"]
    assert len(reds) == 1 and "to" in reds[0] and reds[0]["to"] == 0
    assert len(greens) == 1 and "from" in greens[0] and greens[0]["from"] == 0


def test_trend_chip_flips_polarity_for_failure_metric():
    """For failure/critical/latency metrics, positive delta is bad (red)."""
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard(
        spl="index=main error=true | timechart count",
        title="Failed Logins",
    )
    apply(d, get_theme("pro"), T)
    cfg = d["visualizations"]["viz_p1"]["context"]["trendColorConfig"]
    reds = [r for r in cfg if r["value"] == "#DC4E41"]
    greens = [r for r in cfg if r["value"] == "#53A051"]
    # Positive delta (from: 0) should be red for failure metrics
    assert any("from" in r and r["from"] == 0 for r in reds)
    assert any("to" in r and r["to"] == 0 for r in greens)


def test_trend_chip_also_handles_singlevalueicon():
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard(viz_type="splunk.singlevalueicon")
    apply(d, get_theme("noc"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "trendValue" in opts
    assert "trendColor" in opts


def test_trend_chip_skips_non_timeseries_singlevalue():
    """Static singlevalues (| makeresults | eval x=42) don't have history to delta."""
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard(spl="| makeresults | eval count=42 | table count")
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "trendValue" not in opts
    assert "trendColor" not in opts


def test_trend_chip_fires_on_synthetic_timeseries_with_eval_time():
    """Patterns like `makeresults + streamstats + eval _time=_time - ...` are
    genuine time series even though they don't use | timechart."""
    from splunk_dashboards.patterns.trend_chip import apply
    spl = (
        "| makeresults count=7 | streamstats count as d "
        "| eval _time=_time - ((7-d) * 86400), count=40000 + (d * 250) "
        "| sort _time | table _time count"
    )
    d = _dashboard(spl=spl)
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert opts["trendValue"] == "> primary | seriesByName('count') | delta(-2)"


def test_trend_chip_does_not_overwrite_existing_trendValue():
    """If the author explicitly set trendValue, respect it."""
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard()
    d["visualizations"]["viz_p1"]["options"]["trendValue"] = "> custom_binding"
    apply(d, get_theme("pro"), T)
    assert d["visualizations"]["viz_p1"]["options"]["trendValue"] == "> custom_binding"


def test_trend_chip_skips_if_no_majorValue_binding():
    """Without majorValue we can't determine the series name — no-op."""
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard(major_value=None)
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "trendValue" not in opts


def test_trend_chip_no_op_on_non_singlevalue():
    from splunk_dashboards.patterns.trend_chip import apply
    d = _dashboard(viz_type="splunk.line")
    apply(d, get_theme("pro"), T)
    assert "trendValue" not in d["visualizations"]["viz_p1"]["options"]


def test_trend_chip_registered():
    """Pattern must be importable via the registry so aurora.apply can find it."""
    from splunk_dashboards.patterns import get_pattern
    p = get_pattern("trend-chip")
    assert p.name == "trend-chip"
    assert callable(p.apply)
