#!/usr/bin/env python3
"""
Parse Splunk docs markdown dumps (from WebFetch) and emit structured conf reference MD.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import List, Tuple

META = {
    "props": {
        "title": "props.conf",
        "purpose_fence_only": False,
        "pipeline": "Parsing, Indexing, Search",
        "restart": "Reload via `| extract reload=T` or `debug/refresh`",
        "related": "transforms.conf, fields.conf, transactiontypes.conf",
    },
    "transforms": {
        "title": "transforms.conf",
        "purpose_fence_only": False,
        "pipeline": "Parsing, Indexing, Search",
        "restart": "Reload via `debug/refresh`",
        "related": "props.conf, fields.conf",
    },
    "inputs": {
        "title": "inputs.conf",
        "purpose_fence_only": False,
        "pipeline": "Input",
        "restart": "Restart required for most settings",
        "related": "props.conf, outputs.conf, server.conf",
    },
    "outputs": {
        "title": "outputs.conf",
        "purpose_fence_only": False,
        "pipeline": "Output",
        "restart": "Restart required",
        "related": "inputs.conf, server.conf",
    },
}


def find_range(lines: List[str], start_pat: str, end_pat: str) -> Tuple[int, int]:
    s = e = -1
    for i, ln in enumerate(lines):
        if ln.strip() == start_pat:
            s = i
        elif ln.strip() == end_pat and s >= 0:
            e = i
            break
    if s < 0 or e < 0:
        raise ValueError(f"Markers not found: {start_pat!r} -> {end_pat!r}")
    return s, e


def purpose_from_first_fence(lines: List[str], spec_start: int, example_start: int) -> str:
    """Grab content from the first ``` block (Splunk header comment + wrapped lines)."""
    in_fence = False
    buf: List[str] = []
    saw_open = False
    for i in range(spec_start, example_start):
        ln = lines[i]
        t = ln.strip()
        if t == "```":
            if not in_fence:
                in_fence = True
                saw_open = True
                buf = []
            else:
                break
            continue
        if in_fence and saw_open:
            buf.append(ln.rstrip("\n"))
    cleaned: List[str] = []
    for ln in buf:
        s = ln.strip()
        if not s:
            continue
        if ln.lstrip().startswith("#"):
            cleaned.append(ln.lstrip("#").strip())
        else:
            cleaned.append(s)
    text = "\n".join("> " + part for part in cleaned).strip()
    # Fallback: join with space preserving readability
    if not text:
        raw = []
        in_fence = False
        for i in range(spec_start, example_start):
            t = lines[i].strip()
            if t == "```":
                in_fence = not in_fence
                continue
            if in_fence and lines[i].startswith("#"):
                raw.append(lines[i].lstrip("#").strip())
            elif in_fence and lines[i].strip() and not lines[i].startswith("#"):
                break
        text = " ".join(raw).strip()
    return text or "See Splunk Administration Manual — configuration file reference."


_DEFAULT_LINE_RE = re.compile(r"^\*\s*Default\b", re.I)


def valid_setting_key(key: str) -> bool:
    key = key.strip()
    if len(key) < 2:
        return False
    if any(ch.isspace() for ch in key):
        return False
    if key.lower().startswith("example"):
        return False
    first = key[0]
    if first.isdigit():
        return False
    if key.startswith("\\") or key == "\\":
        return False
    if len(key) > 96:
        return False
    # Spec keys should not contain prose punctuation like these:
    if "!" in key:
        return False
    return True


def iter_section_chunks(
    lines: List[str], spec_start: int, example_start: int
) -> List[Tuple[str, str]]:
    """
    Splunk docs split spec into markdown ## headings with ``` fences under each.
    Returns list of (section_title, concatenated_fence_content).
    """
    chunks: List[Tuple[str, str]] = []
    section = "Introduction"
    fence_lines: List[str] = []
    in_fence = False
    for i in range(spec_start + 1, example_start):
        ln = lines[i]
        t = ln.strip()
        if t.startswith("## ") and not in_fence:
            # New doc subsection
            if fence_lines:
                chunks.append((section, "\n".join(fence_lines)))
                fence_lines = []
            section = t[3:].strip()
            continue
        if t == "```":
            if not in_fence:
                in_fence = True
                fence_lines = []
            else:
                in_fence = False
                chunks.append((section, "\n".join(fence_lines)))
                fence_lines = []
            continue
        if in_fence:
            fence_lines.append(ln.rstrip("\n"))
    return chunks


def escape_md_cell(s: str) -> str:
    s = s.replace("|", "\\|").replace("\n", " ")
    return s


