#!/usr/bin/env python3
"""Generate knowledge-*.md and kvstore-*.md from WebFetch exports of Splunk REST docs."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

OUT_DIR = Path(__file__).resolve().parent


def read_lines(path: Path) -> List[str]:
    return path.read_text(encoding="utf-8", errors="replace").splitlines()


def strip_heading_suffix(title: str) -> str:
    t = title.strip()
    t = re.sub(r"\s*\(DEPRECATED\)\s*$", "", t, flags=re.I)
    return t.strip()


def is_knowledge_endpoint_h2(line: str) -> bool:
    if not line.startswith("## "):
        return False
    rest = strip_heading_suffix(line[3:])
    nav = {
        "Splunk Enterprise",
        "Splunk Cloud Platform",
        "Splunkbase",
        "Enterprise Security",
        "SOAR",
        "IT Service Intelligence",
        "Content Packs",
        "Splunk Observability Cloud",
        "AppDynamics SaaS",
        "AppDynamics On-Premises",
        "SAP Agent",
        "Developer Documentation",
        "Resources",
        "Usage details",
    }
    if rest in nav:
        return False
    return "/" in rest or rest == "directory"


def is_kv_endpoint_h2(line: str) -> bool:
    if not line.startswith("## "):
        return False
    rest = line[3:].strip()
    nav = {
        "REST API usage details",
        "App KV Store REST API features",
        "Splunk Enterprise",
        "Splunk Cloud Platform",
        "Splunkbase",
        "Enterprise Security",
        "SOAR",
        "IT Service Intelligence",
        "Content Packs",
        "Splunk Observability Cloud",
        "AppDynamics SaaS",
        "AppDynamics On-Premises",
        "SAP Agent",
        "Developer Documentation",
        "Resources",
    }
    if rest in nav:
        return False
    return "/" in rest or rest.startswith("kvstore/")


def find_doc_start(lines: List[str], marker: str) -> int:
    for i, ln in enumerate(lines):
        if marker in ln:
            return i
    return 0


def extract_services_url(section_lines: List[str]) -> Optional[str]:
    for ln in section_lines[:120]:
        m = re.search(r"(/services(?:NS)?[/][^\s`\"]+)", ln)
        if m:
            u = m.group(1).rstrip(")")
            if "splunkcloud.com" in ln and "<deployment-name>" in ln:
                continue
            return u.split("?")[0].rstrip("/")
    return None


def purpose_from_section(section_lines: List[str]) -> str:
    skip = {"CODECopy", "JSONCopy", "XMLCopy", "XML Request", "XML Response", "XML request", "XML response"}
    i = 0
    while i < len(section_lines):
        ln = section_lines[i].strip()
        if (
            ln == ""
            or ln.startswith("https://")
            or ln.startswith("```")
            or ln.startswith("Note:")
            or ln in skip
        ):
            i += 1
            continue
        break
    buf: List[str] = []
    while i < len(section_lines) and len(buf) < 6:
        ln = section_lines[i].strip()
        if ln.startswith("### ") or ln.startswith("## "):
            break
        if ln.startswith("|"):
            break
        if ln in skip:
            i += 1
            continue
        if ln.startswith("Authentication"):
            break
        if ln:
            buf.append(ln)
        i += 1
    text = " ".join(buf)
    text = re.sub(r"`+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return "Splunk REST endpoint."
    if len(text) > 240:
        return text[:237].rstrip() + "..."
    return text


def extract_capability_notes(section_lines: List[str]) -> str:
    caps = []
    blob = "\n".join(section_lines[:200])
    for m in re.finditer(r"`([a-z][a-z0-9_]*)`\s+capability", blob, re.I):
        caps.append(m.group(1))
    if "edit_metric_schema" in blob:
        caps.append("edit_metric_schema")
    if "edit_statsd_transforms" in blob:
        caps.append("edit_statsd_transforms")
    if "edit_global_banner" in blob:
        caps.append("edit_global_banner")
    if caps:
        return ", ".join(sorted(set(caps)))
    if "role-based" in blob.lower():
        return "Role-based (Splunk ACLs)"
    return "Role-based (Splunk REST authorization; entity ACLs)"


def trim_trailing_empty_cells(row: List[str]) -> List[str]:
    r = list(row)
    while r and not str(r[-1]).strip():
        r.pop()
    return r


def parse_tables_after(lines: List[str], start_idx: int) -> Tuple[List[List[str]], int]:
    i = start_idx

    def is_sep_row(line: str) -> bool:
        s = line.strip()
        return s.startswith("|") and "---" in s

    while i < len(lines):
        low_ln = lines[i].strip().lower()
        if lines[i].startswith("### ") or lines[i].startswith("## "):
            break
        if low_ln == "returned values":
            break
        if low_ln.startswith("example ") or low_ln.startswith("xml ") or low_ln.startswith("json"):
            break
        strip = lines[i].strip()
        if strip.startswith("|") and i + 1 < len(lines) and is_sep_row(lines[i + 1]):
            header = [c.strip() for c in strip.strip("|").split("|")]
            rows: List[List[str]] = []
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = trim_trailing_empty_cells(
                    [c.strip() for c in lines[i].strip().strip("|").split("|")]
                )
                while len(row) < len(header):
                    row.append("")
                if len(row) > len(header):
                    row = row[: len(header) - 1] + [" ".join(row[len(header) - 1 :]).strip()]
                rows.append(row)
                i += 1
            return [header] + rows, i
        i += 1
    return [], start_idx


def extract_method_tables(method_body: List[str]) -> Tuple[List[List[str]], List[List[str]]]:
    req_tbl: List[List[str]] = []
    ret_tbl: List[List[str]] = []
    i = 0
    while i < len(method_body):
        low = method_body[i].strip().lower()
        if "request parameters" in low:
            tbl, j = parse_tables_after(method_body, i + 1)
            if tbl:
                req_tbl = tbl
            i = max(i + 1, j)
            continue
        if "returned values" in low:
            tbl, j = parse_tables_after(method_body, i + 1)
            if tbl:
                ret_tbl = tbl
            i = max(i + 1, j)
            continue
        i += 1
    return req_tbl, ret_tbl


def iter_markdown_tables(lines: List[str]) -> List[List[List[str]]]:
    tables: List[List[List[str]]] = []
    i = 0

    def is_sep_row(line: str) -> bool:
        s = line.strip()
        return s.startswith("|") and "---" in s

    while i < len(lines):
        strip = lines[i].strip()
        if strip.startswith("|") and i + 1 < len(lines) and is_sep_row(lines[i + 1]):
            header = [c.strip() for c in strip.strip("|").split("|")]
            rows = []
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = trim_trailing_empty_cells(
                    [c.strip() for c in lines[i].strip().strip("|").split("|")]
                )
                while len(row) < len(header):
                    row.append("")
                if len(row) > len(header):
                    row = row[: len(header) - 1] + [" ".join(row[len(header) - 1 :]).strip()]
                rows.append(row)
                i += 1
            tables.append([header] + rows)
            continue
        i += 1
    return tables


def kvstore_status_return_table() -> List[List[str]]:
    """Fields documented for GET /services/kvstore/status (standalone + SHC)."""
    return [
        ["Name", "Type", "Description"],
        [
            "current.backupRestoreStatus",
            "String",
            "Backup/restore lifecycle: Busy | Failed | Ready | Shutdown.",
        ],
        [
            "current.replicationStatus",
            "String",
            "Standalone: typically KV Store captain. SHC: Startup | KV Store captain | Non-captain KV Store member | Recovering | Initial Sync | Unknown status | Down | Rollback | Removed.",
        ],
        [
            "current.status",
            "String",
            "KV Store lifecycle: unknown | disabled | starting | ready | failed | shuttingdown.",
        ],
        ["current.guid", "String", "Instance GUID for this member."],
        ["current.hostAndPort", "String", "Replication/listening endpoint for KV Store (SHC)."],
        ["current.port", "Number", "Listening port (example excerpt)."],
        ["current.disabled", "Number", "Whether KV Store is disabled on this node (0/1)."],
        ["current.date / dateSec", "String / Number", "Human-readable epoch time pair for status snapshot."],
        ["current.oplogStartTimestamp*", "String / Number", "Operation log start timestamps (when present)."],
        ["current.oplogEndTimestamp*", "String / Number", "Operation log end timestamps (when present)."],
        ["current.replicaSet", "String", "Replica set identifier for the member."],
        ["current.standalone", "Number", "Indicates standalone deployment when 1."],
        ["members.<id>.hostAndPort", "String", "Peer replication endpoint."],
        ["members.<id>.replicationStatus", "String", "Replication role/state for that peer."],
        ["members.<id>.uptime", "Number", "Seconds since peer KV Store reported up."],
        ["members.<id>.configVersion", "Number", "Configuration generation seen on peer."],
        ["members.<id>.electionDate*", "String / Number", "Captain election timing metadata."],
        ["members.<id>.optimeDate*", "String / Number", "Replication optime markers."],
        ["eai:acl", "Object", "Standard Splunk entity ACL metadata on the status entry."],
    ]


def enrich_method_tables(method: str, method_body: List[str]) -> Tuple[List[List[str]], List[List[str]]]:
    req_tbl, ret_tbl = extract_method_tables(method_body)
    blob_low = "\n".join(method_body).lower()
    all_tables = iter_markdown_tables(method_body)

    if method == "GET":
        if "backuprestorestatus" in blob_low:
            req_tbl = [
                ["Name", "Type", "Default", "Description"],
                ["—", "—", "—", "No request parameters documented for this endpoint."],
            ]
            ret_tbl = kvstore_status_return_table()
        else:
            if not req_tbl and ("pagination" in blob_low or "filtering parameters" in blob_low):
                req_tbl = [
                    ["Name", "Type", "Default", "Description"],
                    [
                        "Splunk REST prologue parameters",
                        "Various",
                        "—",
                        "Pagination, filtering, search, count, etc. See Splunk REST API Reference — Pagination and filtering parameters.",
                    ],
                ]
            if not ret_tbl:
                for tbl in all_tables:
                    if not tbl:
                        continue
                    hdr = [h.lower().strip() for h in tbl[0]]
                    if len(hdr) >= 2 and hdr[0] == "name" and hdr[1] == "description" and len(tbl) > 1:
                        ret_tbl = tbl
                        break

    return req_tbl, ret_tbl


def normalize_request_table(table: List[List[str]]) -> str:
    if not table:
        return "| *(none documented)* | — | No | — | — |"
    if len(table) > 1:
        cleaned = []
        for r in table[1:]:
            r2 = trim_trailing_empty_cells(list(r))
            if not any(str(c).strip() for c in r2):
                continue
            cleaned.append(r2)
        table = [table[0]] + cleaned
    hdr = [h.lower().strip() for h in table[0]]
    rows_out: List[Tuple[str, str, str, str, str]] = []

    def infer_required(desc: str, typ: str) -> str:
        d = desc.lower()
        if "required" in d or typ.strip().lower() == "required":
            return "Yes"
        return "No"

    if len(hdr) >= 4 and hdr[0] == "name" and hdr[1] == "type" and hdr[2] == "default":
        for r in table[1:]:
            r = trim_trailing_empty_cells(list(r))
            if len(r) >= 4:
                name, typ, default, desc = r[0], r[1], r[2], r[3]
            elif len(r) == 3:
                name, typ, desc = r[0], r[1], r[2]
                default = "—"
            else:
                continue
            if typ.strip().lower() == "required":
                typ = "String"
            rows_out.append((name, typ, infer_required(desc, typ), default or "—", desc))
    elif len(hdr) >= 3 and hdr[0] == "name" and hdr[1] == "type":
        if hdr[2] == "description":

            def looks_like_default(cell: str) -> bool:
                c = cell.strip().lower()
                if c in ("0", "1", "true", "false"):
                    return True
                return bool(re.match(r"^\-?[\d.]+\s*$", c))

            for r in table[1:]:
                r = list(r)
                while len(r) >= 4 and not str(r[-1]).strip():
                    r.pop()
                if len(r) == 4 and looks_like_default(r[2]):
                    name, typ, default, desc = r[0], r[1], r[2], r[3]
                    if typ.strip().lower() == "required":
                        typ = "String"
                    rows_out.append((name, typ, infer_required(desc, typ), default or "—", desc))
                elif len(r) >= 3:
                    name, typ, desc = r[0], r[1], r[2]
                    extra = " ".join(r[3:]).strip()
                    if extra:
                        desc = (desc + " " + extra).strip()
                    rows_out.append((name, typ, infer_required(desc, typ), "—", desc))
        else:
            for r in table[1:]:
                name, typ, desc = r[0], r[1], r[2]
                rows_out.append((name, typ, infer_required(desc, typ), "—", desc))
    elif len(hdr) >= 2 and hdr[0] == "name" and hdr[1] == "description":
        for r in table[1:]:
            r = list(r) + [""] * (2 - len(r))
            name, desc = r[0], r[1]
            typ_guess = "String"
            if any(x in desc.lower() for x in ("boolean", "true", "false")) and "defaults" in desc.lower():
                typ_guess = "Boolean"
            elif "number" in desc.lower() or "integer" in desc.lower():
                typ_guess = "Number"
            elif "json" in desc.lower():
                typ_guess = "JSON object"
            rows_out.append((name or "—", typ_guess, infer_required(desc, ""), "—", desc))
    else:
        for r in table[1:]:
            padded = (r + ["—"] * 5)[:5]
            rows_out.append((padded[0], padded[1], "No", padded[2], padded[3]))

    lines = [
        "| Name | Type | Required | Default | Description |",
        "|------|------|----------|---------|-------------|",
    ]
    for name, typ, req, default, desc in rows_out:
        d = desc.replace("|", "\\|")
        lines.append(f"| {name} | {typ} | {req} | {default} | {d} |")
    return "\n".join(lines)


def normalize_return_table(table: List[List[str]]) -> str:
    if not table:
        return "| *(none documented)* | — | — |"
    hdr = [h.lower().strip() for h in table[0]]
    lines = [
        "| Name | Type | Description |",
        "|------|------|-------------|",
    ]
    if len(hdr) >= 2 and hdr[0] == "name" and hdr[1] == "description":
        for r in table[1:]:
            name, desc = r[0], r[1]
            typ = "Various"
            if name.startswith("summary."):
                typ = "Number / String"
            elif name.startswith("eai:"):
                typ = "String"
            d = desc.replace("|", "\\|")
            lines.append(f"| {name} | {typ} | {d} |")
    else:
        for r in table[1:]:
            cells = (r + ["Various", ""])[:3]
            d = cells[2].replace("|", "\\|")
            lines.append(f"| {cells[0]} | {cells[1]} | {d} |")
    return "\n".join(lines)


def split_methods(section_lines: List[str]) -> List[Tuple[str, List[str]]]:
    blocks: List[Tuple[str, List[str]]] = []
    cur_method: Optional[str] = None
    cur: List[str] = []
    for ln in section_lines:
        m = re.match(r"^###\s+(GET|POST|DELETE|PUT)\s*$", ln.strip())
        if m:
            if cur_method is not None:
                blocks.append((cur_method, cur))
            cur_method = m.group(1)
            cur = []
            continue
        if cur_method is not None:
            cur.append(ln)
    if cur_method is not None:
        blocks.append((cur_method, cur))
    return blocks


def extract_example_curl(section_lines: List[str], method: str, path_for_curl: str) -> str:
    candidates = []
    for ln in section_lines:
        if "curl " not in ln:
            continue
        if "localhost" not in ln and "8099" not in ln:
            continue
        s = ln.strip().strip("`")
        candidates.append(s)

    def ok(ln: str) -> bool:
        u = ln.upper()
        if method == "DELETE":
            return "-X DELETE" in u or "--REQUEST DELETE" in u
        if method == "POST":
            return "-X POST" in u or " -D '" in ln or " -d " in ln or "-d'" in ln
        if method == "GET":
            return "-X POST" not in u and "-X DELETE" not in u and "--REQUEST DELETE" not in u
        return True

    for ln in candidates:
        if ok(ln):
            return ln
    path = path_for_curl.split("?")[0]
    if method in ("POST", "DELETE", "PUT"):
        return f"curl -k -u admin:pass -X {method} https://localhost:8089{path}"
    return f"curl -k -u admin:pass https://localhost:8089{path}?output_mode=json"


def render_endpoint(category: str, endpoint_title: str, section_lines: List[str]) -> str:
    title_clean = strip_heading_suffix(endpoint_title)
    svc_url = extract_services_url(section_lines)
    if svc_url:
        path_for_doc = svc_url if svc_url.startswith("/services") else "/services/" + title_clean
    else:
        path_for_doc = "/services/" + title_clean.lstrip("/")

    purpose = purpose_from_section(section_lines)
    purpose = re.sub(r"the\{", "the {", purpose)
    cap = extract_capability_notes(section_lines)
    methods = split_methods(section_lines)

    if not methods:
        pseudo = []
        i = 0
        while i < len(section_lines):
            low = section_lines[i].strip().lower()
            if low.startswith("### get"):
                chunk = []
                i += 1
                while i < len(section_lines) and not section_lines[i].startswith("### "):
                    chunk.append(section_lines[i])
                    i += 1
                methods.append(("GET", chunk))
                continue
            if low.startswith("### post"):
                chunk = []
                i += 1
                while i < len(section_lines) and not section_lines[i].startswith("### "):
                    chunk.append(section_lines[i])
                    i += 1
                methods.append(("POST", chunk))
                continue
            if low.startswith("### delete"):
                chunk = []
                i += 1
                while i < len(section_lines) and not section_lines[i].startswith("### "):
                    chunk.append(section_lines[i])
                    i += 1
                methods.append(("DELETE", chunk))
                continue
            i += 1

    if not methods:
        methods = [("GET", [])]

    parts = [
        f"# {path_for_doc}",
        "",
        purpose,
        "",
        f"**Category:** {category}",
        "",
        "## Endpoint details",
        "| Property | Value |",
        "|----------|-------|",
        f"| URL | `{path_for_doc}` |",
        "| Auth required | Yes |",
        f"| Capability | {cap} |",
        "",
    ]

    for method, body in methods:
        parts.append(f"## {method} {path_for_doc}")
        req_tbl, ret_tbl = enrich_method_tables(method, body)
        parts.append("### Request parameters")
        parts.append(normalize_request_table(req_tbl))
        parts.append("")
        parts.append("### Returned values")
        parts.append(normalize_return_table(ret_tbl))
        parts.append("")
        parts.append("### Example")
        parts.append("```")
        parts.append(extract_example_curl(section_lines + body, method, path_for_doc.split("?")[0]))
        parts.append("```")
        parts.append("")

    return "\n".join(parts).rstrip() + "\n"


def split_into_sections(lines: List[str], pred) -> List[Tuple[str, List[str]]]:
    sections: List[Tuple[str, List[str]]] = []
    cur_title: Optional[str] = None
    cur_lines: List[str] = []
    for ln in lines:
        if pred(ln):
            if cur_title is not None:
                sections.append((cur_title, cur_lines))
            cur_title = ln[3:].strip()
            cur_lines = []
            continue
        if cur_title is not None:
            cur_lines.append(ln)
    if cur_title is not None:
        sections.append((cur_title, cur_lines))
    return sections


def pick_section(sections: List[Tuple[str, List[str]]], key: str) -> Optional[Tuple[str, List[str]]]:
    def norm(s: str) -> str:
        return strip_heading_suffix(s)

    nk = norm(key)
    for title, body in sections:
        if norm(title) == nk:
            return title, body
    # summarization tstats
    if "tstats:DM_" in key:
        for title, body in sections:
            if "tstats:DM_" in title:
                return title, body
    if key.startswith("datamodel/acceleration"):
        for title, body in sections:
            t = norm(title)
            if key == "datamodel/acceleration" and t == "datamodel/acceleration":
                return title, body
            if key == "datamodel/acceleration/{name}" and "{name}" in t:
                return title, body
    return None


KNOWLEDGE_GROUPS: List[Tuple[str, List[str]]] = [
    (
        "knowledge-admin-summarization.md",
        [
            "admin/summarization",
            "admin/summarization/tstats:DM_{app}_{data_model_ID}",
        ],
    ),
    ("knowledge-data-lookup-table-files.md", ["data/lookup-table-files", "data/lookup-table-files/{name}"]),
    ("knowledge-data-props-calcfields.md", ["data/props/calcfields", "data/props/calcfields/{name}"]),
    ("knowledge-data-props-extractions.md", ["data/props/extractions", "data/props/extractions/{name}"]),
    ("knowledge-data-props-fieldaliases.md", ["data/props/fieldaliases", "data/props/fieldaliases/{name}"]),
    ("knowledge-data-props-lookups.md", ["data/props/lookups", "data/props/lookups/{name}"]),
    ("knowledge-data-props-sourcetype-rename.md", ["data/props/sourcetype-rename", "data/props/sourcetype-rename/{name}"]),
    ("knowledge-data-transforms-extractions.md", ["data/transforms/extractions", "data/transforms/extractions/{name}"]),
    ("knowledge-data-transforms-lookups.md", ["data/transforms/lookups", "data/transforms/lookups/{name}"]),
    ("knowledge-data-transforms-metric-schema.md", ["data/transforms/metric-schema"]),
    ("knowledge-data-transforms-statsdextractions.md", ["data/transforms/statsdextractions"]),
    (
        "knowledge-data-ui.md",
        [
            "data/ui/global-banner",
            "data/ui/panels",
            "data/ui/views",
            "data/ui/views/{name}",
            "data/ui/views/{name}/history",
            "data/ui/views/{name}/revision",
        ],
    ),
    (
        "knowledge-datamodel.md",
        [
            "datamodel/acceleration",
            "datamodel/acceleration/{name}",
            "datamodel/model",
            "datamodel/pivot",
        ],
    ),
    ("knowledge-directory.md", ["directory", "directory/{name}"]),
    ("knowledge-saved-bookmarks-monitoring-console.md", ["saved/bookmarks/monitoring_console"]),
    ("knowledge-saved-eventtypes.md", ["saved/eventtypes", "saved/eventtypes/{name}"]),
    (
        "knowledge-search-fields-tags.md",
        [
            "search/fields",
            "search/fields/{field_name}",
            "search/fields/{field_name}/tags",
            "search/tags",
            "search/tags/{tag_name}",
        ],
    ),
]

KV_GROUPS: List[Tuple[str, List[str]]] = [
    (
        "kvstore-admin.md",
        [
            "kvstore/backup/create",
            "kvstore/backup/restore",
            "kvstore/control/maintenance",
            "kvstore/status",
        ],
    ),
    (
        "kvstore-shcluster-kvmigrate.md",
        [
            "shcluster/captain/kvmigrate/start",
            "shcluster/captain/kvmigrate/status",
            "shcluster/captain/kvmigrate/stop",
        ],
    ),
    ("kvstore-collections-config.md", ["storage/collections/config", "storage/collections/config/{collection}"]),
    (
        "kvstore-collections-data.md",
        [
            "storage/collections/data/{collection}",
            "storage/collections/data/{collection}/{key}",
            "storage/collections/data/{collection}/batch_find",
            "storage/collections/data/{collection}/batch_save",
        ],
    ),
]


def write_bundle(fname: str, chunks: List[str]) -> None:
    doc = []
    for i, ch in enumerate(chunks):
        doc.append(ch)
        if i < len(chunks) - 1:
            doc.append("\n---\n\n")
    (OUT_DIR / fname).write_text("".join(doc), encoding="utf-8")


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: _generate_knowledge_kvstore_rest.py KNOWLEDGE.txt KV.txt", file=sys.stderr)
        return 2
    k_lines = read_lines(Path(sys.argv[1]))
    v_lines = read_lines(Path(sys.argv[2]))

    k_start = find_doc_start(k_lines, "# Knowledge endpoint descriptions")
    k_sections = split_into_sections(k_lines[k_start:], is_knowledge_endpoint_h2)

    v_start = find_doc_start(v_lines, "# KV store endpoint descriptions")
    v_sections = split_into_sections(v_lines[v_start:], is_kv_endpoint_h2)

    for fname, keys in KNOWLEDGE_GROUPS:
        chunks = []
        for key in keys:
            hit = pick_section(k_sections, key)
            if not hit:
                print(f"WARN knowledge missing: {key}", file=sys.stderr)
                continue
            title, body = hit
            chunks.append(render_endpoint("Knowledge", title, body))
        write_bundle(fname, chunks)

    for fname, keys in KV_GROUPS:
        chunks = []
        for key in keys:
            hit = pick_section(v_sections, key)
            if not hit:
                print(f"WARN kv missing: {key}", file=sys.stderr)
                continue
            title, body = hit
            chunks.append(render_endpoint("KV Store", title, body))
        write_bundle(fname, chunks)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
