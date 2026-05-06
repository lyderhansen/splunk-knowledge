#!/usr/bin/env python3
"""
Generate Splunk REST Input / Output reference markdown from fetched RESTREF docs.
Parses markdown-ish Splunk doc extracts produced by WebFetch.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


ENDPOINT_HEADER = re.compile(r"^## ([a-zA-Z0-9_\-\{\}\./]+)$")
METHOD_HEADER = re.compile(r"^### (GET|POST|PUT|DELETE|PATCH)\s*$", re.I)


def split_sections(lines: list[str]) -> list[tuple[str, int, int]]:
    hits = []
    for i, line in enumerate(lines):
        m = ENDPOINT_HEADER.match(line)
        if m and "/" in m.group(1):
            hits.append((m.group(1), i))
    sections = []
    for j, (title, start) in enumerate(hits):
        end = hits[j + 1][1] if j + 1 < len(hits) else len(lines)
        sections.append((title, start, end))
    return sections


def normalize_param_rows(header: list[str], rows: list[list[str]]) -> list[tuple[str, str, str, str, str]]:
    hi = [h.lower().strip() for h in header]
    out = []
    if len(header) == 2 and "name" in hi[0] and "description" in hi[1]:
        for r in rows:
            if len(r) >= 2:
                out.append((r[0], "string", "Varies", "—", r[1]))
            elif len(r) == 1:
                out.append((r[0], "—", "—", "—", "—"))
    elif len(header) >= 4 and "type" in hi:
        # Name | Type | Default | Description OR Name | Type | Required | Default | Description
        name_i = hi.index("name") if "name" in hi else 0
        type_i = hi.index("type") if "type" in hi else 1
        desc_i = hi.index("description") if "description" in hi else len(header) - 1
        req_i = hi.index("required") if "required" in hi else None
        def_i = hi.index("default") if "default" in hi else None
        for r in rows:
            pad = r + [""] * len(header)
            name = pad[name_i] if name_i < len(pad) else ""
            typ = pad[type_i] if type_i < len(pad) else "—"
            req = pad[req_i] if req_i is not None and req_i < len(pad) else "Varies"
            default = pad[def_i] if def_i is not None and def_i < len(pad) else "—"
            desc = pad[desc_i] if desc_i < len(pad) else "—"
            out.append((name, typ, req, default, desc))
    else:
        for r in rows:
            if not r:
                continue
            if len(r) >= 2:
                out.append((r[0], r[1] if len(r) > 1 else "—", "Varies", "—", r[-1]))
            else:
                out.append((r[0], "—", "—", "—", "—"))
    return out


def normalize_return_rows(header: list[str], rows: list[list[str]]) -> list[tuple[str, str, str]]:
    hi = [h.lower().strip() for h in header]
    out = []
    if len(header) == 2:
        for r in rows:
            if len(r) >= 2:
                out.append((r[0], "varies", r[1]))
            elif len(r) == 1:
                out.append((r[0], "varies", "—"))
    elif "type" in hi:
        ni = hi.index("name")
        ti = hi.index("type")
        di = hi.index("description") if "description" in hi else len(header) - 1
        for r in rows:
            pad = r + [""] * len(header)
            out.append((pad[ni], pad[ti], pad[di]))
    else:
        for r in rows:
            out.append((r[0] if r else "—", "—", r[-1] if r else "—"))
    return out


def extract_after_keyword(
    section_lines: list[str],
    keyword: str,
    *,
    stop_on_exact_lines: frozenset[str] | None = None,
    stop_at_method_boundary: bool = False,
) -> str:
    kw = keyword.lower()
    stops = {s.lower() for s in stop_on_exact_lines} if stop_on_exact_lines else None
    for i, ln in enumerate(section_lines):
        if ln.strip().lower() != kw:
            continue
        chunk = section_lines[i + 1 :]
        acc: list[str] = []
        for cl in chunk:
            sl = cl.strip()
            if stops is not None and sl.lower() in stops:
                break
            if stop_at_method_boundary and METHOD_HEADER.match(cl):
                break
            if cl.startswith("## ") and "/" in cl:
                break
            acc.append(cl)
        return "\n".join(acc).strip()
    return ""


def extract_first_markdown_table(block: str) -> tuple[list[str], list[list[str]]] | None:
    """Parse first contiguous markdown table; skip separator rows."""
    rows: list[list[str]] = []
    for raw in block.split("\n"):
        line = raw.strip()
        if not line.startswith("|"):
            if rows:
                break
            continue
        if re.match(r"^\|\s*-+", line):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
    if len(rows) < 1:
        return None
    return rows[0], rows[1:]


def extract_tables_from_chunk(chunk: str) -> tuple[list[list[str]] | None, list[list[str]] | None, list[str]]:
    """Collect prose plus markdown tables from a documentation chunk."""
    prose: list[str] = []
    tables: list[tuple[list[str], list[list[str]]]] = []
    lines = chunk.split("\n")
    buf_lines: list[str] = []
    in_table = False
    for raw in lines:
        line = raw.strip()
        if line.startswith("|"):
            in_table = True
            buf_lines.append(raw)
        else:
            if in_table:
                tbl = extract_first_markdown_table("\n".join(buf_lines))
                if tbl:
                    tables.append(tbl)
                buf_lines = []
                in_table = False
            if (
                line
                and not line.startswith("http")
                and not line.startswith("CODECopy")
                and not line.startswith("```")
                and not line.startswith("[Expand]")
                and not line.startswith("[Pagination")
                and "Pagination and filtering" not in line
                and not line.startswith("### ")
                and not line.startswith("## ")
                and not line.startswith("Example")
                and line not in ("Request", "Response", "XMLCopy", "JSONCopy")
            ):
                prose.append(line)
            elif line.startswith("### ") or line.startswith("## "):
                break
    if buf_lines:
        tbl = extract_first_markdown_table("\n".join(buf_lines))
        if tbl:
            tables.append(tbl)
    param_table = None
    if tables:
        h, b = tables[0]
        param_table = [h] + b
    second = None
    if len(tables) > 1:
        h, b = tables[1]
        second = [h] + b
    return param_table, second, prose


def split_methods(section_lines: list[str]) -> list[tuple[str, list[str]]]:
    methods = []
    current_name = None
    current_buf: list[str] = []
    for ln in section_lines[1:]:
        mm = METHOD_HEADER.match(ln)
        if mm:
            if current_name is not None:
                methods.append((current_name, current_buf))
            current_name = mm.group(1).upper()
            current_buf = []
        elif current_name is not None:
            current_buf.append(ln)
    if current_name is not None:
        methods.append((current_name, current_buf))
    return methods


def extract_capability(section_lines: list[str]) -> str:
    blob = "\n".join(section_lines[:120])
    m = re.search(r"Requires the capabilities`([^`]+)`(?:\s+and`([^`]+)`)?", blob)
    if m:
        parts = [m.group(1)]
        if m.group(2):
            parts.append(m.group(2))
        return ", ".join(p.strip() for p in parts if p)
    m2 = re.search(r"Requires the capabilities\s+([^\n]+)", blob)
    if m2:
        return m2.group(1).strip().strip(".")
    if "Capability" in blob or "authorization" in blob.lower():
        return "See Splunk documentation for this endpoint (role-based)."
    return "See Splunk REST API User Manual (capabilities vary by deployment)."


def lead_summary(section_lines: list[str]) -> str:
    """First sentence after URL fence describing the endpoint."""
    in_fence = False
    saw_fence = False
    candidates: list[str] = []
    for ln in section_lines:
        t = ln.strip()
        if t.startswith("```"):
            in_fence = not in_fence
            if not in_fence:
                saw_fence = True
            continue
        if not saw_fence:
            continue
        if not t or t.startswith("###"):
            continue
        if t.startswith("Authentication"):
            break
        if t.startswith("CODECopy"):
            continue
        if "http" in t and "://" in t:
            continue
        candidates.append(t)
        break
    s = candidates[0] if candidates else "Splunk REST endpoint."
    s = re.sub(r"`+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def curl_example(path: str, method: str = "GET") -> str:
    base = f"https://localhost:8089/services/{path}"
    if method == "GET":
        return f"curl -k -u admin:pass '{base}?output_mode=json'"
    return f"curl -k -u admin:pass -X {method} '{base}'"


def fmt_params(rows: list[tuple[str, str, str, str, str]]) -> str:
    if not rows:
        return "| *(none documented)* | — | — | — | — |\n"
    lines = [
        "| Name | Type | Required | Default | Description |",
        "|------|------|----------|---------|-------------|",
    ]
    for name, typ, req, default, desc in rows:
        lines.append(f"| {name} | {typ} | {req} | {default} | {desc} |")
    return "\n".join(lines) + "\n"


def fmt_returns(rows: list[tuple[str, str, str]], none_note: str | None = None) -> str:
    if none_note:
        return none_note + "\n\n"
    if not rows:
        return "| *(none documented)* | — | — |\n"
    lines = ["| Name | Type | Description |", "|------|------|-------------|"]
    for name, typ, desc in rows:
        lines.append(f"| {name} | {typ} | {desc} |")
    return "\n".join(lines) + "\n"


def parse_method_block(method: str, buf: list[str]) -> dict:
    req_chunk = extract_after_keyword(
        buf,
        "Request parameters",
        stop_on_exact_lines=frozenset({"Returned values"}),
    )
    ret_chunk = extract_after_keyword(
        buf,
        "Returned values",
        stop_on_exact_lines=frozenset(
            {
                "Example request and response",
                "Example requests and responses",
                "XML Request",
                "JSON Request",
            }
        ),
    )

    req_table, req_second, req_prose = extract_tables_from_chunk(req_chunk)
    ret_table, ret_second, ret_prose = extract_tables_from_chunk(ret_chunk)

    param_rows: list[tuple[str, str, str, str, str]] = []
    if req_table and len(req_table) >= 1:
        hdr, *body = req_table
        if body and "---" not in "|".join(hdr):
            param_rows = normalize_param_rows(hdr, [r for r in body if "---" not in "|".join(r)])
    elif req_chunk.strip().lower() == "none":
        param_rows = []
        req_prose = []

    req_prose = [
        p
        for p in req_prose
        if p.strip() and p.strip().lower() not in {"none", "| --- | --- |"}
    ]

    ret_note = None
    ret_rows: list[tuple[str, str, str]] = []
    if ret_chunk.strip().lower().startswith("none"):
        ret_note = "| *(none)* | — | No response body fields documented for this operation. |\n"
    elif ret_table and len(ret_table) >= 1:
        hdr, *body = ret_table
        ret_rows = normalize_return_rows(hdr, [r for r in body if "---" not in "|".join(r)])

    ret_prose = [
        p
        for p in ret_prose
        if p.strip() and p.strip().lower() not in {"none", "| --- | --- |"}
    ]

    return {
        "method": method,
        "param_rows": param_rows,
        "ret_rows": ret_rows,
        "ret_note": ret_note,
        "req_prose": req_prose,
        "ret_prose": ret_prose,
        "raw_req": req_chunk[:4000] if req_chunk else "",
        "raw_ret": ret_chunk[:4000] if ret_chunk else "",
    }


@dataclass
class EndpointDoc:
    path: str
    lines: list[str]

    def capability(self) -> str:
        return extract_capability(self.lines)

    def summary(self) -> str:
        return lead_summary(self.lines)

    def methods(self) -> list[dict]:
        return [parse_method_block(m, b) for m, b in split_methods(self.lines)]


def render_endpoint_section(category: str, path: str, doc: EndpointDoc, path_heading_level: str = "##") -> str:
    """path_heading_level '#' for single-path files, '##' when nested inside a grouped doc."""
    cap = doc.capability()
    summary = doc.summary()
    methods = doc.methods()
    title_line = f"{path_heading_level} /services/{path}"
    parts = [
        title_line,
        "",
        summary,
        "",
        f"**Category:** {category}",
        "",
        "## Endpoint details",
        "| Property | Value |",
        "|----------|-------|",
        f"| URL | `/services/{path}` |",
        "| Auth required | Yes |",
        f"| Capability | `{cap}` |",
        "",
    ]

    if not methods:
        parts.append("## Methods")
        parts.append("")
        parts.append("*See official Splunk REST Reference for supported HTTP methods.*")
        parts.append("")
        return "\n".join(parts)

    for mb in methods:
        meth = mb["method"]
        parts.append(f"## {meth} `/services/{path}`")
        parts.append("")
        parts.append("### Request parameters")
        parts.append("")
        if mb["req_prose"] and not mb["param_rows"]:
            parts.append("\n".join(f"- {p}" for p in mb["req_prose"][:40]))
            parts.append("")
        parts.append(fmt_params(mb["param_rows"]))
        narrative = mb.get("req_prose") or []
        if narrative and mb["param_rows"]:
            parts.append("")
            parts.append("**Additional parameter documentation (Splunk REST reference, verbatim excerpts):**")
            parts.append("")
            parts.append("\n\n".join(narrative))
            parts.append("")
        parts.append("### Returned values")
        parts.append("")
        rp = mb.get("ret_prose") or []
        if mb["ret_note"]:
            parts.append(mb["ret_note"])
        elif mb["ret_rows"]:
            parts.append(fmt_returns(mb["ret_rows"]))
        elif rp:
            parts.append("\n\n".join(rp))
            parts.append("")
        else:
            parts.append(fmt_returns([]))
        if rp and mb["ret_rows"] and not mb["ret_note"]:
            parts.append("")
            parts.append("**Additional returned-field documentation:**")
            parts.append("")
            parts.append("\n\n".join(rp))
            parts.append("")
        parts.append("### Example")
        parts.append("")
        parts.append("```")
        parts.append(curl_example(path, meth))
        parts.append("```")
        parts.append("")
    return "\n".join(parts)


def render_standalone_file(category: str, path: str, doc: EndpointDoc) -> str:
    """Single-path reference file (matches REST reference template)."""
    inner = render_endpoint_section(category, path, doc, path_heading_level="#")
    return inner


def render_group_file(
    category: str,
    title_path: str,
    covered: list[str],
    docs: dict[str, EndpointDoc],
) -> str:
    if len(covered) == 1:
        return render_standalone_file(category, covered[0], docs[covered[0]])
    primary = docs[covered[0]]
    parts = [
        f"# /services/{title_path}",
        "",
        primary.summary(),
        "",
        f"**Category:** {category}",
        "",
        "**Related REST paths in this file:** "
        + ", ".join(f"`/services/{p}`" for p in covered),
        "",
        "",
    ]
    for p in covered:
        parts.append(render_endpoint_section(category, p, docs[p], path_heading_level="##"))
        parts.append("")
    return "\n".join(parts)


def load_docs(path: Path) -> dict[str, EndpointDoc]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    docs = {}
    for title, start, end in split_sections(lines):
        docs[title] = EndpointDoc(title, lines[start:end])
    return docs


INPUT_GROUPS: list[tuple[str, list[str]]] = [
    ("input-data-ingest-rfsdestinations", ["data/ingest/rfsdestinations"]),
    (
        "input-data-ingest-rulesets",
        ["data/ingest/rulesets", "data/ingest/rulesets/{name}", "data/ingest/rulesets/publish"],
    ),
    ("input-data-inputs-ad", ["data/inputs/ad", "data/inputs/ad/{name}"]),
    ("input-data-inputs-all", ["data/inputs/all", "data/inputs/all/{name}"]),
    (
        "input-data-inputs-http",
        [
            "data/inputs/http",
            "data/inputs/http/{name}",
            "data/inputs/http/{name}/disable",
            "data/inputs/http/{name}/enable",
            "data/inputs/http/{name}/rotate",
        ],
    ),
    (
        "input-data-inputs-monitor",
        ["data/inputs/monitor", "data/inputs/monitor/{name}", "data/inputs/monitor/{name}/members"],
    ),
    ("input-data-inputs-oneshot", ["data/inputs/oneshot", "data/inputs/oneshot/{name}"]),
    ("input-data-inputs-registry", ["data/inputs/registry", "data/inputs/registry/{name}"]),
    (
        "input-data-inputs-script",
        ["data/inputs/script", "data/inputs/script/restart", "data/inputs/script/{name}"],
    ),
    (
        "input-data-inputs-tcp-cooked",
        ["data/inputs/tcp/cooked", "data/inputs/tcp/cooked/{name}", "data/inputs/tcp/cooked/{name}/connections"],
    ),
    (
        "input-data-inputs-tcp-raw",
        ["data/inputs/tcp/raw", "data/inputs/tcp/raw/{name}", "data/inputs/tcp/raw/{name}/connections"],
    ),
    (
        "input-data-inputs-tcp-splunktcptoken",
        ["data/inputs/tcp/splunktcptoken", "data/inputs/tcp/splunktcptoken/{name}"],
    ),
    ("input-data-inputs-tcp-ssl", ["data/inputs/tcp/ssl", "data/inputs/tcp/ssl/{name}"]),
    (
        "input-data-inputs-udp",
        ["data/inputs/udp", "data/inputs/udp/{name}", "data/inputs/udp/{name}/connections"],
    ),
    (
        "input-data-inputs-win-event-log-collections",
        ["data/inputs/win-event-log-collections", "data/inputs/win-event-log-collections/{name}"],
    ),
    (
        "input-data-inputs-win-wmi-collections",
        ["data/inputs/win-wmi-collections", "data/inputs/win-wmi-collections/{name}"],
    ),
    ("input-data-inputs-win-perfmon", ["data/inputs/win-perfmon", "data/inputs/win-perfmon/{name}"]),
    ("input-data-modular-inputs", ["data/modular-inputs", "data/modular-inputs/{name}"]),
    ("input-indexing-preview", ["indexing/preview", "indexing/preview/{job_id}"]),
    ("input-receivers-simple", ["receivers/simple"]),
    ("input-receivers-stream", ["receivers/stream"]),
    ("input-server-pipelinesets", ["server/pipelinesets"]),
    (
        "input-services-collector",
        [
            "services/collector",
            "services/collector/ack",
            "services/collector/event",
            "services/collector/event/1.0",
            "services/collector/health",
            "services/collector/health/1.0",
            "services/collector/mint",
            "services/collector/mint/1.0",
            "services/collector/raw",
            "services/collector/raw/1.0",
            "services/collector/s2s",
        ],
    ),
]

OUTPUT_GROUPS: list[tuple[str, list[str]]] = [
    ("output-data-outputs-tcp-default", ["data/outputs/tcp/default", "data/outputs/tcp/default/{name}"]),
    ("output-data-outputs-tcp-group", ["data/outputs/tcp/group", "data/outputs/tcp/group/{name}"]),
    (
        "output-data-outputs-tcp-server",
        [
            "data/outputs/tcp/server",
            "data/outputs/tcp/server/{name}",
            "data/outputs/tcp/server/{name}/allconnections",
        ],
    ),
    ("output-data-outputs-tcp-syslog", ["data/outputs/tcp/syslog", "data/outputs/tcp/syslog/{name}"]),
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-doc", required=True, help="Path to fetched RESTinput txt")
    ap.add_argument("--output-doc", required=True, help="Path to fetched RESToutput txt")
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    indocs = load_docs(Path(args.input_doc))
    outdocs = load_docs(Path(args.output_doc))

    # Splunk REST paths live under /services/ prefix in curl examples
    def write_groups(
        groups: list[tuple[str, list[str]]],
        docs: dict[str, EndpointDoc],
        category: str,
    ) -> int:
        count = 0
        for slug, paths in groups:
            missing = [p for p in paths if p not in docs]
            if missing:
                raise SystemExit(f"Missing doc sections for {slug}: {missing}")
            title_path = paths[0]
            body = render_group_file(category, title_path, paths, docs)
            dest = args.out_dir / f"{slug}.md"
            dest.write_text(body, encoding="utf-8")
            count += len(paths)
        return count

    ic = write_groups(INPUT_GROUPS, indocs, "Input")
    oc = write_groups(OUTPUT_GROUPS, outdocs, "Output")

    print(f"Wrote {len(INPUT_GROUPS)} Input reference files covering {ic} endpoint paths.")
    print(f"Wrote {len(OUTPUT_GROUPS)} Output reference files covering {oc} endpoint paths.")


if __name__ == "__main__":
    main()
