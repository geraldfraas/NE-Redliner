#!/usr/bin/env python3
"""Build index.html, the copy of app.html to put on a web server.

app.html is written for the claude.ai artifact viewer, which wraps every page in
a small shell (doctype, UTF-8 declaration, phone viewport, a CSS reset). On a
plain web server that shell is missing, so this script adds the same one, and:

  * writes every non-ASCII character as an escape (\\uXXXX inside the script,
    &#N; in the page text), so the file reads correctly whatever text encoding
    the server announces;
  * stamps the version, "<commit> . <date>" of the last change to app.html,
    into APP_VERSION (shown in the page footer; app.html itself says 'dev');
  * drops the claude.ai-only viewport meta line.

Usage (from anywhere):
    python3 tools/make_index.py            write index.html next to app.html
    python3 tools/make_index.py --check    exit 1 if index.html is out of date

Upload index.html to the server. It is one self-contained file: no other files,
no server-side software, no network requests.
"""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "app.html", ROOT / "index.html"

# The same reset the claude.ai viewer applies, so the page looks the same in both places.
RESET = (
    ":root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);"
    "padding-bottom:env(safe-area-inset-bottom,0px)}"
    "html{scroll-padding-top:env(safe-area-inset-top,0px)}"
    "body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}"
    "img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}"
)


def git(*args):
    try:
        r = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None
    except OSError:
        return None


def version():
    last = git("log", "-1", "--format=%h|%cs", "--", "app.html")
    if not last:
        return "dev"
    h, d = last.split("|")
    edited = subprocess.run(["git", "-C", str(ROOT), "diff", "--quiet", "HEAD", "--", "app.html"]).returncode != 0
    return f"{h}{'+edited' if edited else ''} · {d}"


def ascii_safe(html):
    """Escape non-ASCII: \\uXXXX inside <script> blocks, &#N; everywhere else."""
    def js(m):
        return "".join(
            c if ord(c) < 128 else "".join("\\u%04x" % u for u in (
                [ord(c)] if ord(c) < 0x10000
                else [0xD800 + ((ord(c) - 0x10000) >> 10), 0xDC00 + ((ord(c) - 0x10000) & 0x3FF)]))
            for c in m.group(0))
    parts = re.split(r"(<script\b[^>]*>.*?</script>)", html, flags=re.S)
    out = []
    for p in parts:
        if p.startswith("<script"):
            out.append(js(re.match(r".*", p, re.S)))
        else:
            out.append("".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in p))
    return "".join(out)


def build():
    s = SRC.read_text(encoding="utf-8")
    m = re.match(r"\s*(<title>.*?</title>)\s*", s, re.S)
    if not m:
        sys.exit("app.html must start with a <title> element")
    title, body = m.group(1), s[m.end():]
    body = re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>\s*', "", body)
    if body.count("const APP_VERSION='dev';") != 1:
        sys.exit("expected exactly one  const APP_VERSION='dev';  in app.html")
    body = body.replace("const APP_VERSION='dev';", "const APP_VERSION=%r;" % version().replace("'", ""), 1)
    page = (
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        + title + "<style>" + RESET + "</style></head><body>\n" + body.rstrip() + "\n</body></html>\n"
    )
    return ascii_safe(page)


if __name__ == "__main__":
    html = build()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="ascii") != html:
            sys.exit("index.html is out of date: run  python3 tools/make_index.py")
        print("index.html is up to date")
    else:
        OUT.write_text(html, encoding="ascii", newline="\n")
        print(f"wrote {OUT.name}: {len(html):,} bytes, version {version()}")
