#!/usr/bin/env python3
"""Notify IndexNow about changed, indexable pages in this repository.

Dry-run is the default. Pass --submit only from an approved deployment path.
The script intentionally skips noindex pages and non-HTML asset changes.
"""

from __future__ import annotations

import argparse
import datetime as dt
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen


class HeadMetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical: str | None = None
        self.noindex = False
        self.in_head = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        values = {str(key).lower(): (value or "") for key, value in attrs}
        if tag == "head":
            self.in_head = True
            return
        if not self.in_head:
            return
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href") or self.canonical
        if tag == "meta" and values.get("name", "").lower() == "robots":
            directives = {part.strip().lower() for part in values.get("content", "").split(",")}
            self.noindex = "noindex" in directives or "none" in directives

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "head":
            self.in_head = False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default="scripts/indexnow-config.json")
    parser.add_argument("--base", help="Git revision before the deployment")
    parser.add_argument("--head", default="HEAD", help="Git revision deployed (default: HEAD)")
    parser.add_argument("--url", action="append", default=[], help="Explicit changed URL; repeat as needed")
    parser.add_argument("--submit", action="store_true", help="Send the request to IndexNow")
    parser.add_argument("--output", help="Optional JSON result path")
    return parser.parse_args()


def git_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip()).resolve()


def load_config(root: Path, path: str) -> dict[str, str]:
    config_path = (root / path).resolve()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    required = {"host", "endpoint", "keyFile", "keyLocation"}
    missing = sorted(required - set(config))
    if missing:
        raise ValueError(f"IndexNow config is missing: {', '.join(missing)}")
    return {key: str(value) for key, value in config.items()}


