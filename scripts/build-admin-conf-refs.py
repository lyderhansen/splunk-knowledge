#!/usr/bin/env python3
"""Generate markdown reference tables from Splunk docs markdown extracts."""

from __future__ import annotations

import re
from pathlib import Path
from typing import List, Tuple


def slice_spec_chunk(text: str, start_needle: str, end_needle: str) -> str:
    i = text.find(start_needle)
    j = text.find(end_needle)
    if i == -1 or j == -1 or j <= i:
        raise ValueError(f"markers not found: {start_needle!r}, {end_needle!r}")
    return text[i:j]


def first_fence(body: str) -> str:
    parts = body.split("```")
    if len(parts) < 3:
        return ""
    return parts[1].lstrip("\n").rstrip("\n")


def is_probable_setting_line(line: str) -> bool:
    s = line.strip()
    if not s or s.startswith("#") or s.startswith("*"):
        return False
    if "=" not in s:
        return False
    left = s.split("=", 1)[0].strip()
    if not left:
        return False
    # Spec placeholders like "<Splunk RoleName>" contain spaces; still settings.
    if "<" not in left and " " in left:
        return False
    return True


def iter_setting_entries(lines: List[str]) -> List[Tuple[str, str, str]]:
    rows: List[Tuple[str, str, str]] = []
    i = 0
    n = len(lines)
    while i < n:
        raw = lines[i].rstrip("\n")
        if not is_probable_setting_line(raw):
            i += 1
            continue
        name, _, rest = raw.partition("=")
        name = name.strip()
        rhs = rest.strip()
        desc_lines: List[str] = []
        i += 1
        while i < n:
            nxt = lines[i].rstrip("\n")
            stripped = nxt.strip()
            if not stripped:
                break
            if stripped.startswith("*"):
                desc_lines.append(stripped.lstrip("*").strip())
                i += 1
                continue
            if is_probable_setting_line(nxt) and not nxt.startswith(" ") and not nxt.startswith("\t"):
                break
            if stripped:
                desc_lines.append(stripped)
            i += 1
        desc = " ".join(desc_lines)
        if len(desc) > 480:
            desc = desc[:477] + "..."
        rows.append((name, rhs, desc))
    return rows


def md_escape_cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ")


def split_markdown_sections(chunk: str) -> List[Tuple[str, str]]:
    parts = re.split(r"(?m)^##\s+(.+?)\s*$", chunk)
    out: List[Tuple[str, str]] = []
    if len(parts) < 3:
        return out
    preamble, rest = parts[0], parts[1:]
    for k in range(0, len(rest), 2):
        title = rest[k].strip()
        body = rest[k + 1] if k + 1 < len(rest) else ""
        out.append((title, body))
    return out


def render_stanza_md(stanza: str, body: str) -> str:
    fence = first_fence(body)
    lines = fence.splitlines() if fence else []
    entries = iter_setting_entries(lines)
    chunks = [f"### `{stanza}`\n"]
    chunks.append(
        "| Setting | Type | Default | Description |\n"
        "|---------|------|---------|-------------|\n"
    )
    if entries:
        for name, rhs, desc in entries:
            chunks.append(
                f"| `{md_escape_cell(name)}` | `{md_escape_cell(rhs)}` | — | "
                f"{md_escape_cell(desc) if desc else '—'} |\n"
            )
    elif fence.strip():
        summary = " ".join(
            ln.strip().lstrip("*").strip()
            for ln in fence.splitlines()
            if ln.strip().startswith("*")
        )
        if len(summary) > 420:
            summary = summary[:417] + "..."
        cell = md_escape_cell(summary) if summary else md_escape_cell(fence.strip())[:400]
        chunks.append(f"| *(stanza note)* | — | — | {cell} |\n")
    else:
        chunks.append("| *(none)* | — | — | See Splunk documentation section body (no fenced spec excerpt). |\n")
    chunks.append("\n")
    return "".join(chunks)


def render_authorize_style(chunk: str) -> str:
    buf: List[str] = []
    for title, body in split_markdown_sections(chunk):
        if not title.startswith("[") or title.endswith(".spec"):
            continue
        buf.append(render_stanza_md(title.strip(), body))
    return "".join(buf)


