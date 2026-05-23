#!/usr/bin/env python3
"""
One-off generator: parse Splunk docs pages (WebFetch markdown export) into conf reference MD.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

OUT_DIR = Path(__file__).resolve().parent

# Splunk docs pages fetched via WebFetch land here (Cursor agent-tools).
_TOOL_BASE = Path.home() / ".cursor/projects/Users-joehanse-Library-CloudStorage-OneDrive-Cisco-Documents-03-Funny-Projects-Cursor-Dummy/agent-tools"


def _resolve_fetch(name: str, fallback_names: Tuple[str, ...]) -> Path:
    env = __import__("os").environ.get(f"SPLUNK_CONF_FETCH_{name.upper()}")
    if env:
        return Path(env)
    for fn in fallback_names:
        p = _TOOL_BASE / fn
        if p.is_file():
            return p
    raise FileNotFoundError(
        f"No fetch file for {name}. Set SPLUNK_CONF_FETCH_{name.upper()} or place fetch txt under {_TOOL_BASE}"
    )


FETCH_FILES = {
    "indexes": _resolve_fetch(
        "indexes",
        ("0f004dfc-0c2f-494c-a709-527957607bd7.txt",),
    ),
    "savedsearches": _resolve_fetch(
        "savedsearches",
        ("1863579d-2d2f-40df-be1a-4969798296bb.txt",),
    ),
    "server": _resolve_fetch(
        "server",
        ("2e5be8f8-07d9-4e90-b998-99ef40349036.txt",),
    ),
    "app": _resolve_fetch(
        "app",
        ("de88a0ed-33ac-4634-b3c1-75454162345d.txt",),
    ),
}

SETTING_RE = re.compile(
    r"^((?:[a-zA-Z_*][a-zA-Z0-9_*]*)(?:\.(?:<[^>]+>|[a-zA-Z0-9_*]+))*)\s*=\s*(.+?)\s*$"
)
STANZA_HEADER_RE = re.compile(r"^\[[^\]]+\]\s*$")

NAV_HEADERS = {
    "splunk enterprise",
    "splunk cloud platform",
    "splunkbase",
    "enterprise security",
    "soar",
    "it service intelligence",
    "content packs",
    "splunk observability cloud",
    "appdynamics saas",
    "appdynamics on-premises",
    "sap agent",
    "developer documentation",
    "resources",
}


def read_lines(path: Path) -> List[str]:
    return path.read_text(encoding="utf-8", errors="replace").splitlines()


def extract_spec_blocks(lines: List[str], conf_base: str) -> Tuple[str, List[Tuple[str, str]]]:
    """Return overview paragraph and list of (section_title, fenced_content)."""
    spec_marker = f"## {conf_base}.conf.spec"
    example_marker = f"## {conf_base}.conf.example"
    try:
        i0 = next(i for i, ln in enumerate(lines) if ln.strip() == spec_marker)
    except StopIteration:
        raise ValueError(f"Missing {spec_marker} in {conf_base}")
    try:
        i1 = next(i for i, ln in enumerate(lines) if ln.strip() == example_marker)
    except StopIteration:
        i1 = len(lines)

    overview_para = ""
    sections: List[Tuple[str, str]] = []
    current_title = ""
    in_fence = False
    fence_buf: List[str] = []

    i = i0 + 1
    while i < i1:
        ln = lines[i]
        if ln.startswith("```"):
            if not in_fence:
                in_fence = True
                fence_buf = []
            else:
                content = "\n".join(fence_buf).strip("\n")
                if current_title == "OVERVIEW" and content:
                    overview_para = overview_from_block(content)
                elif current_title:
                    sections.append((current_title, content))
                in_fence = False
                fence_buf = []
            i += 1
            continue
        if in_fence:
            fence_buf.append(ln)
            i += 1
            continue
        if ln.startswith("## "):
            title = ln[3:].strip()
            tl = title.lower()
            if tl not in NAV_HEADERS and not title.startswith("http"):
                current_title = title
        i += 1

    return overview_para, sections


def overview_from_block(content: str) -> str:
    lines = []
    for ln in content.splitlines():
        s = ln.strip()
        if s.startswith("#"):
            t = s.lstrip("#").strip()
            if t and not t.startswith("Version"):
                lines.append(t)
    para = " ".join(lines)
    para = re.sub(r"\s+", " ", para).strip()
    if len(para) > 600:
        para = para[:597].rsplit(" ", 1)[0] + "..."
    return para


def extract_default(bullets: List[str]) -> str:
    for b in bullets:
        m = re.search(r"Default:\s*(.+)$", b, re.I)
        if m:
            d = m.group(1).strip()
            return d[:120] + ("..." if len(d) > 120 else "")
        if re.search(r"No default\.?$", b, re.I):
            return "(none)"
    return ""


def condense_desc(bullets: List[str]) -> str:
    parts = []
    for b in bullets:
        t = re.sub(r"^\*\s*", "", b).strip()
        if re.match(r"Default:", t, re.I) or re.match(r"No default", t, re.I):
            continue
        if t.startswith("NOTE:") or t.startswith("CAUTION:"):
            continue
        parts.append(t)
    text = " ".join(parts)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return "See Splunk documentation."
    # ~2 short sentences
    sents = re.split(r"(?<=[.!?])\s+", text)
    out = " ".join(sents[:2]).strip()
    if len(out) > 320:
        out = out[:317].rsplit(" ", 1)[0] + "..."
    return out


def parse_settings_from_block(block: str) -> List[Tuple[str, str, str, str]]:
    """Returns list of (setting, type_spec, default, description)."""
    rows: List[Tuple[str, str, str, str]] = []
    lines = block.splitlines()
    i = 0
    while i < len(lines):
        raw_line = lines[i]
        ln = raw_line.rstrip()
        if not ln.strip():
            i += 1
            continue
        # Example snippets in spec are indented; skip them as bogus settings.
        if raw_line[:1] in (" ", "\t"):
            i += 1
            continue
        if STANZA_HEADER_RE.match(ln.strip()):
            i += 1
            continue
        if ln.strip().startswith("#"):
            i += 1
            continue
        m = SETTING_RE.match(ln.strip())
        if not m:
            i += 1
            continue
        key, rhs = m.group(1), m.group(2)
        bullets: List[str] = []
        i += 1
        while i < len(lines):
            raw_nxt = lines[i]
            nxt = raw_nxt.rstrip()
            if STANZA_HEADER_RE.match(nxt.strip()):
                break
            st = nxt.lstrip()
            if st.startswith("*"):
                bullets.append(st)
                i += 1
                continue
            if raw_nxt[:1] not in (" ", "\t") and SETTING_RE.match(nxt.strip()):
                break
            i += 1
        default = extract_default(bullets)
        desc = condense_desc(bullets)
        type_spec = rhs.strip()
        if len(type_spec) > 80:
            type_spec = type_spec[:77] + "..."
        rows.append((key, type_spec, default, desc))
    return rows


def split_virtual_index_block(content: str) -> Tuple[str, str]:
    marker = "# Volume settings."
    idx = content.find(marker)
    if idx == -1:
        return content, ""
    return content[:idx].strip(), content[idx:].strip()


def render_md(
    conf_name: str,
    overview: str,
    stanza_sections: List[Tuple[str, str, List[Tuple[str, str, str, str]]]],
    meta: dict,
) -> str:
    lines_out: List[str] = []
    lines_out.append(f"# {conf_name}.conf")
    lines_out.append("")
    lines_out.append(overview or f"Reference for `{conf_name}.conf` (Splunk Enterprise).")
    lines_out.append("")
    lines_out.append("**Source version:** Splunk Enterprise 10.2")
    lines_out.append("")
    lines_out.append("## File details")
    lines_out.append("")
    lines_out.append("| Property | Value |")
    lines_out.append("|----------|-------|")
    lines_out.append("| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |")
    lines_out.append(f"| Pipeline phase | {meta['pipeline']} |")
    lines_out.append(f"| Restart required | {meta['restart']} |")
    lines_out.append(f"| Related files | {meta['related']} |")
    lines_out.append("")
    lines_out.append("## Stanzas and settings")
    lines_out.append("")
    for stanza_title, stanza_note, rows in stanza_sections:
        lines_out.append(f"### {stanza_title}")
        lines_out.append("")
        if stanza_note:
            lines_out.append(stanza_note)
            lines_out.append("")
        lines_out.append("| Setting | Type | Default | Description |")
        lines_out.append("|---------|------|---------|-------------|")
        if not rows:
            lines_out.append("| *(none in this section)* | — | — | — |")
        else:
            for setting, typ, default, desc in rows:
                def_esc = default.replace("|", "\\|") if default else "—"
                desc_esc = desc.replace("|", "\\|")
                lines_out.append(
                    f"| `{setting}` | `{typ}` | {def_esc} | {desc_esc} |"
                )
        lines_out.append("")
    return "\n".join(lines_out).rstrip() + "\n"


def build_indexes() -> str:
    overview, sections = extract_spec_blocks(read_lines(FETCH_FILES["indexes"]), "indexes")
    stanza_parts: List[Tuple[str, str, List]] = []

    for title, content in sections:
        if title == "OVERVIEW":
            continue
        if title == "GLOBAL SETTINGS":
            rows = parse_settings_from_block(content)
            stanza_parts.append(
                (
                    "`[default]`",
                    "Global defaults and indexer-wide tuning (also allowed outside any stanza).",
                    rows,
                )
            )
        elif title == "PER INDEX OPTIONS":
            rows = parse_settings_from_block(content)
            stanza_parts.append(
                (
                    "`[<index_name>]`",
                    "Per-index paths, retention, datatype, SmartStore/remote storage, and threading overrides.",
                    rows,
                )
            )
        elif title == "PER PROVIDER FAMILY OPTIONS":
            stanza_parts.append(
                (
                    "`[provider-family:<family_name>]`",
                    "Shared defaults for external resource providers (ERP); provider stanzas override family values.",
                    parse_settings_from_block(content),
                )
            )
        elif title == "PER PROVIDER OPTIONS":
            rows = parse_settings_from_block(content)
            stanza_parts.append(
                (
                    "`[provider:<provider_name>]`",
                    "External Resource Provider (ERP) configuration (e.g. Hadoop/Hunk); referenced by virtual indexes.",
                    rows,
                )
            )
        elif title == "PER VIRTUAL INDEX OPTIONS":
            vi, vol = split_virtual_index_block(content)
            stanza_parts.append(
                (
                    "`[<virtual_index_name>]`",
                    "Virtual index stanza; sets `vix.provider` and Hadoop/streaming input options.",
                    parse_settings_from_block(vi),
                )
            )
            if vol.strip():
                stanza_parts.append(
                    (
                        "`[volume:<volume_name>]`",
                        "Storage volume definition for local or remote paths; referenced from index paths via `volume:` prefix.",
                        parse_settings_from_block(vol),
                    )
                )

    meta = {
        "pipeline": "Indexing",
        "restart": "Yes (most settings)",
        "related": "props.conf, transforms.conf, server.conf",
    }
    return render_md("indexes", overview, stanza_parts, meta)


def build_savedsearches() -> str:
    overview, sections = extract_spec_blocks(read_lines(FETCH_FILES["savedsearches"]), "savedsearches")
    default_rows: List[Tuple[str, str, str, str]] = []
    stanza_blocks: List[str] = []
    for title, content in sections:
        if title == "OVERVIEW":
            continue
        if title == "GLOBAL SETTINGS":
            default_rows = parse_settings_from_block(content)
            continue
        stanza_blocks.append(content)
    big = "\n\n".join(stanza_blocks)
    rows = parse_settings_from_block(big)
    stanza_parts = [
        (
            "`[default]`",
            "Optional global defaults for saved searches.",
            default_rows,
        ),
        (
            "`[<stanza_name>]`",
            "Each stanza is one saved search, scheduled report, or alert; settings below apply per stanza.",
            rows,
        ),
    ]
    meta = {
        "pipeline": "Search",
        "restart": "No (reload via REST or UI)",
        "related": "alert_actions.conf, macros.conf, transforms.conf",
    }
    return render_md("savedsearches", overview, stanza_parts, meta)


def slug_doc_title(title: str) -> str:
    s = re.sub(r"[^\w]+", "_", title.lower()).strip("_")
    return (s[:56] or "unknown").rstrip("_")


def group_server_by_stanza(blocks: Iterable[Tuple[str, str]]) -> List[Tuple[str, str, List]]:
    """Split doc sections into Splunk stanzas; merge blocks without [stanza] into prior stanza."""
    merge_map: dict[str, Tuple[str, List]] = {}
    last_stanza: Optional[str] = None

    def add_rows(
        stanza: str,
        doc_title: str,
        rows: List[Tuple[str, str, str, str]],
        advances_cursor: bool,
    ) -> None:
        nonlocal last_stanza
        if advances_cursor:
            last_stanza = stanza
        note = f"Documented in Splunk docs section *{doc_title}*."
        if stanza not in merge_map:
            merge_map[stanza] = (note, list(rows))
        else:
            prev_note, prev_rows = merge_map[stanza]
            merge_map[stanza] = (prev_note + " " + note, prev_rows + rows)

    for doc_title, content in blocks:
        if doc_title == "OVERVIEW":
            continue
        if doc_title == "GLOBAL SETTINGS":
            rows = parse_settings_from_block(content)
            add_rows("[default]", doc_title, rows, advances_cursor=True)
            continue

        stanzas_in_block: List[Tuple[str, List[str]]] = []
        current_stanza: Optional[str] = None
        buf: List[str] = []
        for ln in content.splitlines():
            if STANZA_HEADER_RE.match(ln.strip()):
                if current_stanza is not None:
                    stanzas_in_block.append((current_stanza, buf))
                current_stanza = ln.strip()
                buf = []
                continue
            buf.append(ln)
        if current_stanza is not None:
            stanzas_in_block.append((current_stanza, buf))

        if stanzas_in_block:
            for st, blines in stanzas_in_block:
                block_txt = "\n".join(blines)
                rows = parse_settings_from_block(block_txt)
                add_rows(st, doc_title, rows, advances_cursor=True)
            continue

        rows = parse_settings_from_block(content)
        if not rows:
            continue
        fallback = f"[section:{slug_doc_title(doc_title)}]"
        target = last_stanza if last_stanza else fallback
        add_rows(target, doc_title, rows, advances_cursor=False)

    out: List[Tuple[str, str, List]] = []
    for st, (note, rows) in merge_map.items():
        out.append((f"`{st}`", note, rows))
    return out


def build_server() -> str:
    overview, sections = extract_spec_blocks(read_lines(FETCH_FILES["server"]), "server")
    grouped = group_server_by_stanza(sections)
    meta = {
        "pipeline": "N/A (system configuration)",
        "restart": "Yes (most settings)",
        "related": "web.conf, inputs.conf, outputs.conf, authentication.conf",
    }
    return render_md("server", overview, grouped, meta)


def build_app() -> str:
    overview, sections = extract_spec_blocks(read_lines(FETCH_FILES["app"]), "app")
    stanza_parts: List[Tuple[str, str, List]] = []
    for title, content in sections:
        if title == "OVERVIEW":
            continue
        if title.startswith("[") and title.endswith("]"):
            rows = parse_settings_from_block(content)
            stanza_parts.append((f"`{title}`", "", rows))
            continue
        rows = parse_settings_from_block(content)
        stanza_parts.append((f"*({title})*", "", rows))
    meta = {
        "pipeline": "N/A (app metadata)",
        "restart": "Yes",
        "related": "default.meta",
    }
    return render_md("app", overview, stanza_parts, meta)


def main() -> None:
    builders = {
        "indexes.md": build_indexes,
        "savedsearches.md": build_savedsearches,
        "server.md": build_server,
        "app.md": build_app,
    }
    for fname, fn in builders.items():
        text = fn()
        (OUT_DIR / fname).write_text(text, encoding="utf-8")
        print(f"Wrote {fname} ({len(text.splitlines())} lines)")


if __name__ == "__main__":
    main()