def normalize_url(value: str, host: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme != "https" or parsed.netloc.lower() != host.lower():
        raise ValueError(f"URL is outside the configured HTTPS host: {value}")
    path = parsed.path or "/"
    return urlunsplit(("https", host, path, parsed.query, ""))


def path_url(relative_path: str, host: str) -> str | None:
    clean_path = relative_path.replace("\\", "/").lstrip("/")
    if not clean_path.endswith(".html"):
        return None
    if clean_path == "index.html":
        suffix = "/"
    elif clean_path.endswith("/index.html"):
        suffix = "/" + clean_path[: -len("index.html")]
    else:
        suffix = "/" + clean_path
    return f"https://{host}{suffix}"


def current_html_url(root: Path, relative_path: str, host: str) -> tuple[str | None, str | None]:
    file_path = (root / relative_path).resolve()
    if root not in file_path.parents or not file_path.is_file():
        return None, "missing"
    parser = HeadMetadataParser()
    parser.feed(file_path.read_text(encoding="utf-8", errors="replace"))
    if parser.noindex:
        return None, "noindex"
    fallback = path_url(relative_path, host)
    if not fallback:
        return None, "not_html"
    candidate = urljoin(fallback, parser.canonical) if parser.canonical else fallback
    try:
        return normalize_url(candidate, host), None
    except ValueError:
        return None, "external_canonical"


def changed_html_paths(root: Path, base: str | None, head: str) -> list[tuple[str, str]]:
    if not base:
        probe = subprocess.run(
            ["git", "rev-parse", f"{head}^"],
            cwd=root,
            capture_output=True,
            text=True,
        )
        base = probe.stdout.strip() if probe.returncode == 0 else None
    if not base:
        return []
    result = subprocess.run(
        ["git", "diff", "--name-status", "--find-renames", base, head],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    changes: list[tuple[str, str]] = []
    for raw_line in result.stdout.splitlines():
        fields = raw_line.split("\t")
        status = fields[0]
        if status.startswith(("R", "C")) and len(fields) == 3:
            old_path, new_path = fields[1], fields[2]
            if status.startswith("R") and old_path.endswith(".html"):
                changes.append(("D", old_path))
            if new_path.endswith(".html"):
                changes.append(("A", new_path))
        elif len(fields) == 2 and fields[1].endswith(".html"):
            changes.append((status[:1], fields[1]))
    return changes


def collect_urls(
    root: Path,
    config: dict[str, str],
    base: str | None,
    head: str,
    explicit_urls: list[str],
) -> tuple[list[str], list[dict[str, str]]]:
    host = config["host"]
    urls = {normalize_url(value, host) for value in explicit_urls}
    decisions: list[dict[str, str]] = []
    changes = [] if explicit_urls and base is None else changed_html_paths(root, base, head)
    for status, relative_path in changes:
        if status == "D":
            value = path_url(relative_path, host)
            if value:
                urls.add(value)
                decisions.append({"path": relative_path, "decision": "submit_deleted_url"})
            continue
        value, reason = current_html_url(root, relative_path, host)
        if value:
            urls.add(value)
            decisions.append({"path": relative_path, "decision": "submit_indexable_url"})
        else:
            decisions.append({"path": relative_path, "decision": f"skip_{reason or 'unknown'}"})
    return sorted(urls), decisions


def verify_key(config: dict[str, str], key: str) -> None:
    request = Request(config["keyLocation"], headers={"User-Agent": "PMHNPBilling-IndexNow/1.0"})
    with urlopen(request, timeout=20) as response:
        body = response.read(1024).decode("utf-8", errors="replace").strip()
        if response.status != 200 or body != key:
            raise RuntimeError(f"Live IndexNow key verification failed with HTTP {response.status}")


def send(config: dict[str, str], key: str, urls: list[str]) -> tuple[int, str]:
    payload = json.dumps(
        {
            "host": config["host"],
            "key": key,
            "keyLocation": config["keyLocation"],
            "urlList": urls,
        }
    ).encode("utf-8")
    request = Request(
        config["endpoint"],
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "PMHNPBilling-IndexNow/1.0",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.status, response.read(4096).decode("utf-8", errors="replace").strip()


def emit(result: dict[str, object], output: str | None, root: Path) -> None:
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if output:
        output_path = (root / output).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    print(rendered, end="")


def main() -> int:
    args = parse_args()
    root = git_root()
    config = load_config(root, args.config)
    key_path = (root / config["keyFile"]).resolve()
    key = key_path.read_text(encoding="utf-8").strip()
    if not (8 <= len(key) <= 128) or not all(character.isalnum() or character == "-" for character in key):
        raise ValueError("IndexNow key has an invalid format")

    urls, decisions = collect_urls(root, config, args.base, args.head, args.url)
    result: dict[str, object] = {
        "schemaVersion": "pmhnp-indexnow-submission.v1",
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "submit" if args.submit else "dry_run",
        "host": config["host"],
        "endpoint": config["endpoint"],
        "keyLocation": config["keyLocation"],
        "urlCount": len(urls),
        "urls": urls,
        "pathDecisions": decisions,
    }
    if not urls:
        result["status"] = "no_changed_indexable_urls"
        emit(result, args.output, root)
        return 0
    if not args.submit:
        result["status"] = "dry_run_ready"
        emit(result, args.output, root)
        return 0

    try:
        verify_key(config, key)
        status_code, response_body = send(config, key, urls)
        result["httpStatus"] = status_code
        result["responseBody"] = response_body
        result["status"] = "accepted" if status_code in (200, 202) else "unexpected_response"
        emit(result, args.output, root)
        return 0 if status_code in (200, 202) else 1
    except HTTPError as error:
        result["status"] = "http_error"
        result["httpStatus"] = error.code
        result["responseBody"] = error.read(4096).decode("utf-8", errors="replace").strip()
    except (URLError, OSError, RuntimeError) as error:
        result["status"] = "request_error"
        result["error"] = str(error)
    emit(result, args.output, root)
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, subprocess.CalledProcessError) as error:
        print(json.dumps({"status": "configuration_error", "error": str(error)}), file=sys.stderr)
        raise SystemExit(2)
