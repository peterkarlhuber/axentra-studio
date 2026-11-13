"""Web process of the QA kit: one local origin for Studio, the Axentra API and the kit page.

- ``/v1/...``: the Axentra ASGI app (``axentra.api.app.create_app``), unchanged.
- ``/qa/...``: the kit page (test users, integration status, captured mails, the interactive checklist).
- everything else: Studio's static build with the security headers of Studio's Docker image
  (``docker/40-axentra-studio.sh``) and the single-page fallback to ``index.html``.

Binds to 127.0.0.1 only. Requests whose Host is not this origin are refused (DNS rebinding), and the only writing
kit endpoint accepts JSON from this origin only.
"""

from __future__ import annotations

import argparse
import email
import email.policy
import json
import os
import re
from pathlib import Path

import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import FileResponse, JSONResponse, PlainTextResponse, RedirectResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

HERE = Path(__file__).resolve().parent

STUDIO_CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
    "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; "
    "frame-ancestors 'none'"
)
SECURITY_HEADERS = {
    "Content-Security-Policy": STUDIO_CSP,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
}
# A captured HTML mail is shown as an inert document: no scripts, no network, no forms.
MAIL_HTML_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox"
MAIL_ID = re.compile(r"^[0-9]{10,25}$")


def build(config: Path, port: int, studio: Path, state: Path, kit: Path, results: Path):
    from axentra.api.app import create_app
    from axentra.config.settings import load_settings

    api = create_app(load_settings(str(config)))
    origin_hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}
    origin = f"http://127.0.0.1:{port}"
    mails = state / "mails"

    def read_json(path: Path, default):
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return default

    async def ping(_: Request) -> Response:
        return PlainTextResponse("ok")

    async def info(_: Request) -> Response:
        return JSONResponse(
            {
                "build": read_json(kit / "BUILD-INFO.json", {}),
                "users": read_json(state / "testbenutzer.json", []),
                "integrations": read_json(HERE / "integrations.json", []),
                "origin": origin,
            }
        )

    def parse(path: Path):
        return email.message_from_bytes(path.read_bytes(), policy=email.policy.default)

    async def mail_list(_: Request) -> Response:
        items = []
        if mails.is_dir():
            for path in sorted(mails.glob("*.eml"), reverse=True)[:500]:
                msg = parse(path)
                items.append(
                    {
                        "id": path.stem,
                        "date": str(msg.get("Date", "")),
                        "from": str(msg.get("From", "")),
                        "to": str(msg.get("To", "") or msg.get("X-QA-Envelope-To", "")),
                        "subject": str(msg.get("Subject", "")),
                    }
                )
        return JSONResponse(items)

    def mail_file(request: Request) -> Path | None:
        mail_id = request.path_params["mail_id"]
        if not MAIL_ID.match(mail_id):
            return None
        path = mails / f"{mail_id}.eml"
        return path if path.is_file() else None

    async def mail_detail(request: Request) -> Response:
        path = mail_file(request)
        if path is None:
            return JSONResponse({"error": "not found"}, status_code=404)
        msg = parse(path)
        text = msg.get_body(preferencelist=("plain",))
        html = msg.get_body(preferencelist=("html",))
        return JSONResponse(
            {
                "id": path.stem,
                "headers": {k: str(v) for k, v in msg.items() if not k.startswith("X-QA-")},
                "text": text.get_content() if text is not None else "",
                "has_html": html is not None,
            }
        )

    async def mail_html(request: Request) -> Response:
        path = mail_file(request)
        html = parse(path).get_body(preferencelist=("html",)) if path else None
        if html is None:
            return PlainTextResponse("not found", status_code=404)
        return Response(
            html.get_content(),
            media_type="text/html; charset=utf-8",
            headers={"Content-Security-Policy": MAIL_HTML_CSP},
        )

    async def checklist(_: Request) -> Response:
        return JSONResponse(read_json(HERE / "checkliste.json", {"sections": []}))

    results_file = results / "ergebnisse.json"

    async def get_results(_: Request) -> Response:
        return JSONResponse(read_json(results_file, {}))

    async def put_results(request: Request) -> Response:
        if (
            request.headers.get("origin") != origin
            or request.headers.get("content-type", "").split(";")[0] != "application/json"
        ):
            return JSONResponse({"error": "forbidden"}, status_code=403)
        body = await request.body()
        if len(body) > 2_000_000:
            return JSONResponse({"error": "too large"}, status_code=413)
        try:
            data = json.loads(body)
        except ValueError:
            return JSONResponse({"error": "invalid json"}, status_code=400)
        if not isinstance(data, dict):
            return JSONResponse({"error": "invalid"}, status_code=422)
        results.mkdir(parents=True, exist_ok=True)
        tmp = results_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, results_file)
        return JSONResponse({"saved": True})

    qa_static = StaticFiles(directory=str(HERE / "qa"), html=True)
    qa = Starlette(
        routes=[
            Route("/api/ping", ping),
            Route("/api/info", info),
            Route("/api/mails", mail_list),
            Route("/api/mails/{mail_id}", mail_detail),
            Route("/api/mails/{mail_id}/html", mail_html),
            Route("/api/checklist", checklist),
            Route("/api/results", get_results, methods=["GET"]),
            Route("/api/results", put_results, methods=["PUT"]),
            Mount("/", qa_static),
        ]
    )

    studio_static = StaticFiles(directory=str(studio))
    index = studio / "index.html"

    async def studio_app(scope, receive, send):
        path = scope["path"]
        candidate = (studio / path.lstrip("/")).resolve()
        inside = studio.resolve() in candidate.parents or candidate == studio.resolve()
        if path == "/" or not inside or not candidate.is_file():
            if "." in path.rsplit("/", 1)[-1] and path != "/":
                response: Response = PlainTextResponse("Not found", status_code=404)
            else:
                response = FileResponse(index, headers={"Cache-Control": "no-cache"})
            await response(scope, receive, send)
            return
        await studio_static(scope, receive, send)

    def with_headers(app, headers: dict[str, str]):
        raw = [(k.lower().encode(), v.encode()) for k, v in headers.items()]

        async def wrapped(scope, receive, send):
            async def send_with_headers(message):
                if message["type"] == "http.response.start":
                    present = {k for k, _ in message.get("headers", [])}
                    message = dict(message)
                    message["headers"] = list(message.get("headers", [])) + [h for h in raw if h[0] not in present]
                await send(message)

            await app(scope, receive, send_with_headers)

        return wrapped

    studio_with_headers = with_headers(studio_app, SECURITY_HEADERS)
    qa_with_headers = with_headers(qa, SECURITY_HEADERS)

    async def router(scope, receive, send):
        if scope["type"] == "lifespan":
            await api(scope, receive, send)
            return
        if scope["type"] not in ("http", "websocket"):
            return
        host = dict(scope.get("headers", [])).get(b"host", b"").decode("latin-1")
        if host not in origin_hosts:
            await PlainTextResponse("Unknown host", status_code=421)(scope, receive, send)
            return
        path = scope["path"]
        if host.startswith("localhost") and not path.startswith("/v1"):
            # Studio's session cookie and Axentra's allowed origin are bound to 127.0.0.1.
            query = scope.get("query_string", b"").decode("latin-1")
            await RedirectResponse(origin + path + (f"?{query}" if query else ""))(scope, receive, send)
            return
        if path == "/v1" or path.startswith("/v1/"):
            await api(scope, receive, send)
        elif path == "/qa":
            await RedirectResponse("/qa/")(scope, receive, send)
        elif path.startswith("/qa/"):
            sub = dict(scope, path=path[3:], root_path=scope.get("root_path", "") + "/qa")
            await qa_with_headers(sub, receive, send)
        else:
            await studio_with_headers(scope, receive, send)

    return router


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--config", required=True, type=Path)
    p.add_argument("--port", required=True, type=int)
    p.add_argument("--studio", required=True, type=Path)
    p.add_argument("--state", required=True, type=Path)
    p.add_argument("--kit", required=True, type=Path)
    p.add_argument("--results", required=True, type=Path)
    a = p.parse_args()
    from axentra.audit.logging import configure_logging
    from axentra.config.settings import load_settings

    obs = load_settings(str(a.config)).observability
    configure_logging(obs.log_level, obs.log_format)
    app = build(a.config, a.port, a.studio, a.state, a.kit, a.results)
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=a.port,
        proxy_headers=False,
        server_header=False,
        access_log=False,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