def render_merge_fenced_stanzas(chunk: str) -> str:
    bodies: List[str] = []
    parts = chunk.split("```")
    for k in range(1, len(parts), 2):
        bodies.append(parts[k].lstrip("\n").rstrip("\n"))
    mega = "\n\n".join(bodies)
    stanzas: List[Tuple[str, List[str]]] = []
    cur: str | None = None
    buf: List[str] = []
    # Splunk stanza headers never contain whitespace inside brackets (spec prose sometimes uses "[ Foo ]").
    stanza_re = re.compile(r"^\[[^\]\s]+\]\s*$")

    def flush() -> None:
        nonlocal cur, buf
        if cur is not None:
            stanzas.append((cur, buf))
        buf = []

    for line in mega.splitlines():
        s = line.strip()
        if stanza_re.match(s):
            flush()
            cur = s
            buf = []
            continue
        if cur is None:
            continue
        buf.append(line)
    flush()

    out: List[str] = []
    for stanza, body_lines in stanzas:
        entries = iter_setting_entries(body_lines)
        out.append(f"### `{stanza}`\n")
        out.append(
            "| Setting | Type | Default | Description |\n"
            "|---------|------|---------|-------------|\n"
        )
        if not entries:
            out.append(
                "| *(none)* | — | — | No discrete settings; stanza defines behavior only in merged spec text. |\n"
            )
        else:
            for name, rhs, desc in entries:
                out.append(
                    f"| `{md_escape_cell(name)}` | `{md_escape_cell(rhs)}` | — | "
                    f"{md_escape_cell(desc) if desc else '—'} |\n"
                )
        out.append("\n")
    return "".join(out)


def build_header(meta: dict) -> str:
    return (
        f"# {meta['filename']}\n\n"
        f"{meta['blurb']}\n\n"
        f"**Source version:** Splunk Enterprise 10.2\n\n"
        f"## File details\n\n"
        f"| Property | Value |\n"
        f"|----------|-------|\n"
        f"| Location | {meta['location']} |\n"
        f"| Pipeline phase | N/A |\n"
        f"| Restart required | {meta['restart']} |\n"
        f"| Related files | {meta['related']} |\n\n"
        f"## Stanzas and settings\n\n"
    )


METAS = {
    "authentication": {
        "filename": "authentication.conf",
        "mode": "merge_fence",
        "blurb": (
            "Possible settings and values for Splunk authentication via Splunk-native, LDAP, scripted, SAML, "
            "Proxy SSO, multifactor (Duo/RSA), OAuth2, SCIM domains, and secret storage integration."
        ),
        "location": "`$SPLUNK_HOME/etc/system/local/` (plus provider-specific stanzas)",
        "restart": "Yes",
        "related": "authorize.conf, server.conf",
        "start": "## authentication.conf.spec",
        "end": "## authentication.conf.example",
    },
    "authorize": {
        "filename": "authorize.conf",
        "mode": "section_headers",
        "blurb": (
            "Defines Splunk roles, inherited capabilities, search/index quotas, token auth defaults, and documents "
            "each built-in capability stanza."
        ),
        "location": "`$SPLUNK_HOME/etc/system/local/` (or app context)",
        "restart": "Yes",
        "related": "authentication.conf",
        "start": "## authorize.conf.spec",
        "end": "## authorize.conf.example",
    },
    "web": {
        "filename": "web.conf",
        "mode": "merge_fence",
        "blurb": (
            "Attributes for Splunk Web: HTTP/HTTPS listeners, SSL, sessions, SSO headers, dashboard/HTML security, "
            "CherryPy tuning, proxy/CORS, branding, and REST endpoint exposure."
        ),
        "location": "`$SPLUNK_HOME/etc/system/local/` (defaults under `$SPLUNK_HOME/etc/system/default/`)",
        "restart": "Yes",
        "related": "server.conf, web-features.conf",
        "start": "## web.conf.spec",
        "end": "## web.conf.example",
    },
}


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    mapping = [
        (root / "_doc_authentication.txt", "authentication", root / "plugins/splunk-admin/reference/conf/authentication.md"),
        (root / "_doc_authorize.txt", "authorize", root / "plugins/splunk-admin/reference/conf/authorize.md"),
        (root / "_doc_web.txt", "web", root / "plugins/splunk-admin/reference/conf/web.md"),
    ]
    for src, key, dst in mapping:
        meta = METAS[key]
        text = src.read_text(encoding="utf-8")
        chunk = slice_spec_chunk(text, meta["start"], meta["end"])
        if meta["mode"] == "merge_fence":
            body = render_merge_fenced_stanzas(chunk)
        else:
            body = render_authorize_style(chunk)
        dst.write_text(build_header(meta) + body, encoding="utf-8")
        print(f"wrote {dst} ({len(dst.read_text(encoding='utf-8').splitlines())} lines)")


if __name__ == "__main__":
    main()
