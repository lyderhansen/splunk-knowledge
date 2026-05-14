#!/usr/bin/env python3
"""Build FAKE T-Shirt Co. — Retail Pulse dashboard JSON.

Per inputs template + project design language. Uses ABSOLUTE layout
(required for cornerRadius depth pattern with shadow rectangles).

Project design language: absolute layout requires layoutDefinitions + tabs
wrapper (cannot use "type": "absolute" directly in top-level layout).
"""

import json

CANVAS_W = 1920
CANVAS_BG = "#0B0C10"

# ============================================================
# Defaults
# ============================================================
DEFAULTS = {
    "dataSources": {
        "ds.search": {
            "options": {
                "queryParameters": {
                    "earliest": "$global_time.earliest$",
                    "latest": "$global_time.latest$",
                }
            }
        }
    },
    "visualizations": {"global": {"showLastUpdated": False}},
}

# ============================================================
# Inputs
# ============================================================
INPUTS = {
    "input_global_trp": {
        "type": "input.timerange",
        "title": "Time Range",
        "options": {
            "token": "global_time",
            "defaultValue": "1767225600,1769904000",
        },
    }
}

# ============================================================
# Data sources (same as before)
# ============================================================
DS = {
    "ds_kpi_revenue": {"type": "ds.search", "name": "ds_kpi_revenue",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | timechart span=1h sum(pricing.total) as revenue'}},
    "ds_kpi_orders": {"type": "ds.search", "name": "ds_kpi_orders",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | timechart span=1h count as orders'}},
    "ds_kpi_pricing_errors": {"type": "ds.search", "name": "ds_kpi_pricing_errors",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" wrong_price=true | timechart span=1h count as wrong_orders sum(revenue_impact) as impact'}},
    "ds_kpi_site_error_rate": {"type": "ds.search", "name": "ds_kpi_site_error_rate",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:access_combined" | eval is_5xx=if(status>=500,1,0) | timechart span=1h sum(is_5xx) as errors count as requests | eval error_rate=round(100*errors/requests,2) | table _time error_rate'}},
    "ds_tile_orders_per_hour": {"type": "ds.search", "name": "ds_tile_orders_per_hour",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | stats count as orders by date_hour | stats avg(orders) as ordersperhour'}},
    "ds_tile_aov": {"type": "ds.search", "name": "ds_tile_aov",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | stats avg(pricing.total) as aov'}},
    "ds_tile_unique_customers": {"type": "ds.search", "name": "ds_tile_unique_customers",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | stats dc(customerId) as unique_customers'}},
    "ds_tile_dlq": {"type": "ds.search", "name": "ds_tile_dlq",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:azure:servicebus" status="DeadLettered" | stats count as dlq_count'}},
    "ds_tile_failed": {"type": "ds.search", "name": "ds_tile_failed",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:azure:servicebus" status="Failed" | stats count as failed_count'}},
    "ds_tile_completed": {"type": "ds.search", "name": "ds_tile_completed",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:azure:servicebus" status="Completed" | stats count as completed_count'}},
    "ds_revenue_trend": {"type": "ds.search", "name": "ds_revenue_trend",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | timechart span=6h sum(pricing.total) as revenue'}},
    "ds_orders_by_category": {"type": "ds.search", "name": "ds_orders_by_category",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | spath items{}.category as category | stats count by category | sort -count'}},
    "ds_orders_by_segment": {"type": "ds.search", "name": "ds_orders_by_segment",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | stats count by segment | sort -count'}},
    "ds_site_error_trend": {"type": "ds.search", "name": "ds_site_error_trend",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:access_combined" | eval is_5xx=if(status>=500,1,0) | timechart span=1h sum(is_5xx) as errors count as requests | eval error_rate=round(100*errors/requests,2) | table _time error_rate'}},
    "ds_top_products": {"type": "ds.search", "name": "ds_top_products",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" | spath items{} output=item | mvexpand item | spath input=item | stats sum(lineTotal) as revenue count as units by name | sort -revenue | head 10 | eval revenue=tostring(round(revenue,0),"commas") | rename name as Product, units as Units, revenue as Revenue'}},
    "ds_recent_pricing_errors": {"type": "ds.search", "name": "ds_recent_pricing_errors",
        "options": {"query": 'index=fake_tshrt sourcetype="FAKE:online:order" wrong_price=true | sort -_time | eval _color_rank=case(priceErrorType=="price_doubled", 1, priceErrorType=="price_halved", 2, true(), 3) | eval Time=strftime(_time, "%b %d %H:%M"), OrigPrice=tostring(originalPrice,"commas"), Charged=tostring(round(\'pricing.total\',2),"commas"), Impact=tostring(round(revenue_impact,2),"commas") | table Time orderId customerId priceErrorType OrigPrice Charged Impact _color_rank | rename orderId as "Order ID", customerId as Customer, priceErrorType as "Error Type", OrigPrice as "Orig Price", Charged as "Charged", Impact as "Impact ($)" | head 20'}},
}


# ============================================================
# Visualization helpers
# ============================================================
def kpi_card(title, ds_id, sparkline_field, color="#00D2FF", under=None,
             unit=None, unit_pos="after", precision=0, threshold=None, font_size=None):
    opts = {
        "majorValue": "> sparklineValues | lastPoint()",
        "trendValue": "> sparklineValues | delta(-2)",
        "sparklineValues": f"> primary | seriesByName('{sparkline_field}')",
        "sparklineDisplay": "below",
        "trendDisplay": "off",
        "majorColor": color if not threshold else "> majorValue | rangeValue(majorColorConfig)",
        "backgroundColor": "transparent",
        "showSparklineAreaGraph": True,
        "sparklineStrokeColor": color,
    }
    if font_size: opts["majorFontSize"] = font_size
    if unit:
        opts["unit"] = unit
        opts["unitPosition"] = unit_pos
    if precision: opts["numberPrecision"] = precision
    if under:
        opts["underLabel"] = under
        opts["underLabelFontSize"] = 13

    viz = {"type": "splunk.singlevalue", "title": title,
           "dataSources": {"primary": ds_id}, "options": opts,
           "cornerRadius": [12, 12, 12, 12]}
    if threshold:
        viz["context"] = {"majorColorConfig": threshold}
    return viz


def tile(title, ds_id, value_field, color="#7B56DB", unit=None, unit_pos="after",
         precision=0, threshold=None, under=None, font_size=32):
    opts = {
        "majorValue": f"> primary | seriesByName('{value_field}') | lastPoint()",
        "majorColor": color if not threshold else "> majorValue | rangeValue(majorColorConfig)",
        "sparklineDisplay": "off",
        "trendDisplay": "off",
        "backgroundColor": "transparent",
        "majorFontSize": font_size,
    }
    if unit:
        opts["unit"] = unit
        opts["unitPosition"] = unit_pos
    if precision: opts["numberPrecision"] = precision
    if under:
        opts["underLabel"] = under
        opts["underLabelFontSize"] = 11

    viz = {"type": "splunk.singlevalue", "title": title,
           "dataSources": {"primary": ds_id}, "options": opts,
           "cornerRadius": [10, 10, 10, 10]}
    if threshold:
        viz["context"] = {"majorColorConfig": threshold}
    return viz


def shadow_rect(corner=14):
    return {
        "type": "splunk.rectangle",
        "options": {
            "fillColor": "#13141A",  # bg-surface from design language
            "fillOpacity": 1,
            "strokeColor": "transparent",
            "rx": corner,
        },
        "cornerRadius": [corner, corner, corner, corner],
    }


def section_header(text, body=None):
    md = f"## {text}"
    if body:
        md += f"\n\n{body}"
    return {"type": "splunk.markdown",
            "options": {"markdown": md, "fontColor": "#F1F5F9",
                        "fontSize": "large", "backgroundColor": "transparent"}}


# ============================================================
# Visualizations
# ============================================================
VIZ = {
    # Brand header
    "viz_brand_wordmark": {
        "type": "splunk.markdown",
        "options": {
            "markdown": "# FAKE T-Shirt Co. — Retail Pulse",
            "fontColor": "#00D2FF",
            "fontSize": "extraLarge",
            "backgroundColor": "transparent",
        },
    },
    "viz_brand_stripe": {
        "type": "splunk.rectangle",
        "options": {"fillColor": "#00D2FF", "fillOpacity": 1, "strokeColor": "transparent", "rx": 0},
    },

    # Section headers
    "viz_section_pulse": section_header(
        "Today's Pulse",
        "Real-time revenue, orders, pricing integrity, and site health."),
    "viz_section_sales": section_header(
        "Sales Activity",
        "Rolling indicators across the active period."),
    "viz_section_integrity": section_header(
        "Pricing Integrity & Site Health",
        "Revenue trend, mix, and site error rate. Pricing errors caught here before customer complaints."),
    "viz_section_products": section_header(
        "Top Products & Recent Pricing Errors",
        "Top-selling SKUs and a watchlist of any wrong-priced orders."),
    "viz_footer": {
        "type": "splunk.markdown",
        "options": {
            "markdown": "**Quick links** | [ServiceNow incidents](#) | [Discovery: Orders](discovery_orders) | [Discovery: Site Health](discovery_site_health) | **Owner**: maya.chen@theFakeTshirtCompany.com",
            "fontColor": "#7F8C9A",
            "fontSize": "small",
            "backgroundColor": "transparent",
        },
    },

    # Hero KPI shadows (depth)
    "viz_shadow_kpi_revenue": shadow_rect(14),
    "viz_shadow_kpi_orders": shadow_rect(14),
    "viz_shadow_kpi_pricing": shadow_rect(14),
    "viz_shadow_kpi_site": shadow_rect(14),

    # Hero KPIs
    "viz_kpi_revenue": kpi_card(
        "Revenue (period)", "ds_kpi_revenue", "revenue",
        color="#00D2FF", unit="$", unit_pos="before",
        under="hourly buckets, total in window", font_size=44),
    "viz_kpi_orders": kpi_card(
        "Orders (period)", "ds_kpi_orders", "orders",
        color="#7B56DB", under="order count, hourly buckets", font_size=44),
    "viz_kpi_pricing_errors": kpi_card(
        "Wrong-Priced Orders", "ds_kpi_pricing_errors", "wrong_orders",
        color="#F1813F", under="dead_letter_pricing scenario",
        threshold=[
            {"to": 1, "value": "#53A051"},
            {"from": 1, "to": 50, "value": "#F8BE34"},
            {"from": 50, "value": "#DC4E41"},
        ], font_size=44),
    "viz_kpi_site_error": kpi_card(
        "Site Error Rate", "ds_kpi_site_error_rate", "error_rate",
        color="#009CEB", unit="%", unit_pos="after", precision=2,
        under="HTTP 5xx / total requests",
        threshold=[
            {"to": 0.5, "value": "#53A051"},
            {"from": 0.5, "to": 2, "value": "#F8BE34"},
            {"from": 2, "value": "#DC4E41"},
        ], font_size=44),

    # Tile shadows
    "viz_shadow_tile_orders_hour": shadow_rect(12),
    "viz_shadow_tile_aov": shadow_rect(12),
    "viz_shadow_tile_customers": shadow_rect(12),
    "viz_shadow_tile_dlq": shadow_rect(12),
    "viz_shadow_tile_failed": shadow_rect(12),
    "viz_shadow_tile_completed": shadow_rect(12),

    # Tiles
    "viz_tile_orders_hour": tile(
        "Orders / hour", "ds_tile_orders_per_hour", "ordersperhour",
        color="#00D2FF", under="avg per hour-of-day"),
    "viz_tile_aov": tile(
        "Avg Order Value", "ds_tile_aov", "aov",
        color="#7B56DB", unit="$", unit_pos="before", precision=2,
        under="$ per order, period"),
    "viz_tile_customers": tile(
        "Unique Customers", "ds_tile_unique_customers", "unique_customers",
        color="#53A051", under="distinct, period"),
    "viz_tile_dlq": tile(
        "DLQ Depth", "ds_tile_dlq", "dlq_count",
        color="#F1813F", under="dead-lettered ServiceBus",
        threshold=[
            {"to": 1, "value": "#53A051"},
            {"from": 1, "to": 10, "value": "#F8BE34"},
            {"from": 10, "value": "#DC4E41"},
        ]),
    "viz_tile_failed": tile(
        "Failed Orders", "ds_tile_failed", "failed_count",
        color="#DC4E41", under="ServiceBus status=Failed",
        threshold=[
            {"to": 1, "value": "#53A051"},
            {"from": 1, "to": 5, "value": "#F8BE34"},
            {"from": 5, "value": "#DC4E41"},
        ]),
    "viz_tile_completed": tile(
        "Completed Orders", "ds_tile_completed", "completed_count",
        color="#00CDAF", under="ServiceBus status=Completed"),

    # Chart shadows
    "viz_shadow_revenue": shadow_rect(14),
    "viz_shadow_categories": shadow_rect(14),
    "viz_shadow_segments": shadow_rect(14),
    "viz_shadow_siteerror": shadow_rect(14),

    # Charts
    "viz_revenue_trend": {
        "type": "splunk.area",
        "title": "Revenue Trend (6h buckets)",
        "dataSources": {"primary": "ds_revenue_trend"},
        "options": {
            "stackMode": "none", "legendDisplay": "off", "nullValueDisplay": "zero",
            "areaOpacity": 0.35, "backgroundColor": "transparent",
            "yAxisAbbreviation": "auto",
            "axisTitleX": {"visibility": "hide"},
            "axisTitleY": {"visibility": "hide"},
            "seriesColors": ["#00D2FF"],
        },
        "cornerRadius": [12, 12, 12, 12],
    },
    "viz_donut_categories": {
        "type": "splunk.pie",
        "title": "Orders by Product Category",
        "dataSources": {"primary": "ds_orders_by_category"},
        "options": {
            "labelDisplay": "valuesAndPercentage",
            "showDonutHole": True,
            "backgroundColor": "transparent",
            "seriesColors": ["#00D2FF", "#7B56DB", "#53A051", "#F8BE34", "#DC4E41"],
        },
        "cornerRadius": [12, 12, 12, 12],
    },
    "viz_donut_segments": {
        "type": "splunk.pie",
        "title": "Orders by Customer Segment",
        "dataSources": {"primary": "ds_orders_by_segment"},
        "options": {
            "labelDisplay": "valuesAndPercentage",
            "showDonutHole": True,
            "backgroundColor": "transparent",
            "seriesColors": ["#00D2FF", "#7B56DB", "#53A051", "#F8BE34"],
        },
        "cornerRadius": [12, 12, 12, 12],
    },
    "viz_site_error": {
        "type": "splunk.line",
        "title": "Site Error Rate (% HTTP 5xx, hourly)",
        "dataSources": {"primary": "ds_site_error_trend"},
        "options": {
            "legendDisplay": "off",
            "backgroundColor": "transparent",
            "axisTitleX": {"visibility": "hide"},
            "axisTitleY": {"visibility": "hide"},
            "lineWidth": 2,
            "lineSmoothing": "linear",
            "seriesColors": ["#F1813F"],
        },
        "cornerRadius": [12, 12, 12, 12],
    },

    # Table shadows
    "viz_shadow_topproducts": shadow_rect(14),
    "viz_shadow_pricingerrors": shadow_rect(14),

    # Tables
    "viz_top_products": {
        "type": "splunk.table",
        "title": "Top 10 Products by Revenue",
        "dataSources": {"primary": "ds_top_products"},
        "options": {
            "count": 10, "showRowNumbers": False, "showInternalFields": False,
            "headerVisibility": "fixed", "backgroundColor": "transparent",
            "columnFormat": {
                "Product": {"width": 280},
                "Units": {"width": 100, "align": "right"},
                "Revenue": {"width": 130, "align": "right"},
            },
        },
        "cornerRadius": [12, 12, 12, 12],
    },
    "viz_pricing_errors_table": {
        "type": "splunk.table",
        "title": "Recent Pricing Errors (top 20)",
        "dataSources": {"primary": "ds_recent_pricing_errors"},
        "options": {
            "count": 20, "showRowNumbers": False, "showInternalFields": False,
            "headerVisibility": "fixed", "backgroundColor": "transparent",
            "columnFormat": {
                "Time": {"width": 110},
                "Order ID": {"width": 130},
                "Customer": {"width": 110},
                "Error Type": {"width": 130},
                "Orig Price": {"width": 100, "align": "right"},
                "Charged": {"width": 100, "align": "right"},
                "Impact ($)": {"width": 100, "align": "right"},
            },
            "tableFormat": {
                "rowBackgroundColors": "> table | seriesByName(\"_color_rank\") | rangeValue(rowColorConfig)",
            },
        },
        "context": {
            "rowColorConfig": [
                {"from": 0, "to": 1.5, "value": "#DC4E41"},
                {"from": 1.5, "to": 2.5, "value": "#F1813F"},
                {"from": 2.5, "value": "transparent"},
            ]
        },
        "cornerRadius": [12, 12, 12, 12],
    },
}


# ============================================================
# Layout — ABSOLUTE per skill defaults (peer of options on viz_)
# Width 1920, content-driven height
#
# Project design language constraint: absolute layout MUST be wrapped
# in layoutDefinitions + tabs (cannot use "type":"absolute" at top
# level — causes CData parse error).
# ============================================================
def block(item, x, y, w, h):
    return {"item": item, "type": "block", "position": {"x": x, "y": y, "w": w, "h": h}}


# Layout zones (1920 wide, gutter 20px between panels and edges)
GUTTER = 20
EDGE = 20

# Y rhythm
Y = {
    "header": 30,            # h=70
    "stripe": 100,           # h=4
    "section_pulse": 120,    # h=50
    "kpi_row": 180,          # h=200
    "section_sales": 410,    # h=50
    "tile_row": 470,         # h=160
    "section_integrity": 660,  # h=50
    "chart_row1": 720,       # h=320
    "chart_row2": 1060,      # h=320
    "section_products": 1400,  # h=50
    "table_row": 1460,       # h=420
    "footer": 1900,          # h=60
}
TOTAL_H = 1980

# Hero KPIs: 4 × 460 wide, gutter 20, total 4*460 + 5*20 = 1940 — close enough; use 460 each
KPI_W, KPI_H = 460, 200
KPI_X = [EDGE, EDGE + KPI_W + GUTTER,
         EDGE + 2*(KPI_W + GUTTER), EDGE + 3*(KPI_W + GUTTER)]
SHADOW_OFFSET = 4

# Tiles: 6 × 300 wide, gutter 20
TILE_W, TILE_H = 300, 160
TILE_X = [EDGE + i * (TILE_W + GUTTER) for i in range(6)]

# Charts row: 2 × 940 wide
CHART_W, CHART_H = 930, 320

# Tables row: top products 700 + pricing errors 1180
TABLE_H = 420

LAYOUT_STRUCTURE = [
    # Header
    block("viz_brand_wordmark", EDGE, Y["header"], 800, 60),
    block("viz_brand_stripe", EDGE, Y["stripe"], CANVAS_W - 2*EDGE, 4),

    # Section: Today's Pulse
    block("viz_section_pulse", EDGE, Y["section_pulse"], CANVAS_W - 2*EDGE, 50),

    # Hero KPI shadows + KPIs
    block("viz_shadow_kpi_revenue", KPI_X[0] + SHADOW_OFFSET, Y["kpi_row"] + SHADOW_OFFSET, KPI_W, KPI_H),
    block("viz_shadow_kpi_orders", KPI_X[1] + SHADOW_OFFSET, Y["kpi_row"] + SHADOW_OFFSET, KPI_W, KPI_H),
    block("viz_shadow_kpi_pricing", KPI_X[2] + SHADOW_OFFSET, Y["kpi_row"] + SHADOW_OFFSET, KPI_W, KPI_H),
    block("viz_shadow_kpi_site", KPI_X[3] + SHADOW_OFFSET, Y["kpi_row"] + SHADOW_OFFSET, KPI_W, KPI_H),
    block("viz_kpi_revenue", KPI_X[0], Y["kpi_row"], KPI_W, KPI_H),
    block("viz_kpi_orders", KPI_X[1], Y["kpi_row"], KPI_W, KPI_H),
    block("viz_kpi_pricing_errors", KPI_X[2], Y["kpi_row"], KPI_W, KPI_H),
    block("viz_kpi_site_error", KPI_X[3], Y["kpi_row"], KPI_W, KPI_H),

    # Section: Sales Activity
    block("viz_section_sales", EDGE, Y["section_sales"], CANVAS_W - 2*EDGE, 50),

    # Tile shadows + tiles
    block("viz_shadow_tile_orders_hour", TILE_X[0] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_shadow_tile_aov", TILE_X[1] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_shadow_tile_customers", TILE_X[2] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_shadow_tile_dlq", TILE_X[3] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_shadow_tile_failed", TILE_X[4] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_shadow_tile_completed", TILE_X[5] + SHADOW_OFFSET, Y["tile_row"] + SHADOW_OFFSET, TILE_W, TILE_H),
    block("viz_tile_orders_hour", TILE_X[0], Y["tile_row"], TILE_W, TILE_H),
    block("viz_tile_aov", TILE_X[1], Y["tile_row"], TILE_W, TILE_H),
    block("viz_tile_customers", TILE_X[2], Y["tile_row"], TILE_W, TILE_H),
    block("viz_tile_dlq", TILE_X[3], Y["tile_row"], TILE_W, TILE_H),
    block("viz_tile_failed", TILE_X[4], Y["tile_row"], TILE_W, TILE_H),
    block("viz_tile_completed", TILE_X[5], Y["tile_row"], TILE_W, TILE_H),

    # Section: Pricing Integrity & Site Health
    block("viz_section_integrity", EDGE, Y["section_integrity"], CANVAS_W - 2*EDGE, 50),

    # Charts row 1: revenue trend + categories donut
    block("viz_shadow_revenue", EDGE + SHADOW_OFFSET, Y["chart_row1"] + SHADOW_OFFSET, CHART_W, CHART_H),
    block("viz_shadow_categories", EDGE + CHART_W + GUTTER + SHADOW_OFFSET, Y["chart_row1"] + SHADOW_OFFSET, CHART_W, CHART_H),
    block("viz_revenue_trend", EDGE, Y["chart_row1"], CHART_W, CHART_H),
    block("viz_donut_categories", EDGE + CHART_W + GUTTER, Y["chart_row1"], CHART_W, CHART_H),

    # Charts row 2: segments donut + site error
    block("viz_shadow_segments", EDGE + SHADOW_OFFSET, Y["chart_row2"] + SHADOW_OFFSET, CHART_W, CHART_H),
    block("viz_shadow_siteerror", EDGE + CHART_W + GUTTER + SHADOW_OFFSET, Y["chart_row2"] + SHADOW_OFFSET, CHART_W, CHART_H),
    block("viz_donut_segments", EDGE, Y["chart_row2"], CHART_W, CHART_H),
    block("viz_site_error", EDGE + CHART_W + GUTTER, Y["chart_row2"], CHART_W, CHART_H),

    # Section: Top Products & Pricing Errors
    block("viz_section_products", EDGE, Y["section_products"], CANVAS_W - 2*EDGE, 50),

    # Table row: top products (700) + pricing errors (1180)
    block("viz_shadow_topproducts", EDGE + SHADOW_OFFSET, Y["table_row"] + SHADOW_OFFSET, 700, TABLE_H),
    block("viz_shadow_pricingerrors", EDGE + 700 + GUTTER + SHADOW_OFFSET, Y["table_row"] + SHADOW_OFFSET, 1180, TABLE_H),
    block("viz_top_products", EDGE, Y["table_row"], 700, TABLE_H),
    block("viz_pricing_errors_table", EDGE + 700 + GUTTER, Y["table_row"], 1180, TABLE_H),

    # Footer
    block("viz_footer", EDGE, Y["footer"], CANVAS_W - 2*EDGE, 60),
]

# Project design language: absolute layout MUST be in layoutDefinitions + tabs
LAYOUT = {
    "globalInputs": ["input_global_trp"],
    "layoutDefinitions": {
        "layout_main": {
            "type": "absolute",
            "options": {
                "width": CANVAS_W,
                "height": TOTAL_H,
                "display": "auto-scale",
                "backgroundColor": CANVAS_BG,
            },
            "structure": LAYOUT_STRUCTURE,
        }
    },
    "options": {},
    "tabs": {"items": [{"label": "Main", "layoutId": "layout_main"}]},
}


DASHBOARD = {
    "title": "Discovery - Retail Pulse",
    "description": "Real-time revenue, order, and site health dashboard for the FAKE T-Shirt Company. Designed for Director of Retail Operations.",
    "defaults": DEFAULTS,
    "inputs": INPUTS,
    "dataSources": DS,
    "visualizations": VIZ,
    "layout": LAYOUT,
}


if __name__ == "__main__":
    out = json.dumps(DASHBOARD, indent=2)
    with open("dashboard.json", "w") as f:
        f.write(out)
    print(f"Wrote dashboard.json ({len(out)} chars)")
    print(f"  - Layout: ABSOLUTE {CANVAS_W}x{TOTAL_H}")
    print(f"  - {len(DS)} data sources")
    print(f"  - {len(VIZ)} visualizations")
    print(f"  - {len(LAYOUT_STRUCTURE)} layout entries")
    layout_items = {e["item"] for e in LAYOUT_STRUCTURE}
    viz_items = set(VIZ.keys())
    missing = viz_items - layout_items
    extra = layout_items - viz_items
    if missing: print(f"  WARN: viz not in layout: {missing}")
    if extra: print(f"  WARN: layout refs missing viz: {extra}")
    if not missing and not extra:
        print("  All viz placed in layout — OK")
