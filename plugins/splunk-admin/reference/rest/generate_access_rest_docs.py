#!/usr/bin/env python3
"""Generate access-*.md REST reference files from Splunk help extract."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent
SRC = ROOT / "_source-rest-access.txt"


def split_sections(text: str) -> dict[str, str]:
    parts = re.split(r"^## (.+)$", text, flags=re.MULTILINE)
    out: dict[str, str] = {}
    for i in range(1, len(parts), 2):
        title = parts[i].strip().rstrip("/").strip()
        body = parts[i + 1] if i + 1 < len(parts) else ""
        out[title] = body
    return out


def parse_table_lines(lines: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in lines:
        s = line.strip()
        if not s.startswith("|"):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 1:
            continue
        if all(re.fullmatch(r"-+", c.replace(" ", "")) for c in cells):
            continue
        rows.append(cells)
    return rows


def drop_duplicate_header_rows(rows: list[list[str]]) -> list[list[str]]:
    out: list[list[str]] = []
    for r in rows:
        if (
            len(r) >= 2
            and r[0].strip().lower() == "name"
            and r[1].strip().lower() in ("type", "description")
        ):
            continue
        if len(r) >= 1 and r[0].strip().lower() == "description" and len(r) == 1:
            continue
        out.append(r)
    return out


def extract_first_paragraph(body: str) -> str:
    """Skip CODE/json boilerplate; return first meaningful sentence."""
    lines = body.strip().split("\n")
    buf: list[str] = []
    for line in lines:
        s = line.strip()
        if not s:
            if buf:
                break
            continue
        if s.startswith("```") or s.startswith("CODE") or s.startswith("JSON") or s.startswith("XML"):
            continue
        if s.startswith("http") and "://" in s:
            continue
        if s.startswith("###"):
            break
        if s.startswith("Authentication and"):
            break
        buf.append(s)
        if len(" ".join(buf)) > 400:
            break
    text = " ".join(buf).strip()
    text = re.sub(r"\s+", " ", text)
    if not text:
        return "See Splunk REST API Access Control reference."
    if text[-1] not in ".!?":
        text += "."
    return text[:500]


def extract_capability(body: str) -> str | None:
    # OAuth provider composite (appears before methods)
    lo = re.search(r"Requires the`([^`]+)` capability for GET operations", body)
    eo = re.search(r"Requires the`([^`]+)` for POST and DELETE operations", body)
    if lo and eo:
        return f"{lo.group(1).strip()} (GET); {eo.group(1).strip()} (POST/DELETE)"
    for pat in (
        r"Requires the`([^`]+)` capability(?: for access)?\.?",
        r"Requires`([^`]+)` capability for all operations",
    ):
        m = re.search(pat, body, re.DOTALL)
        if m:
            return m.group(1).strip()
    # storage/passwords style
    m = re.search(
        r"The`([^`]+)` capability is required for the GET operation\. "
        r"The`([^`]+)` capability is required for the POST operation",
        body,
    )
    if m:
        return f"{m.group(1)} (GET), {m.group(2)} (POST)"
    m = re.search(r"This is a public endpoint", body)
    if m:
        return "None (public endpoint; validates JWT in request)"
    return None


def method_chunks(body: str) -> list[tuple[str, str]]:
    pat = re.compile(r"^###\s+(GET|POST|DELETE|PUT)\s*$", re.MULTILINE)
    ms = list(pat.finditer(body))
    out: list[tuple[str, str]] = []
    for i, m in enumerate(ms):
        start = m.end()
        end = ms[i + 1].start() if i + 1 < len(ms) else len(body)
        out.append((m.group(1), body[start:end]))
    order = {"GET": 0, "POST": 1, "PUT": 2, "DELETE": 3}
    out.sort(key=lambda x: order.get(x[0], 9))
    return out


def strip_noise(chunk: str) -> str:
    chunk = re.sub(r"^\[Expand\]\s*", "", chunk, flags=re.MULTILINE)
    return chunk


def extract_block_after_keyword(chunk: str, kw: str) -> str | None:
    chunk = strip_noise(chunk)
    i = chunk.find(kw)
    if i < 0:
        return None
    return chunk[i + len(kw) :]


def parse_request_or_response(block: str | None) -> tuple[str, list[list[str]]]:
    """Returns ('none'|'pagination'|'table'|'text', rows or [])."""
    if block is None:
        return "empty", []
    block = block.lstrip()
    lines = block.split("\n")
    # Skip blank lines
    while lines and not lines[0].strip():
        lines.pop(0)
    if not lines:
        return "empty", []
    first = lines[0].strip()
    if first.lower() in ("none", "none.", "none"):
        return "none", []
    if first.startswith("[Pagination"):
        return "pagination", [[first]]
    # Walk until table
    for idx, line in enumerate(lines):
        sl = line.strip()
        if sl.startswith("###") or sl.startswith("Example"):
            break
        if sl.lower().startswith("example request"):
            break
        if sl.startswith("|"):
            tbl_lines: list[str] = []
            for j in range(idx, len(lines)):
                lj = lines[j].strip()
                if lj.startswith("|"):
                    tbl_lines.append(lines[j])
                elif tbl_lines:
                    break
            rows = drop_duplicate_header_rows(parse_table_lines(tbl_lines))
            # OAuth-style "| Name | / --- / None |" means no parameters
            if rows == [["Name"], ["None"]] or (
                len(rows) == 1 and len(rows[0]) == 1 and rows[0][0].lower() == "none"
            ):
                return "none", []
            return "table", rows
    # trailing description without table (stop before examples / next heading)
    prose_lines: list[str] = []
    for line in lines:
        sl = line.strip()
        if sl.startswith("###") or sl.startswith("Example") or sl.lower().startswith("example request"):
            break
        if sl.startswith("|"):
            break
        prose_lines.append(line)
    prose = "\n".join(prose_lines[:30]).strip()
    if prose:
        return "text", [[prose]]
    return "empty", []


def service_path(title: str) -> str:
    t = title.strip().rstrip("/")
    if t.startswith("oauth2/"):
        return "/" + t
    return "/services/" + t


def fmt_cap(cap: str | None, fallback: str) -> str:
    return cap if cap else fallback


def infer_required(name: str, desc: str) -> str:
    d = desc.strip()
    dl = d.lower()
    if name.strip() == "passcode" and "rsa" in dl:
        return "Conditional"
    if d.startswith("Required.") or d.startswith("Required "):
        return "Yes"
    if dl.startswith("optional."):
        return "No"
    return "No"


def expand_request_table(rows: list[list[str]]) -> list[list[str]]:
    """Normalize to Name | Type | Required | Default | Description."""
    out: list[list[str]] = []
    for row in rows:
        if row == ["_note"] or (len(row) == 1 and row[0].startswith("[Pagination")):
            out.append([row[0], "—", "No", "—", "Splunk REST pagination and filtering parameters apply (REST API reference prolog)."])
            continue
        if len(row) >= 5:
            out.append(row[:5])
        elif len(row) == 3:
            name, typ, desc = row
            req = infer_required(name, desc)
            out.append([name, typ, req, "—", desc])
        elif len(row) == 2:
            name, desc = row
            req = infer_required(name, desc)
            out.append([name, "String", req, "—", desc])
        elif len(row) == 1:
            out.append([row[0], "—", "No", "—", "—"])
        else:
            out.append(row + ["—"] * (5 - len(row)))
    return out


def expand_return_table(rows: list[list[str]]) -> list[list[str]]:
    out: list[list[str]] = []
    for row in rows:
        if len(row) >= 3:
            out.append(row[:3])
        elif len(row) == 2:
            out.append([row[0], "String", row[1]])
        elif len(row) == 1:
            out.append(["(response)", "—", row[0]])
        else:
            out.append(row)
    return out


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "|" + "|".join(["---"] * len(headers)) + "|",
    ]
    for r in rows:
        padded = list(r) + ["—"] * (len(headers) - len(r))
        padded = padded[: len(headers)]
        lines.append("| " + " | ".join(padded) + " |")
    return "\n".join(lines)


def extract_example_curl(mchunk: str) -> str | None:
    idx = 0
    while True:
        s = mchunk.find("```", idx)
        if s < 0:
            return None
        e = mchunk.find("```", s + 3)
        if e < 0:
            return None
        inner = mchunk[s + 3 : e].strip()
        lines = inner.split("\n")
        if lines and lines[0] in ("bash", "sh", "xml", "JSON"):
            inner = "\n".join(lines[1:]).strip()
        if inner.startswith("curl"):
            return inner
        idx = e + 3


def render_method(service_url: str, method: str, mchunk: str) -> str:
    lines_out: list[str] = [f"## {method} {service_url}", ""]
    rb = extract_block_after_keyword(mchunk, "Request parameters")
    kind, rows = parse_request_or_response(rb or "")
    lines_out.append("### Request parameters")
    lines_out.append("")
    if kind == "none":
        lines_out.append("No request parameters.")
    elif kind == "pagination":
        lines_out.append(rows[0][0])
        lines_out.append("")
        lines_out.append(md_table(["Name", "Type", "Required", "Default", "Description"], expand_request_table(rows)))
    elif kind == "table" and rows:
        lines_out.append(md_table(["Name", "Type", "Required", "Default", "Description"], expand_request_table(rows)))
    elif kind == "text" and rows:
        lines_out.append(rows[0][0])
    else:
        lines_out.append("See Splunk documentation for this operation.")
    lines_out.append("")
    # Returned / Response
    for label in ("Returned values", "Response keys", "Response data keys"):
        bb = extract_block_after_keyword(mchunk, label)
        if bb is not None:
            kind2, rows2 = parse_request_or_response(bb)
            lines_out.append(f"### {label.replace('Response data keys', 'Returned values')}")
            lines_out.append("")
            if kind2 == "none":
                lines_out.append("No returned fields in the documentation.")
            elif kind2 == "table" and rows2:
                lines_out.append(md_table(["Name", "Type", "Description"], expand_return_table(rows2)))
            elif kind2 == "text" and rows2:
                lines_out.append(rows2[0][0])
            else:
                lines_out.append("See Splunk documentation.")
            lines_out.append("")
            break
    curl = extract_example_curl(mchunk)
    if not curl and method == "GET":
        curl = f"curl -k -u admin:pass https://localhost:8089{service_url}?output_mode=json"
    if curl:
        lines_out.append("### Example")
        lines_out.append("")
        lines_out.append("```")
        lines_out.append(curl)
        lines_out.append("```")
        lines_out.append("")
    return "\n".join(lines_out)


def auth_required_for(title: str, cap: str | None, fb: str) -> str:
    if "oauth2/v1/token" in title:
        return "No"
    if title.strip("/") == "auth/login":
        return "No (supply credentials via POST body; examples may show HTTP Basic)"
    return "Yes"


def render_endpoint(title: str, body: str, cap_fallback: str) -> str:
    svc = service_path(title)
    purpose = extract_first_paragraph(body)
    cap = extract_capability(body)
    auth = auth_required_for(title, cap, cap_fallback)
    lines: list[str] = [
        f"# {svc}",
        "",
        purpose,
        "",
        "**Category:** Access control",
        "",
        "## Endpoint details",
        "",
        "| Property | Value |",
        "|----------|-------|",
        f"| URL | `{svc}` |",
        f"| Auth required | {auth} |",
        f"| Capability | `{fmt_cap(cap, cap_fallback)}` |",
        "",
    ]
    chunks = method_chunks(body)
    if not chunks:
        lines.append("_No HTTP methods documented in extract._")
        lines.append("")
        return "\n".join(lines)
    for meth, ch in chunks:
        lines.append(render_method(svc, meth, ch))
    return "\n".join(lines)


GROUPS: dict[str, list[str]] = {
    "access-duo-mfa.md": ["admin/Duo-MFA", "admin/Duo-MFA/{name}"],
    "access-rsa-mfa.md": [
        "__RSA_USAGE__",
        "admin/Rsa-MFA",
        "admin/Rsa-MFA-config-verify",
    ],
    "access-ldap.md": [
        "__LDAP_USAGE__",
        "admin/LDAP-groups",
        "authentication/providers/LDAP",
        "authentication/providers/LDAP/{LDAP_strategy_name}",
        "authentication/providers/LDAP/{LDAP_strategy_name}/enable",
        "authentication/providers/LDAP/{LDAP_strategy_name}/disable",
    ],
    "access-oauth2.md": [
        "authentication/providers/oauth2",
        "authentication/providers/oauth2/{name}",
        "admin/metrics-reload/_reload",
        "admin/oauth2-groups",
        "oauth2/v1/token",
    ],
    "access-proxysso.md": [
        "__PROXY_USAGE__",
        "admin/ProxySSO-auth",
        "admin/ProxySSO-auth/{proxy_name}",
        "admin/ProxySSO-auth/{proxy_name}/disable",
        "admin/ProxySSO-auth/{proxy_name}/enable",
        "admin/ProxySSO-groups",
        "admin/ProxySSO-groups/{group_name}",
        "admin/ProxySSO-user-role-map",
        "admin/ProxySSO-user-role-map/{user_name}",
    ],
    "access-saml.md": [
        "__SAML_USAGE__",
        "admin/replicate-SAML-certs",
        "admin/SAML-groups",
        "admin/SAML-groups/{group_name}",
        "admin/SAML-idp-metadata",
        "admin/SAML-sp-metadata",
        "admin/SAML-user-role-map",
        "admin/SAML-user-role-map/{name}",
        "authentication/providers/SAML",
        "authentication/providers/SAML/{stanza_name}",
        "authentication/providers/SAML/{stanza_name}/enable",
        "authentication/providers/SAML/{stanza_name}/disable",
    ],
    "access-auth-login.md": ["auth/login"],
    "access-current-context.md": ["authentication/current-context"],
    "access-httpauth-tokens.md": ["authentication/httpauth-tokens", "authentication/httpauth-tokens/{name}"],
    "access-authentication-users.md": ["authentication/users", "authentication/users/{name}"],
    "access-authorization-capabilities.md": ["authorization/capabilities"],
    "access-authorization-fieldfilters.md": ["authorization/fieldfilters", "authorization/fieldfilters/{name}"],
    "access-authorization-grantable-capabilities.md": ["authorization/grantable_capabilities"],
    "access-authorization-roles.md": ["authorization/roles", "authorization/roles/{name}"],
    "access-authorization-tokens.md": ["authorization/tokens", "authorization/tokens/{name}"],
    "access-storage-passwords.md": ["storage/passwords", "storage/passwords/{name}"],
}

USAGE_KEYS = {
    "__RSA_USAGE__": "RSA multifactor authentication REST API usage details",
    "__LDAP_USAGE__": "LDAP REST API usage details",
    "__PROXY_USAGE__": "ProxySSO REST API usage details",
    "__SAML_USAGE__": "SAML REST API usage details",
}


def main() -> None:
    text = SRC.read_text(encoding="utf-8", errors="replace")
    all_sec = split_sections(text)
    for fname, keys in GROUPS.items():
        parts: list[str] = []
        for key in keys:
            if key in USAGE_KEYS:
                uk = USAGE_KEYS[key]
                intro = all_sec.get(uk, "").strip()
                if intro:
                    intro = re.sub(r"\s+", " ", intro.split("\n")[0])
                    parts.append(f"> **Overview:** {intro}\n")
                continue
            body = all_sec.get(key)
            if body is None:
                parts.append(f"\n## Missing section `{key}`\n")
                continue
            cap_fb = "See Splunk Access Control REST reference"
            if "oauth2/v1/token" in key:
                cap_fb = "None (public JWT exchange)"
            if key == "auth/login":
                cap_fb = "Authenticated session (establish with username/password[/passcode])"
            if key.startswith("authentication/providers/oauth2"):
                cap_fb = "list_oauth_configs (GET); edit_oauth_configs (POST/DELETE)"
            if key.startswith("admin/Rsa-MFA"):
                cap_fb = "change_authentication"
            parts.append(render_endpoint(key, body, cap_fb))
            parts.append("\n---\n")
        out = ROOT / fname
        out.write_text("\n".join(parts).strip() + "\n", encoding="utf-8")
        print("Wrote", fname)


if __name__ == "__main__":
    main()
