#!/usr/bin/env python3
"""
Build script — menggabungkan src/ menjadi satu file index.html mandiri.
Build script — inlines everything in src/ into a single standalone index.html.

    python3 build.py            # tulis index.html / write index.html
    python3 build.py --check    # gagal bila index.html tidak sinkron / fail if out of sync
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"


def build() -> str:
    template = (SRC / "index.template.html").read_text(encoding="utf-8")
    data = (SRC / "data.js").read_text(encoding="utf-8")
    app = (SRC / "app.js").read_text(encoding="utf-8")

    for name, source in (("data.js", data), ("app.js", app)):
        if "</script" in source.lower():
            sys.exit(f"error: {name} contains a literal </script> and cannot be inlined")

    html = template.replace("<!--DATA-->", "<script>\n" + data + "\n</script>")
    html = html.replace("<!--APP-->", '<script type="module">\n' + app + "\n</script>")

    if "<!--DATA-->" in template and "<script>" not in html:
        sys.exit("error: placeholder substitution failed")
    return html


def main() -> None:
    html = build()
    if "--check" in sys.argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != html:
            sys.exit("index.html is out of sync with src/ — run `python3 build.py`")
        print("index.html is in sync with src/")
        return
    OUT.write_text(html, encoding="utf-8")
    print(f"built {OUT.name} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