def parse_settings(body: str) -> List[Tuple[str, str, str, str]]:
    """
    Return list of (key, type_expr, default, description_one_line).
    """
    lines = body.split("\n")
    out: List[Tuple[str, str, str, str]] = []
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip("\n")
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            i += 1
            continue
        if stripped.startswith("*"):
            i += 1
            continue
        if stripped.startswith("|"):
            i += 1
            continue
        if stripped.startswith("[") and stripped.endswith("]"):
            i += 1
            continue
        # Skip obvious markdown artifacts inside fences
        if stripped.startswith("**") and stripped.endswith("**"):
            i += 1
            continue
        if "=" not in line:
            i += 1
            continue
        # Only treat as setting if '=' separates key / value at line level (not regex examples with = inside)
        key, _, rest = line.partition("=")
        key = key.strip()
        val = rest.strip()
        if not key or not val:
            i += 1
            continue
        if not valid_setting_key(key):
            i += 1
            continue
        # Skip indented examples (heuristic)
        if raw.startswith(" ") or raw.startswith("\t"):
            i += 1
            continue
        desc_bits: List[str] = []
        default = ""
        j = i + 1
        while j < len(lines):
            raw_nxt = lines[j]
            nxt = raw_nxt.strip()
            if not nxt:
                j += 1
                continue
            if nxt.startswith("*"):
                if _DEFAULT_LINE_RE.match(nxt):
                    if ":" in nxt:
                        default = nxt.split(":", 1)[1].strip()
                    else:
                        default = nxt.replace("*", "").strip()
                else:
                    desc_bits.append(nxt.lstrip("*").strip())
                j += 1
                continue
            # Wrapped continuation of the preceding bullet paragraph (no leading '*').
            if raw_nxt.startswith((" ", "\t")) and not raw_nxt.lstrip().startswith("#"):
                j += 1
                continue
            if nxt.startswith("#") or ("=" in nxt and not nxt.startswith("*")):
                break
            break
        desc = " ".join(desc_bits).strip()
        if len(desc) > 600:
            desc = desc[:597] + "..."
        out.append((key, val, default, desc))
        i = j if j > i + 1 else i + 1
    return out


def render_md(conf_key: str, chunks: List[Tuple[str, str]], purpose: str) -> str:
    m = META[conf_key]
    lines_out: List[str] = []
    lines_out.append(f"# {m['title']}")
    lines_out.append("")
    lines_out.append(purpose)
    lines_out.append("")
    lines_out.append("**Source version:** Splunk Enterprise 10.2")
    lines_out.append("")
    lines_out.append("## File details")
    lines_out.append("")
    lines_out.append("| Property | Value |")
    lines_out.append("|----------|-------|")
    lines_out.append("| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |")
    lines_out.append(f"| Pipeline phase | {m['pipeline']} |")
    lines_out.append(f"| Restart required | {m['restart']} |")
    lines_out.append(f"| Related files | {m['related']} |")
    lines_out.append("")
    lines_out.append("## Stanzas and settings")
    lines_out.append("")
    lines_out.append(
        "Splunk documents most settings under logical sections; "
        "stanza patterns such as `[<spec>]`, `[host::...]`, `[source::...]`, "
        "`[rule::...]`, and `[delayedrule::...]` apply as described in the Introduction section."
        if conf_key == "props"
        else (
            "Transform stanzas use arbitrary names `[<unique_transform_stanza_name>]` "
            "referenced from props.conf (for example `REPORT-<class>`)."
            if conf_key == "transforms"
            else ""
        )
    )
    if lines_out[-1]:
        lines_out.append("")

    for section, body in chunks:
        rows = parse_settings(body)
        if not rows:
            continue
        lines_out.append(f"### {section}")
        lines_out.append("")
        lines_out.append("| Setting | Type | Default | Description |")
        lines_out.append("|---------|------|---------|-------------|")
        for key, typ, default, desc in rows:
            lines_out.append(
                "| "
                + escape_md_cell(key)
                + " | `"
                + escape_md_cell(typ)
                + "` | "
                + ("`" + escape_md_cell(default) + "`" if default else "—")
                + " | "
                + escape_md_cell(desc or "—")
                + " |"
            )
        lines_out.append("")

    return "\n".join(lines_out).rstrip() + "\n"


def main() -> int:
    if len(sys.argv) != 5:
        print(
            "Usage: generate_splunk_admin_conf_refs.py <props_fetch.txt> <transforms_fetch.txt> "
            "<inputs_fetch.txt> <outputs_fetch.txt>",
            file=sys.stderr,
        )
        return 2
    paths = [Path(p) for p in sys.argv[1:5]]
    keys = ["props", "transforms", "inputs", "outputs"]
    markers = [
        ("## props.conf.spec", "## props.conf.example"),
        ("## transforms.conf.spec", "## transforms.conf.example"),
        ("## inputs.conf.spec", "## inputs.conf.example"),
        ("## outputs.conf.spec", "## outputs.conf.example"),
    ]
    out_dir = Path(__file__).resolve().parents[1] / "plugins" / "splunk-admin" / "reference" / "conf"
    out_dir.mkdir(parents=True, exist_ok=True)

    out_files = ["props.md", "transforms.md", "inputs.md", "outputs.md"]

    for key, (sm, em), src, oname in zip(keys, markers, paths, out_files):
        lines = src.read_text(encoding="utf-8", errors="replace").splitlines()
        s, e = find_range(lines, sm, em)
        purpose = purpose_from_first_fence(lines, s, e)
        chunks = iter_section_chunks(lines, s, e)
        md = render_md(key, chunks, purpose)
        (out_dir / oname).write_text(md, encoding="utf-8")
        print(f"Wrote {out_dir / oname} ({len(md.splitlines())} lines)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
