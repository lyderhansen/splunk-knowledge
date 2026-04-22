"""HTTP handlers and server for ds-design wireframe editor."""
from __future__ import annotations

import json
from typing import Optional

from splunk_dashboards.layout import Layout, load_layout, save_layout
from splunk_dashboards.workspace import (
    advance_stage,
    load_state,
    save_state,
    InvalidStageTransition,
)


class StageAdvanceError(Exception):
    pass


def handle_get_layout(project: str) -> tuple[int, str]:
    """Returns (status, body) for GET /api/layout."""
    try:
        layout = load_layout(project)
    except FileNotFoundError:
        layout = Layout(project=project)
    return 200, json.dumps(layout.to_dict())


def handle_post_save(project: str, body: str) -> tuple[int, str]:
    """Returns (status, body) for POST /save."""
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        return 400, f"Invalid JSON: {e}"

    if payload.get("project") != project:
        return 400, f"Payload project '{payload.get('project')}' does not match '{project}'"

    layout = Layout.from_dict(payload)
    save_layout(layout)

    state = load_state(project)
    if state.current_stage != "data-ready":
        raise StageAdvanceError(
            f"Cannot advance to 'designed' from '{state.current_stage}' — expected 'data-ready'"
        )
    try:
        advance_stage(state, "designed")
    except InvalidStageTransition as e:
        raise StageAdvanceError(str(e)) from e
    save_state(state)
    return 200, json.dumps({"status": "saved", "panels": len(layout.panels)})


import sys as _sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

WIREFRAME_HTML = Path(__file__).resolve().parent.parent.parent / "skills" / "ds-design" / "wireframe.html"


def _make_handler(project: str):
    class DesignHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/" or self.path == "/index.html":
                try:
                    html = WIREFRAME_HTML.read_text(encoding="utf-8")
                except FileNotFoundError:
                    self.send_error(500, "wireframe.html not found")
                    return
                self._respond(200, html, content_type="text/html")
                return
            if self.path == "/api/layout":
                status, body = handle_get_layout(project)
                self._respond(status, body, content_type="application/json")
                return
            self.send_error(404)

        def do_POST(self):
            if self.path == "/save":
                length = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(length).decode("utf-8")
                try:
                    status, reply = handle_post_save(project, body)
                except StageAdvanceError as e:
                    self._respond(409, str(e))
                    return
                self._respond(status, reply, content_type="application/json")
                return
            self.send_error(404)

        def _respond(self, status: int, body: str, content_type: str = "text/plain"):
            data = body.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, format, *args):
            return

    return DesignHandler


def create_server(project: str, port: int = 0, host: str = "127.0.0.1") -> HTTPServer:
    return HTTPServer((host, port), _make_handler(project))


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.design")
    sub = parser.add_subparsers(dest="command", required=True)
    launch = sub.add_parser("launch", help="Start the wireframe editor server")
    launch.add_argument("project")
    launch.add_argument("--port", type=int, default=0, help="0 = auto-assign")

    args = parser.parse_args(argv)
    if args.command == "launch":
        server = create_server(args.project, port=args.port)
        host, port = server.server_address
        print(f"ds-design editor: http://{host}:{port}/")
        print("Open the URL in your browser. Click 'Save & Exit' when done to advance state.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nds-design: interrupted")
        finally:
            server.server_close()
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
